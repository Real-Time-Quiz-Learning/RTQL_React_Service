import React, { useState, useEffect } from 'react';

// --- Type Definitions ---
interface Student {
    id: string;
    name: string;
    score: number;
    correct?: number; // number of correct answers
    // active time bookkeeping: accumulated seconds and optional resume timestamp
    totalActiveTime?: number; // accumulated seconds
    joinedAt?: number; // ms timestamp when they became active
    status: 'Active' | 'Inactive';
}

interface OverseerPanelProps {
    quizActive: boolean;
    questionsLength: number;
    // optional teacher socket so the panel can subscribe directly to join events
    teacherSocket?: any;
    // optional room filter - only show students for this room if provided
    currentRoomId?: string;
}
const OverseerPanel: React.FC<OverseerPanelProps> = ({ quizActive, questionsLength, teacherSocket, currentRoomId }) => {
    // Fully socket-driven: start empty and build roster from socket events
    const [studentData, setStudentData] = useState<Student[]>([]);
    const [totalQuestions, setTotalQuestions] = useState<number>(questionsLength);
    // tick state to update live displayTime while quizActive
    const [nowTick, setNowTick] = useState<number>(0);

    useEffect(() => {
        setTotalQuestions(questionsLength);
    }, [questionsLength]);

    // If a teacherSocket is provided, subscribe to join/leave/answer events so the panel
    // maintains its own live roster. Optionally filter by currentRoomId if provided.
    useEffect(() => {
        if (!teacherSocket) return;

        const addOrActivateStudent = (payload: any) => {
            console.debug('[Overseer] addOrActivateStudent raw payload:', payload);
            const student = payload?.student ?? payload ?? (typeof payload === 'string' ? { name: payload } : null);
            const room = payload?.roomId ?? payload?.room ?? payload?.roomIdString;
            if (currentRoomId && room && room !== currentRoomId) return;

            const id = student?.id ?? student?.studentId ?? student?.socketId ?? payload?.id ?? payload?.sid ?? student?.name ?? payload ?? undefined;
            // prefer common nickname fields and server-specific 'snick'
            const name = (
                student?.name || student?.nickname || student?.nick || student?.nickName || student?.snick || payload?.snick || payload?.nickname || payload?.nick || payload || student?.name
            );
            const normalizedName = typeof name === 'string' ? name.trim() : (name ? String(name) : 'Student');
            if (!id) return;
            const now = Date.now();
            setStudentData(prev => {
                const exists = prev.find(s => s.id === id);
                if (exists) {
                    return prev.map(s => s.id === id ? { ...s, status: 'Active', name: normalizedName ?? s.name, joinedAt: s.joinedAt ?? now } : s);
                }
                return [...prev, { id, name: normalizedName ?? 'Student', score: 0, correct: 0, totalActiveTime: 0, joinedAt: now, status: 'Active' }];
            });
        };

        const handleLeft = (payload: any) => {
            console.debug('[Overseer] handleLeft raw payload:', payload);
            const studentId = payload?.studentId ?? payload?.id ?? payload?.sid ?? payload ?? (typeof payload === 'string' ? payload : undefined);
            const room = payload?.roomId ?? payload?.room;
            if (currentRoomId && room && room !== currentRoomId) return;
            if (!studentId) return;
            const now = Date.now();
            setStudentData(prev => prev.map(s => {
                if (s.id !== studentId) return s;
                const added = s.joinedAt ? Math.floor((now - s.joinedAt) / 1000) : 0;
                return { ...s, totalActiveTime: (s.totalActiveTime ?? 0) + added, joinedAt: undefined, status: 'Inactive' };
            }));
        };

        const handleAnswer = (payload: any) => {
            console.debug('[Overseer] handleAnswer raw payload:', payload);
            const studentId = payload?.studentId ?? payload?.id ?? payload?.sid ?? payload?.studentId ?? payload?.student?.id;
            const room = payload?.roomId ?? payload?.room;
            if (currentRoomId && room && room !== currentRoomId) return;
            if (!studentId) return;
            // Some server events may include correctness as a boolean or 'correct' key, or the answer object may include it
            const correct = Boolean(payload?.correct || payload?.isCorrect || payload?.answer?.correct);
            const points = typeof payload?.points === 'number' ? payload.points : (correct ? 1 : 0);
            setStudentData(prev => prev.map(s => {
                if (s.id !== studentId) return s;
                return { ...s, correct: (s.correct ?? 0) + (correct ? 1 : 0), score: Math.min((s.score ?? 0) + points, questionsLength) };
            }));
        };

        const handleQuizStats = (payload: any) => {
            console.debug('[Overseer] handleQuizStats raw payload:', payload);
            // Support multiple payload shapes:
            // - { clientId: number, ... } (object map of id->count)
            // - { stats: { clientId: number } }
            // - [ { clientId: 'abc', correct: 1 }, ... ]
            // - { clientId: { correct: 1, ... }, ... }

            // Build a normalized map: stringId -> numericCorrectCount
            const normalized: Record<string, number> = {};

            if (!payload) return;

            // If payload is an object map or contains a 'stats' wrapper
            const candidateMap = (typeof payload === 'object' && !Array.isArray(payload)) ? (payload.stats ?? payload.data ?? payload) : null;

            if (candidateMap && typeof candidateMap === 'object' && !Array.isArray(candidateMap)) {
                for (const [k, v] of Object.entries(candidateMap)) {
                    if (typeof v === 'number') {
                        normalized[String(k)] = v;
                        continue;
                    }
                    if (v && typeof v === 'object') {
                        const vv: any = v;
                        const n = (vv.correct ?? vv.count ?? vv.value ?? vv.score);
                        if (typeof n === 'number') normalized[String(k)] = n;
                    }
                }
            }

            // If payload is an array (list of per-client objects)
            if (Array.isArray(payload)) {
                for (const item of payload) {
                    if (!item || typeof item !== 'object') continue;
                    const id = item.clientId ?? item.client_id ?? item.id ?? item.socketId ?? item.sid ?? item.studentId;
                    const n = (typeof item.correct === 'number' ? item.correct : (typeof item.count === 'number' ? item.count : (typeof item.value === 'number' ? item.value : undefined)));
                    if (id && typeof n === 'number') normalized[String(id)] = n;
                }
            }

            // If candidateMap was empty but payload itself is a flat map-like object (string keys)
            if (Object.keys(normalized).length === 0 && candidateMap && typeof candidateMap === 'object') {
                for (const [k, v] of Object.entries(candidateMap)) {
                    if (typeof v === 'number') normalized[String(k)] = v;
                }
            }

            if (Object.keys(normalized).length === 0) {
                // nothing to apply
                return;
            }

            // Helper to find a matching stat value for a student record by trying multiple id variants
            const findForStudent = (s: any): number | undefined => {
                const tryKeys = [s.id, s.socketId, s.clientId, s.studentId, s.sid, s.id?.toString(), s.name];
                for (const k of tryKeys) {
                    if (k == null) continue;
                    const kk = String(k);
                    if (Object.prototype.hasOwnProperty.call(normalized, kk)) return normalized[kk];
                }
                // as a last resort, try partial match: some servers send short socket ids or embed prefixes
                for (const [statKey, val] of Object.entries(normalized)) {
                    if (!statKey) continue;
                    if (s.id && String(statKey).includes(String(s.id))) return val;
                    if (s.name && String(statKey).includes(String(s.name))) return val;
                }
                return undefined;
            };

            setStudentData(prev => prev.map(s => {
                const cnt = findForStudent(s as any);
                if (typeof cnt === 'number') {
                    const correctCount = cnt;
                    const newScore = Math.min(correctCount, questionsLength);
                    console.debug('[Overseer] applying quizstats to student', { studentId: s.id, name: s.name, correctCount });
                    return { ...s, correct: correctCount, score: newScore };
                }
                return s;
            }));
        };


        // Subscribe
        // Subscribe to the canonical server events and several aliases. Add debug logs so we can
        // confirm at runtime which events the server actually emits (useful for flaky/variant naming).
        console.debug('[Overseer] subscribing to socket events', { room: currentRoomId });
        teacherSocket.on('incoming', (p: any) => { console.debug('[Overseer] incoming', p); /* optional parsing could go here */ });
        teacherSocket.on('quizRoomJoin', addOrActivateStudent);
        teacherSocket.on('userJoined', addOrActivateStudent);
        teacherSocket.on('studentJoined', addOrActivateStudent);

        teacherSocket.on('quizRoomLeave', handleLeft);
        teacherSocket.on('userLeaves', handleLeft);
        teacherSocket.on('studentLeft', handleLeft);

        // Answer events / responses
        teacherSocket.on('quizRoomPostQuestionAnswer', handleAnswer);
        teacherSocket.on('quizRoomAnswer', handleAnswer);
        teacherSocket.on('responsePosted', handleAnswer);
        teacherSocket.on('studentAnswer', handleAnswer);
        teacherSocket.on('quizStats', handleQuizStats);


        // Debug helper: log when a quizStats payload arrives (handled inside handleQuizStats too)
        const dbgStats = (p: any) => console.debug('[Overseer] received quizstats event', p);
        teacherSocket.on('quizstats_debug', dbgStats);

        return () => {
            console.debug('[Overseer] unsubscribing from socket events', { room: currentRoomId });
            teacherSocket.off('incoming');
            teacherSocket.off('quizRoomJoin', addOrActivateStudent);
            teacherSocket.off('userJoined', addOrActivateStudent);
            teacherSocket.off('studentJoined', addOrActivateStudent);

            teacherSocket.off('quizRoomLeave', handleLeft);
            teacherSocket.off('userLeaves', handleLeft);
            teacherSocket.off('studentLeft', handleLeft);

            teacherSocket.off('quizRoomPostQuestionAnswer', handleAnswer);
            teacherSocket.off('quizRoomAnswer', handleAnswer);
            teacherSocket.off('responsePosted', handleAnswer);
            teacherSocket.off('studentAnswer', handleAnswer);
            teacherSocket.off('quizStats', handleQuizStats);

        };
    }, [teacherSocket, currentRoomId, questionsLength]);

    // When quiz is active and we have students, tick every second so live time updates
    useEffect(() => {
        if (!quizActive) return;
        if (!studentData || studentData.length === 0) return;
        const interval = setInterval(() => setNowTick(n => n + 1), 1000);
        return () => clearInterval(interval);
    }, [quizActive, studentData]);

    const activeStudents = studentData.filter(s => s.status === 'Active').length;
    // compute a derived displayTime (seconds) for each student, then sort by score desc, time asc
    const withDisplayTime = studentData.map(s => {
        const resume = s.joinedAt ? Math.floor((Date.now() - s.joinedAt) / 1000) : 0;
        const displayTime = (s.totalActiveTime ?? 0) + (s.status === 'Active' ? resume : 0);
        return { ...s, displayTime } as Student & { displayTime: number };
    });
    // Sort primarily by how many correct answers a student has (descending),
    // then by score (descending), then by active time (ascending)
    const sortedStudents = ([...withDisplayTime] as Array<Student & { displayTime: number }>).sort((a, b) => {
        const aCorrect = (a.correct ?? 0);
        const bCorrect = (b.correct ?? 0);
        if (bCorrect !== aCorrect) return bCorrect - aCorrect;
        const aScore = (a.score ?? 0);
        const bScore = (b.score ?? 0);
        if (bScore !== aScore) return bScore - aScore;
        return a.displayTime - b.displayTime;
    });

    return (
        <div className="p-6 bg-white rounded-xl shadow-2xl border border-indigo-200">
            <h2 className="text-2xl font-extrabold text-indigo-700 mb-4 border-b pb-2">Overseer Panel</h2>
            
            <div className="grid grid-cols-2 gap-4 text-center mb-6">
                <div className="p-3 bg-indigo-50 rounded-lg shadow-inner">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Active Students</p>
                    <p className="text-3xl font-bold text-indigo-600 mt-1">{activeStudents}</p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg shadow-inner">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Total Questions</p>
                    <p className="text-3xl font-bold text-indigo-600 mt-1">{totalQuestions}</p>
                </div>
            </div>

            {/* Leaderboard Table */}
            <h3 className="text-lg font-bold text-gray-800 mb-3">Real-Time Leaderboard</h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-md">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Time (s)</th>
                            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Correct</th>
                            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedStudents.map((student, index) => (
                            <tr key={student.id} className={index < 3 ? 'bg-yellow-50/50 font-semibold' : ''}>
                                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 font-bold">
                                    {index + 1}
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-800">
                                    {student.name}
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap text-sm text-right">
                                    <span className="text-lg font-extrabold text-indigo-600">{student.score}</span> / {totalQuestions}
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                                    {/* show accumulated seconds as integer */}
                                    {(student as any).displayTime}
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                                    {student.correct ?? 0}
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap text-sm text-center">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        student.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {student.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Quiz Status Indicator */}
            <div className={`mt-6 p-3 rounded-lg text-center font-bold text-white shadow-inner transition ${
                quizActive ? 'bg-green-500' : 'bg-gray-400'
            }`}>
                Quiz is {quizActive ? 'LIVE' : 'INACTIVE'}
            </div>
        </div>
    );
};

export default OverseerPanel;