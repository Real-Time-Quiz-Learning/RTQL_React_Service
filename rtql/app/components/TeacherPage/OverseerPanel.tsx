import React, { useState, useEffect } from 'react';

// --- Type Definitions ---
interface Student {
    id: string;
    name: string;
    score: number;
    time: number; // Time elapsed since starting quiz or last interaction (mock)
    status: 'Active' | 'Inactive';
}

interface OverseerPanelProps {
    quizActive: boolean;
    questionsLength: number;
}

const MOCK_STUDENTS: Student[] = [
    { id: 's1', name: 'Alice', score: 5, time: 25, status: 'Active' },
];

const OverseerPanel: React.FC<OverseerPanelProps> = ({ quizActive, questionsLength }) => {
    const [studentData, setStudentData] = useState<Student[]>(MOCK_STUDENTS);
    const [totalQuestions, setTotalQuestions] = useState<number>(questionsLength);

    useEffect(() => {
        // Update total questions whenever the prop changes
        setTotalQuestions(questionsLength);

        // Mock real-time update logic
        const interval = setInterval(() => {
            if (!quizActive) return; // Only update mock data if quiz is active

            setStudentData(prevData => prevData.map(student => ({
                ...student,
                // Mock score update (ensuring score doesn't exceed total questions)
                score: Math.min(questionsLength, student.score + (Math.random() < 0.05 ? 1 : 0)), 
                // Mock status/time update
                status: Math.random() < 0.1 ? 'Inactive' : 'Active',
                time: student.status === 'Active' ? student.time + Math.floor(Math.random() * 5) : student.time,
            })));
        }, 3000); // Update every 3 seconds

        return () => clearInterval(interval);
    }, [questionsLength, quizActive]);


    const activeStudents = studentData.filter(s => s.status === 'Active').length;
    // Sort by score (descending) then time (ascending) for ranking
    const sortedStudents = [...studentData].sort((a, b) => b.score - a.score || a.time - b.time);

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
                                    {student.time}
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