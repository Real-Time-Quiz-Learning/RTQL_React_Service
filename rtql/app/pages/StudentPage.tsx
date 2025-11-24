"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader'; // Added
import AppFooter from '../components/layout/AppFooter'; // Added
import OverseerPanel from '../components/TeacherPage/OverseerPanel';
import { getSocket, createStudentSocket, setSocket } from '~/lib/socketClient';

interface Question {
  id: string;
  question: string;
  options: string[];
  correct?: number; // teacher-side info may not be sent to students
  explanation?: string;
}

const SOCKET_BASE = 'http://64.181.233.131:3677/student';

export default function StudentPage() {
  const [connected, setConnected] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [name, setName] = useState('');
  const socketRef = useRef<any>(null);

  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const currentQuestionRef = useRef<Question | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // On unmount, do not disconnect shared socket (we want it to persist across route changes).
    return () => {
      // If the socket was created solely for this page (not shared), we could disconnect here.
    };
  }, []);

  useEffect(() => {
    // Try to reuse a socket created by JoinGameSection
    const shared = getSocket();
    const state = (location && (location as any).state) || {};
    const params = new URLSearchParams(window.location.search || '');
    const qRoom = state.room ?? params.get('room');
    const qName = state.name ?? params.get('name');

    const setupListeners = (socket: any) => {
      // ensure listeners are set (remove previous to avoid duplication)
      try {
        // remove previous listeners
        if (typeof socket.offAny === 'function') socket.offAny();
        socket.off('QuestionPosted');
        socket.off('quizRoomJoinAck');
        socket.off('quizRoomPostQuestion');
        socket.off('quizRoomQuestionInactive');
        socket.off('questionInactive');
        socket.off('markQuestionInactive');
        socket.off('mark_question_inactive');
        socket.off('questionMarkedInactive');
        socket.off('markquestioninactive');
        socket.off('inactiveQuestion');
  socket.off('questionClosed');
  socket.off('closeQuestion');
  socket.off('questionRemoved');
  socket.off('questionremoved');
        socket.off('questionPosted');
        socket.off('questionposted');
      } catch (e) {}

      // Helper to normalize various incoming question payload shapes
      const parseIncomingQuestion = (payload: any): Question | null => {
        if (!payload) return null;
        // If server sends an array [question], pick first
        const raw = Array.isArray(payload) && payload.length ? payload[0] : payload;

        // If payload wraps the question in a `question` property, use that object
        const candidate = (raw && typeof raw === 'object' && (raw.question || raw.qid || raw.id)) ? raw : (raw?.question ? raw.question : raw);

        // If candidate is a primitive (string), wrap it into object
        const obj = (candidate && typeof candidate === 'object') ? candidate : { question: String(candidate) };

        const normalized: Question = {
          id: obj.qid ?? obj.id ?? obj.questionId ?? '',
          question: obj.question ?? obj.text ?? obj.prompt ?? '',
          options: obj.options ?? obj.choices ?? [],
          explanation: obj.explanation ?? obj.explain ?? '',
        };
        return normalized;
      };

      socket.on('QuestionPosted', (payload: any) => {
        const normalized = parseIncomingQuestion(payload);
        console.log('[Student] normalized QuestionPosted ->', normalized, 'raw:', payload);
        if (normalized) {
          setCurrentQuestion(normalized);
          setSelectedIndex(null);
          setAnswered(false);
          setStatusMsg('New question posted');
        }
      });

      // Some servers may forward the teacher event name directly to students
      socket.on('quizRoomPostQuestion', (payload: any) => {
        const normalized = parseIncomingQuestion(payload);
        console.log('[Student] Received quizRoomPostQuestion:', payload, 'normalized:', normalized);
        if (normalized) {
          setCurrentQuestion(normalized);
          setSelectedIndex(null);
          setAnswered(false);
          setStatusMsg('New question posted (quizRoomPostQuestion)');
        }
      });

      // Some servers may use a different lowercase event name
      socket.on('questionPosted', (payload: any) => {
        const normalized = parseIncomingQuestion(payload);
        console.log('[Student] Received questionPosted:', payload, 'normalized:', normalized);
        if (normalized) {
          setCurrentQuestion(normalized);
          setSelectedIndex(null);
          setAnswered(false);
          setStatusMsg('New question posted (questionPosted)');
        }
      });

      // also accept other casing
      socket.on('questionposted', (payload: any) => {
        const normalized = parseIncomingQuestion(payload);
        console.log('[Student] Received questionposted:', payload, 'normalized:', normalized);
        if (normalized) {
          setCurrentQuestion(normalized);
          setSelectedIndex(null);
          setAnswered(false);
          setStatusMsg('New question posted (questionposted)');
        }
      });

      // Teacher may mark a question inactive. Listen for that and remove the question from the student's view.
      const handleQuestionInactive = (...args: any[]) => {
        // Scan args to find a qid candidate in multiple possible shapes
        let foundQid: any = undefined;
        for (const a of args) {
          if (a === null || a === undefined) continue;
          if (typeof a === 'string' || typeof a === 'number') {
            // a primitive might be qid or roomId; we prefer numeric/short ids that look like a qid
            // but we can't be certain, so only take it if it matches currentQuestion.id when present
            const activeQ = currentQuestionRef.current;
            if (activeQ && String(activeQ.id) === String(a)) {
              foundQid = a;
              break;
            }
            // otherwise tentatively capture it as a candidate
            if (!foundQid) foundQid = a;
          } else if (typeof a === 'object') {
            // object may directly contain qid/id/questionId or a nested question
            const candidate = a.qid ?? a.id ?? a.questionId ?? (a.question && (a.question.qid ?? a.question.id));
            if (candidate) {
              foundQid = candidate;
              break;
            }
          }
        }

        if (!foundQid) return;
        const qidStr = String(foundQid);
        const activeQ2 = currentQuestionRef.current;
        if (activeQ2 && String(activeQ2.id) === qidStr) {
          console.log('[Student] Current question marked inactive by teacher:', qidStr);
          setCurrentQuestion(null);
          setSelectedIndex(null);
          setAnswered(false);
          setStatusMsg('This question was closed by the teacher.');
        } else {
          // If no currentQuestion match, still check if the args indicate deactivation of the last question
          // For safety: if there is no queued/next question, and the room matches, clear current question.
          // This handles servers that emit room-only inactive notifications without qid.
          const roomCandidate = args.find(a => typeof a === 'string' && a === roomId);
          if (roomCandidate && currentQuestionRef.current) {
            console.log('[Student] Received room-level inactive for room; clearing current question.');
            setCurrentQuestion(null);
            setSelectedIndex(null);
            setAnswered(false);
            setStatusMsg('This question was closed by the teacher.');
          }
        }
      };

      // Listen for many possible server event names that signal a question was closed/inactivated
      const inactiveEventNames = [
        'quizRoomQuestionInactive', 'questionInactive', 'markQuestionInactive', 'mark_question_inactive',
        'questionMarkedInactive', 'markquestioninactive', 'inactiveQuestion', 'questionClosed', 'closeQuestion', 'questionRemoved', 'questionremoved'
      ];
      inactiveEventNames.forEach(name => socket.on(name, handleQuestionInactive));

      // Debug: log any incoming socket events to help trace server behavior
      if (typeof socket.onAny === 'function') {
        socket.onAny((event: string, ...args: any[]) => {
          console.log('[Student] socket event:', event, args);
          try {
            const e = String(event || '').toLowerCase();
            // If the server emits any event whose name suggests inactivity/closure, attempt to clear the current question
            if (e.includes('inactive') || e.includes('inactivequestion') || e.includes('closed') || e.includes('endquestion')) {
              // forward to the same handler so we get consistent parsing
              try {
                (handleQuestionInactive as any)(...args);
              } catch (err) {
                // fallback: clear unconditionally if room matches
                const roomMatch = args.find((a: any) => typeof a === 'string' && a === roomId);
                if (roomMatch) {
                  setCurrentQuestion(null);
                  setSelectedIndex(null);
                  setAnswered(false);
                  setStatusMsg('This question was closed by the teacher.');
                }
              }
            }
          } catch (e) {
            // swallow logging errors
          }
        });
      }

      socket.on('quizRoomJoinAck', () => {
        setConnected(true);
        setStatusMsg('Joined room successfully. Waiting for questions...');
      });

      // Some servers emit a 'userJoin' event when the user has successfully joined
      socket.on('userJoin', (payload: any) => {
        console.log('[Student] received userJoin:', payload);
        setConnected(true);
        setStatusMsg('Joined room successfully. Waiting for questions...');
      });

      socket.on('error', (err: any) => {
        console.error('Socket error', err);
        setStatusMsg('Socket error: ' + String(err));
      });
      
      // cleanup for new listeners will be handled in the off calls below
    };


    if (shared) {
      socketRef.current = shared;
      setupListeners(shared);

      setConnected(true);
      setRoomId(qRoom ?? (shared as any).auth?.roomId ?? '');
      setName(qName ?? (shared as any).auth?.name ?? '');
      setStatusMsg('Connected via shared socket');
      return;
    }
    // No socket and no join info — instruct the user to join from Home
    setStatusMsg('Please join a quiz from the Home page (use JOIN QUIZ).');
  }, [location]);


  // Keep a ref updated so socket listeners (which close over a single render) can read latest question
  useEffect(() => {
    currentQuestionRef.current = currentQuestion;
  }, [currentQuestion]);


  const submitAnswer = () => {
    if (!socketRef.current || !currentQuestion || selectedIndex === null || answered) return;

    // Primary (requested) emit: roomId, { qid, response }
    try {
      socketRef.current.emit('quizRoomPostQuestionAnswer', roomId, { qid: currentQuestion.id, response: selectedIndex });
    } catch (e) {
      console.warn('Primary emit failed:', e);
    }

    // (legacy emit removed) Only send the canonical 'quizRoomPostQuestionAnswer' event

    setAnswered(true);
    setStatusMsg('Answer submitted.');
  };

  const handleLeaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.emit('quizRoomLeave', { roomId, name });
      socketRef.current.disconnect();
      setConnected(false);
      setStatusMsg('Left room. Redirecting to Home...');
      // Give a slight delay for the message to show, then navigate
      setTimeout(() => navigate('/'), 1500); 
    } else {
        navigate('/'); // If no socket, just go home
    }
  };

  return (
    <>
      <AppHeader />
      <div className="min-h-screen bg-gray-100 font-sans p-4 sm:p-8">
        <header className="bg-white p-4 rounded-t-xl shadow-lg flex justify-between items-center mb-6 border-t-8 border-green-600"> 
          <div className="flex flex-col text-left">
            <h1 className="text-3xl font-extrabold text-gray-900">Student Quiz Portal</h1>
            <p className="text-sm text-gray-500 mt-1">
              {connected ? (
                <>
                  Room ID: <span className="font-mono bg-green-100 text-green-700 px-2 py-0.5 rounded-md text-xs">{roomId}</span>
                </>
              ) : (
                'Not joined yet.'
              )}
            </p>
          </div>
          <div className={`px-3 py-1 text-sm font-medium rounded-full ${connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {connected ? 'Connected' : 'Disconnected'}
          </div>
        </header>

        <div className="flex items-start justify-center">
          <div className="w-full max-w-3xl">

            {/* Main Content Card */}
            <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-200 space-y-4">
              
              {/* Connection Status / Name Info */}
              <div className="flex justify-between items-center pb-4 border-b">
                <div className='flex flex-col'>
                    <p className="text-lg font-semibold text-gray-800">Welcome, <span className="font-extrabold text-green-600">{name || 'Guest'}</span>!</p>
                    <p className="text-xs text-gray-500 italic mt-1">{statusMsg}</p>
    
                </div>
                <button onClick={handleLeaveRoom} className="text-sm text-red-600 hover:text-red-800 transition duration-150 ease-in-out">
                    Leave Room
                </button>
              </div>

              {!connected ? (
                <div className="text-center p-6 bg-red-50 rounded-lg">
                  <p className="text-base text-red-700 mb-4">You must join a quiz room to participate.</p>
                  <button 
                    onClick={() => navigate('/')} 
                    className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition duration-200"
                  >
                    Go to Home Page to Join
                  </button>
                </div>
              ) : currentQuestion ? (
                /* Question Panel */
                <div className='pt-2'>
                  <h2 className="font-extrabold text-2xl text-gray-900 mb-4">{currentQuestion.question}</h2>
                  <div className="space-y-3">
                    {currentQuestion.options.map((opt, i) => (
                      // Apply distinct styling for selected/answered state
                      <button 
                        key={i} 
                        onClick={() => !answered && setSelectedIndex(i)} 
                        disabled={answered}
                        className={`block w-full text-left p-4 border rounded-lg transition duration-200 ease-in-out 
                                    ${answered && selectedIndex === i ? 'bg-green-100 border-green-500 shadow-md' : // Answered and selected
                                    selectedIndex === i ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-300 shadow-lg' : // Selected, not yet answered
                                    'bg-gray-50 hover:bg-gray-100 border-gray-300'}`} // Default state
                      >
                        <span className={`font-medium ${answered ? 'text-gray-800' : 'text-gray-700'}`}>
                          {String.fromCharCode(65 + i)}. {opt}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="flex space-x-3 mt-6">
                    <button 
                      onClick={submitAnswer} 
                      disabled={answered || selectedIndex === null} 
                      className={`px-6 py-3 font-bold rounded-lg transition duration-200 ease-in-out 
                                  ${(answered || selectedIndex === null) 
                                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                                    : 'bg-green-600 text-white hover:bg-green-700 shadow-md'}`
                                }
                    >
                      {answered ? 'Answer Submitted' : 'Submit Answer'}
                    </button>
                    {/* Simplified skip to just clear the question/selection locally if needed, but typically questions stay until the next one. */}
                    {/* <button 
                      onClick={() => { setCurrentQuestion(null); setSelectedIndex(null); }} 
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Skip
                    </button> */}
                  </div>
                </div>
              ) : (
                /* Waiting State */
                <div className="text-center p-8 text-gray-600 bg-blue-50 rounded-lg">
                  <p className='text-xl font-medium mb-2'>Quiz Connected</p>
                  <p>Waiting for the teacher to publish the first question. Please stand by!</p>
                </div>
              )}
            </div>
            {/* End Main Content Card */}
              {/* Overseer Panel: show student-facing view of live stats */}
              <div className="mt-6">
                <OverseerPanel
                  quizActive={true}
                  questionsLength={0}
                  teacherSocket={socketRef.current}
                  currentRoomId={roomId}
                />
              </div>
          </div>
        </div>

      </div>
      <AppFooter />
    </>
  );
}