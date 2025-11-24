import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io } from "socket.io-client";
import QuizStatusControl from '../components/TeacherPage/QuizStatusControl';
import QuestionInput from '../components/TeacherPage/QuestionInput';
import OverseerPanel from '../components/TeacherPage/OverseerPanel';
import AppHeader from '../components/layout/AppHeader';
import AppFooter from '../components/layout/AppFooter';

// --- Type Definitions ---
interface Question {
    id: string; // This will now hold the database-returned QID after saving
    text: string;
    options: string[];
    correct: number; // Index of the correct option (0, 1, 2, or 3)
    explanation: string;
    topic: string;
    timestamp: string;
    isEdited?: boolean;
}
// This is necessary because SpeechRecognition is not standard in global type definitions.
declare global {
    interface Window {
        SpeechRecognition: any; // Allow the standard name
        webkitSpeechRecognition: any; // Allow the prefixed name
    }
}

/**
 * Helper to safely retrieve the authentication token from localStorage.
 */
const getAuthToken = (): string | null => {
    try {
        const localToken = localStorage.getItem("token");
        const userToken = JSON.parse(localToken || 'null')?.token || null;
        return userToken;
    } catch (e) {
        console.error("Could not access localStorage:", e);
        return null;
    }
};

// --- Global Utilities ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const generateUniqueId = () => `q-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// --- API Configuration and Helper ---
const API_ENDPOINT = 'http://64.181.233.131:3677/question/send';
const SAVE_API_ENDPOINT = 'http://64.181.233.131:3677/question/save';

/**
 * Helper for fetching with exponential backoff.
 */
async function fetchWithRetry(url: string, options: RequestInit, retries = 5): Promise<Response> {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                if (i < retries - 1) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                } else {
                    throw new Error(`Failed after ${retries} attempts. Status: ${response.status}`);
                }
            }
            return response;
        } catch (error) {
            if (i < retries - 1) {
                const delayTime = 2 ** i * 1000 + Math.random() * 500;
                await delay(delayTime);
            } else {
                throw error;
            }
        }
    }
    throw new Error('Exhausted all retries.');
}

/**
 * Calls the API, parses the nested response, and returns the first generated question.
 */
const generateQuestion = async (prompt: string): Promise<Question[]> => {
    const token = getAuthToken();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = {
        input: prompt,
        questions: 3
    };

    const response = await fetchWithRetry(API_ENDPOINT, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
    });

    const data = await response.json();

    const questionsArray = data.questions;

    if (!Array.isArray(questionsArray) || questionsArray.length === 0) {
        throw new Error("API returned an invalid format or no questions were generated. Check the response message for details.");
    }

    const newQuestions: Question[] = questionsArray.map((apiQuestion: any) => {        
        return {
            // NOTE: We still use the client-side ID initially as a placeholder
            // until the question is successfully saved to the database.
            id: generateUniqueId(), 
            text: apiQuestion.question,
            options: apiQuestion.options,
            correct: apiQuestion.correct,
            // Assuming the API might provide a proper explanation field later,
            // or setting a default placeholder.
            explanation: apiQuestion.explanation || 'Explanation to be added by the teacher or AI upon request.', 
            topic: prompt,
            timestamp: new Date().toISOString(),
        };
    })
    
    return newQuestions;
};


