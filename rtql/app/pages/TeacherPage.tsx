import React, { useState, useEffect, useCallback } from 'react';
import QuizStatusControl from '../components/TeacherPage/QuizStatusControl';
import QuestionInput from '../components/TeacherPage/QuestionInput';
import OverseerPanel from '../components/TeacherPage/OverseerPanel';
import AppHeader from '../components/layout/AppHeader';
import AppFooter from '../components/layout/AppFooter';

// --- Type Definitions ---
interface Question {
    id: string;
    text: string;
    options: string[];
    correct: number; // Index of the correct option (0, 1, 2, or 3)
    explanation: string;
    topic: string;
    timestamp: string;
    isEdited?: boolean;
}

// --- Global Utilities ---
const MOCK_USER_ID = 'teacher-12345-mock-id';
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const generateUniqueId = () => `q-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

// --- API Configuration and Helper ---
const API_ENDPOINT = 'http://64.181.233.131:3677/question/send';

/**
 * Helper to safely retrieve the authentication token from localStorage.
 * NOTE: Replace 'auth_token' with your actual key name if different.
 */
const getAuthToken = (): string | null => {
    try {
        // Check for token under a common key name
        return localStorage.getItem('token');
    } catch (e) {
        console.error("Could not access localStorage:", e);
        return null;
    }
};

/**
 * Helper for fetching with exponential backoff (up to 5 attempts) to handle transient errors.
 */
async function fetchWithRetry(url: string, options: RequestInit, retries = 5): Promise<Response> {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                // Throw an error to trigger the retry logic, unless it's the last attempt
                if (i < retries - 1) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                } else {
                    throw new Error(`Failed after ${retries} attempts. Status: ${response.status}`);
                }
            }
            return response;
        } catch (error) {
            // Only retry if it's not the final attempt
            if (i < retries - 1) {
                const delayTime = 2 ** i * 1000 + Math.random() * 500; // Exponential backoff with jitter
                await delay(delayTime);
            } else {
                throw error; // Re-throw the error on the final attempt
            }
        }
    }
    throw new Error('Exhausted all retries.'); // Should be unreachable
}

/**
 * Calls the API, parses the nested response, and returns the first generated question.
 */
const generateQuestion = async (prompt: string): Promise<Question> => {
    const token = getAuthToken();
    
    // Define the base headers
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // Conditionally add the Authorization header
    if (token) {
        // Assuming a Bearer token scheme as is typical for JWTs
        headers['Authorization'] = `Bearer ${token}`;
        console.log("Authorization token included in request headers.");
    } else {
        console.warn("No authentication token found in localStorage. Request might fail due to lack of Authorization header.");
    }
    
    const payload = {
        prompt: prompt,
    };

    console.log("Sending prompt to API:", prompt);

    const response = await fetchWithRetry(API_ENDPOINT, {
        method: 'POST',
        headers: headers, // Use the updated headers object
        body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    // --- START: Parsing Logic for the nested response structure ---
    // The previous fix assumed the response had a 'questions' array
    const questionsArray = data.questions; 

    if (!Array.isArray(questionsArray) || questionsArray.length === 0) {
        throw new Error("API returned an invalid format or no questions were generated. Check the response message for details.");
    }
    
    // Use the first question in the array as the draft
    const firstApiQuestion = questionsArray[0];

    // Map the API response data to the local Question interface,
    // adding necessary client-side fields (ID, timestamp, and defaults for missing fields).
    const newQuestion: Question = {
        id: generateUniqueId(),
        text: firstApiQuestion.question, // Map 'question' to 'text'
        options: firstApiQuestion.options,
        correct: firstApiQuestion.correct,
        
        // Provide defaults for fields not returned by the current API response
        explanation: 'Explanation to be added by the teacher or AI upon request.',
        topic: prompt, // Use the prompt as a default topic
        
        timestamp: new Date().toISOString(),
    };
    // --- END: Parsing Logic ---

    // Basic validation check
    if (!newQuestion.text || !Array.isArray(newQuestion.options) || newQuestion.options.length < 4) {
         throw new Error("Invalid question structure returned from the AI.");
    }
    
    return newQuestion;
};


// -----------------------------------------------------------
// Main App Component
// -----------------------------------------------------------
const TeacherPage: React.FC = () => {
    const [quizActive, setQuizActive] = useState<boolean>(false);
    const [questions, setQuestions] = useState<Question[]>([]); // Array of published questions
    const [questionForReview, setQuestionForReview] = useState<Question | null>(null); // The question draft currently being reviewed/edited

    // UI States for Generator
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [transcribedText, setTranscribedText] = useState<string>('');
    const [manualPrompt, setManualPrompt] = useState<string>('');
    const [error, setError] = useState<string>('');

    const userId: string = MOCK_USER_ID; // Mock user ID for display

    // --- Core Handlers (Passed Down) ---

    // Handler for Quiz Activation/Deactivation
    const handleQuizControl = useCallback((willBeActive: boolean) => {
        setQuizActive(willBeActive);
        if (!willBeActive) {
            // Optional: Clear review draft when quiz ends
            setQuestionForReview(null);
            setIsRecording(false);
            setIsGenerating(false);
            setTranscribedText('');
            setManualPrompt('');
        }
    }, []);

    // Triggers AI Generation based on a text prompt (voice or manual)
    const triggerAiQuestion = async (prompt: string) => {
        if (!prompt.trim()) {
            setError('Prompt cannot be empty.');
            return;
        }

        setIsGenerating(true);
        setError('');

        try {
            // Use the real API call
            const newQuestion = await generateQuestion(prompt); 
            setQuestionForReview(newQuestion);
        } catch (err) {
            console.error("AI Generation Error:", err);
            setError(`Failed to generate question. Error: ${err instanceof Error ? err.message : 'Unknown API error'}`);
        } finally {
            setIsGenerating(false);
            setManualPrompt('');
        }
    };

    // Simulates Voice Recording/Transcription and Triggers AI Generation
    const handleRecordingClick = async () => {
        if (isGenerating) return;

        if (isRecording) {
            // Stop recording: Simulate transcription
            setIsRecording(false);
            // NOTE: Replace this mock transcription with actual voice-to-text integration
            const mockTranscription = "Generate a multiple-choice question about the history of the internet.";
            setTranscribedText(mockTranscription);
            await triggerAiQuestion(mockTranscription);
        } else {
            // Start recording
            setTranscribedText('');
            setError('');
            setIsRecording(true);
            
            // Auto-stop after 3 seconds (mock limit)
            setTimeout(() => {
                // Ensure we only stop if the user hasn't manually stopped in the meantime
                setIsRecording(prev => {
                    if (prev) {
                        // Directly call the stop logic to avoid relying on the closure variable
                        handleRecordingClick();
                    }
                    return prev;
                });
            }, 3000);
        }
    };

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

        // Check if we are updating an existing question (editing)
        if (questionForReview.id && questions.some(q => q.id === questionForReview.id)) {
            // Update existing question
            setQuestions(prev => prev.map(q => 
                q.id === questionForReview.id 
                    ? { ...questionForReview, isEdited: true, timestamp: new Date().toISOString() } 
                    : q
            ));
        } else {
            // Publish new question (uses the ID generated in generateQuestion)
            setQuestions(prev => [...prev, questionForReview]);
        }

        // Clear the review draft
        setQuestionForReview(null);
        setTranscribedText('');
    }, [questionForReview, questions]);

    // Handler to discard the question draft/cancel edit
    const handleDiscardQuestion = useCallback(() => {
        setQuestionForReview(null);
        setTranscribedText('');
    }, []);

    // Handler to load an existing question into the review panel for editing
    const handleEditQuestion = useCallback((question: Question) => {
        if (!quizActive) {
            // Using a custom modal is preferred over window.alert
            console.warn("Please start the quiz before attempting to edit questions.");
            setError("Please start the quiz before attempting to edit questions.");
            return;
        }
        // Ensure that the explanation is part of the question when editing
        setQuestionForReview({ ...question });
        setError('');
    }, [quizActive]);

    // Handler to delete a published question
    const handleDeleteQuestion = useCallback((id: string) => {
        // NOTE: Using a custom modal/dialog is preferred over window.confirm in production
        const userConfirmed = window.confirm("Are you sure you want to delete this question?");
        if (userConfirmed) {
            setQuestions(prev => prev.filter(q => q.id !== id));
            // If the deleted question was also the one being edited, clear the editor
            if (questionForReview && questionForReview.id === id) {
                setQuestionForReview(null);
            }
        }
    }, [questionForReview]);

    // Handler for Manual Prompt Input
    const handlePromptAiClick = () => {
        if (manualPrompt.trim() && quizActive && !isGenerating) {
            setTranscribedText(''); // Clear voice transcription if manual prompt is used
            triggerAiQuestion(manualPrompt);
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
                            Room ID: <span className="font-mono bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md text-xs">{userId}</span>
                        </p>
                    </div>
                    <QuizStatusControl 
                        quizActive={quizActive} 
                        handleQuizControl={handleQuizControl} 
                    />
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left Column: Question Generator */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-xl border border-gray-200">
                        <QuestionInput
                            quizActive={quizActive}
                            isRecording={isRecording}
                            isGenerating={isGenerating}
                            transcribedText={transcribedText}
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