// -----------------------------------------------------------
// Main App Component
// -----------------------------------------------------------
const TeacherPage: React.FC = () => {
    const [quizActive, setQuizActive] = useState<boolean>(false);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [questionForReview, setQuestionForReview] = useState<Question | null>(null);
    const [currentRoomId, setCurrentRoomId] = useState<string>('');
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [socketServer, setSocketServer] = useState<any>(null);

    // Effect 1: Load Auth Token (Runs once on component mount)
    useEffect(() => {
        const token = getAuthToken();
        setAuthToken(token);
    }, []);

    // UI States for Generator
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    // Transcribed text is now managed by manualPrompt
    const [manualPrompt, setManualPrompt] = useState<string>('');
    const [error, setError] = useState<string>('');

    // Ref for the Speech Recognition Instance
    const recognitionRef = useRef<any>(null);

    // Effect 2: Initialize Socket when Auth Token is ready
    useEffect(() => {
        // Only proceed if the authToken is a non-empty string AND the socket hasn't been created yet.
        if (authToken && !socketServer) {
            console.log("Initializing Socket.IO with token...");
            
            // Changed from 'let socket' to 'const newSocket'
            const newSocket = io('http://64.181.233.131:3677/teacher', {
                extraHeaders: { 
                    authorization: `Bearer ${authToken}`
                } 
            });
            // Set the active socket instance to state
            setSocketServer(newSocket);

            // Cleanup function to close the socket when the component unmounts
            return () => {
                console.log("Disconnecting socket on cleanup.");
                newSocket.disconnect();
            };
        }
    }, [authToken]);
    
    useEffect(() => {
        if (!socketServer) return;

        const handleRoomCreated = (roomId: string) => {
            console.log("Quiz Room Created with ID:", roomId);
            // Sets the actual room ID returned by the server
            setCurrentRoomId(roomId); 
        };

        socketServer.on('quizRoomCreated', handleRoomCreated);

        // Cleanup: remove the listener when the socket changes or component unmounts
        return () => {
            socketServer.off('quizRoomCreated', handleRoomCreated);
        };
    }, [socketServer]);

    /**
     * Saves the question to the API and returns the database-generated ID (qid).
     * @param question The question object to save.
     * @returns An object containing the API Response and the database ID (qid).
     */
    const saveQuestion = async (question: Question): Promise<{ response: Response, qid: string }> => {
        const token = getAuthToken();

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // The payload format required by the save API
        const payload = {
            question: question.text,
            options: question.options,
            correct: question.correct
        };

        // Use the existing robust fetchWithRetry helper
        const response = await fetchWithRetry(SAVE_API_ENDPOINT, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
        });

        // --- MODIFICATION: Parse response to get the database-generated ID ---
        const data = await response.json();
        // Assuming the save API returns an object like { message: "Success", qid: "db-unique-id" }
        // Use the returned qid, or fallback to the client-generated ID if qid is not present
        const qid = data.qid || question.id; 

        return { response, qid };
    };

    // Triggers AI Generation based on a text prompt (voice or manual)
    const triggerAiQuestion = useCallback(async (prompt: string) => {
        if (!prompt.trim()) {
            setError('Prompt cannot be empty.');
            return;
        }
        // Ensure manualPrompt state reflects the latest prompt used for generation
        setManualPrompt(prompt);
        setIsGenerating(true);
        setError('');

        try {
            const newQuestions = await generateQuestion(prompt);
            if (newQuestions.length > 0) {
                // Map over the newly generated questions and attempt to save them
                const savedQuestions = await Promise.all(
                    newQuestions.map(async (q) => {
                        try {
                            // --- MODIFICATION: Destructure the returned qid from saveQuestion ---
                            const { qid } = await saveQuestion(q);
                            console.log(`Successfully saved question with QID: ${qid}`);
                            
                            // Return the question object with the new database ID (qid)
                            // replacing the temporary client-side ID (q.id)
                            return { ...q, id: qid };
                        } catch (saveError) {
                            console.error(`Failed to save question ${q.id}:`, saveError);
                            // If saving fails, return the question with its current client-side ID
                            // so the user can review/retry.
                            return q;
                        }
                    })
                );
                
                // Add the array of questions (now containing the database QIDs) to the state
                setQuestions(prev => [...prev, ...savedQuestions]);
            }
        } catch (err) {
            console.error("AI Generation Error:", err);
            setError(`Failed to generate question. Error: ${err instanceof Error ? err.message : 'Unknown API error'}`);
        } finally {
            setIsGenerating(false);
            // Keep manualPrompt content for potential editing
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        // Define the API object now that we are sure we are in the browser
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setError("Speech Recognition is not supported by this browser.");
            return;
        }


        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            let interimTranscript = '';

            // Iterate through all results received since the last result event
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            if (finalTranscript.trim().length > 0) {
                setManualPrompt(prevPrompt => {
                    // Append the new final transcript segment to the previous prompt
                    const basePrompt = prevPrompt.trim();
                    if (basePrompt.length > 0 && !basePrompt.endsWith('.')) {
                        // Add a space if the previous text wasn't empty or punctuated
                        return basePrompt + ' ' + finalTranscript.trim();
                    }
                    return basePrompt + finalTranscript.trim();
                });
            }
        };

        recognition.onerror = (event: any) => {
            console.error("Speech Recognition Error:", event.error);
            setError(`Microphone error: ${event.error}. Check permissions.`);
            setIsRecording(false);
        };

        recognition.onend = () => {
            // Ensure recording is stopped if not already handled by onresult/onerror
            if (isRecording) {
                console.log("Recording ended.");
                setIsRecording(false);
            }
        };
        recognition.onaudiostart = () => {
            // Confirms the browser successfully opened the microphone.
            console.log('Audio Input Detected: Microphone is open.');
        };

        recognition.onspeechstart = () => {
            // Confirms the API registered sound above the noise threshold.
            console.log('Speech Detected: Sound is being processed.');
        };

        recognitionRef.current = recognition;

        // Cleanup on unmount
        return () => {
            if (recognitionRef.current) {
                // Stop the recognition service if it's active
                try {
                    recognitionRef.current.stop();
                } catch (e) {
                    // Ignore errors if recognition wasn't running
                }
            }
        };
        // Include dependencies used within the effect
    }, [triggerAiQuestion, isRecording]);

    // Handler for Quiz Activation/Deactivation
    const handleQuizControl = useCallback((willBeActive: boolean) => {
        setQuizActive(willBeActive);

        // Check if socket is connected before emitting
        if (willBeActive && !socketServer) {
            console.error("Socket not connected. Cannot start quiz.");
            setError("Error: Cannot start quiz. Socket connection failed or is not ready.");
            setQuizActive(false); // Revert state
            return;
        }
        
        if (!willBeActive) {
            // Logic to end quiz
            setQuestionForReview(null);
            setIsRecording(false);
            setIsGenerating(false);
            // The Room ID will be cleared if the quiz is ended
            setCurrentRoomId(''); 
            console.log("Quiz Ended. Room ID cleared.");
            // Optional: socketServer.emit("quizRoomClose", { roomId: currentRoomId });
        } else {
            // Logic to start quiz
            console.log("Quiz Started. Creating Room...");           
            // Emit event to create a room on the server
            socketServer.emit("quizRoomCreate");
            
            // The 'quizRoomCreated' listener (in the useEffect above) will handle 
            // setting the actual currentRoomId when the server responds.
            
            setQuestionForReview(null);
            setIsRecording(false);
            setIsGenerating(false);
        }
    }, [socketServer]);

    const handleRecordingClick = async () => {
        if (isGenerating) return;

        if (!recognitionRef.current) {
            setError("Speech Recognition is not ready or supported.");
            return;
        }

        if (isRecording) {
            // Stop recording
            console.log("Stop Recording clicked. Waiting for transcription results...");
            recognitionRef.current.stop();
        } else {
            setManualPrompt('');
            setError('');
            setIsRecording(true);
            try {
                // Request microphone access (required for the API to work)
                await navigator.mediaDevices.getUserMedia({ audio: true });
                recognitionRef.current.start();
                console.log("Speech recognition started...");
            } catch (err) {
                // Handle permission denial or no mic found
                console.error("Microphone access error:", err);
                setError("Microphone access denied or not available. Check browser settings.");
                setIsRecording(false);
            }
        }
    };
    // ----------------------------------------------------------------------

    // Handler for editing the draft question
    const handleQuestionEdit = useCallback((field: 'text' | 'correct' | 'option', value: string | number, optionIndex: number | null = null) => {
        if (!questionForReview) return;

        setQuestionForReview(prev => {
            if (!prev) return null;

            if (field === 'option' && optionIndex !== null && typeof value === 'string') {
                const newOptions = [...prev.options];
                newOptions[optionIndex] = value;
                return { ...prev, options: newOptions };
            }
            if (field === 'text' && typeof value === 'string') {
                return { ...prev, [field]: value };
            }
            if (field === 'correct' && typeof value === 'number') {
                return { ...prev, [field]: value };
            }
            return prev;
        });
    }, [questionForReview]);

    // Handler to publish or update the question
    const handlePublishQuestion = useCallback(() => {
        if (!questionForReview) return;

        if (questionForReview.id && questions.some(q => q.id === questionForReview.id)) {
            setQuestions(prev => prev.map(q =>
                q.id === questionForReview.id
                    ? { ...questionForReview, isEdited: true, timestamp: new Date().toISOString() }
                    : q
            ));
        } else {
            setQuestions(prev => [...prev, questionForReview]);
        }

        // Clear the review draft and the prompt text
        setQuestionForReview(null);
        setManualPrompt('');
    }, [questionForReview, questions]);

    // Handler to discard the question draft/cancel edit
    const handleDiscardQuestion = useCallback(() => {
        setQuestionForReview(null);
        setManualPrompt('');
    }, []);

    // Handler to load an existing question into the review panel for editing
    const handleEditQuestion = useCallback((question: Question) => {
        if (!quizActive) {
            setError("Please start the quiz before attempting to edit questions.");
            return;
        }
        // Use a shallow copy to ensure we don't modify the state object directly
        setQuestionForReview({ ...question }); 
        setError('');
    }, [quizActive]);

    // Handler to delete a published question
    const handleDeleteQuestion = useCallback((id: string) => {
        const userConfirmed = window.confirm("Are you sure you want to delete this question?");
        if (userConfirmed) {
            setQuestions(prev => prev.filter(q => q.id !== id));
            if (questionForReview && questionForReview.id === id) {
                setQuestionForReview(null);
            }
        }
    }, [questionForReview]);

    // Handler for Manual Prompt Input
    const handlePromptAiClick = () => {
        if (manualPrompt.trim() && quizActive && !isGenerating) {
            triggerAiQuestion(manualPrompt);
        } else if (!quizActive) {
            setError("The quiz must be active to generate new questions.");
        }
    };


    // --- Render ---
    return (
        <>
            <AppHeader />
            <div className="min-h-screen bg-gray-100 font-sans p-4 sm:p-8">
                <header className="bg-white p-4 rounded-t-xl shadow-lg flex justify-between items-center mb-6 border-t-8 border-indigo-600">
                    <div className="flex flex-col text-left">
                        <h1 className="text-3xl font-extrabold text-gray-900">RTQL Teacher Dashboard</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Room ID: <span className="font-mono bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md text-xs">{currentRoomId}</span>
                        </p>
                    </div>
                    <QuizStatusControl
                        quizActive={quizActive}
                        handleQuizControl={handleQuizControl}
                        roomId={currentRoomId}
                    />
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column: Question Generator */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-xl border border-gray-200">
                        <QuestionInput
                            quizActive={quizActive}
                            isRecording={isRecording}
                            isGenerating={isGenerating}
                            // 'transcribedText' now uses the current value of 'manualPrompt'
                            transcribedText={manualPrompt}
                            error={error}
                            questionForReview={questionForReview}
                            handleRecordingClick={handleRecordingClick}
                            handleQuestionEdit={handleQuestionEdit}
                            handlePublishQuestion={handlePublishQuestion}
                            handleDiscardQuestion={handleDiscardQuestion}
                            questions={questions}
                            handleEditQuestion={handleEditQuestion}
                            handleDeleteQuestion={handleDeleteQuestion}
                            manualPrompt={manualPrompt}
                            setManualPrompt={setManualPrompt}
                            handlePromptAiClick={handlePromptAiClick}
                        />
                    </div>

                    {/* Right Column: Overseer Panel (Leaderboard) */}
                    <div className="lg:col-span-1">
                        <OverseerPanel
                            quizActive={quizActive}
                            questionsLength={questions.length}
                        />
                    </div>
                </div>

            </div>
            <AppFooter />
        </>
    );
};

export default TeacherPage;