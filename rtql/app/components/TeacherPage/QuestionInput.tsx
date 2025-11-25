import React from 'react';
import QuestionReview from './QuestionReview';
import QuestionsList from './QuestionList';

// --- Type Definitions ---
interface Question {
    qid: string,
    id: string;
    text: string;
    options: string[];
    correct: number;
    explanation: string;
    topic: string;
    timestamp: string;
    isEdited?: boolean;
    isPersisted?: boolean;
}

interface QuestionInputProps {
    quizActive: boolean;
    isRecording: boolean;
    isGenerating: boolean;
    transcribedText: string;
    error: string;
    questionForReview: Question | null;
    questions: Question[];
    manualPrompt: string;
    
    // Handlers
    handleRecordingClick: () => Promise<void>;
    handleQuestionEdit: (field: 'text' | 'correct' | 'option', value: string | number, optionIndex?: number | null) => void;
    handlePublishQuestion: () => void;
    // Emit a live publish event for students (room + socket handled by parent)
    handleEmitQuestion?: (question: Question) => void;
    // Publish an existing question from the list (emits only)
    handlePublishFromList?: (question: Question) => void;
    handleDiscardQuestion: () => void;
    handleEditQuestion: (question: Question) => void;
    handleDeleteQuestion: (id: string) => Promise<void> | void;
    setManualPrompt: React.Dispatch<React.SetStateAction<string>>;
    handlePromptAiClick: () => void;
    // Create a blank question for manual authoring
    handleCreateBlankQuestion?: () => void;
}

const QuestionInput: React.FC<QuestionInputProps> = ({ 
    quizActive, isRecording, isGenerating, transcribedText, error, 
    questionForReview, handleRecordingClick, handleQuestionEdit, 
    handlePublishQuestion, handleDiscardQuestion, questions,
    handleEditQuestion, handleDeleteQuestion,
    manualPrompt, setManualPrompt, handlePromptAiClick,
    handleEmitQuestion, handlePublishFromList, handleCreateBlankQuestion
}) => {

    const questionsLength = questions.length;
    
    return (
        <div className="bg-gray-50 p-6 flex flex-col items-center space-y-4 text-center rounded-b-xl">
            <h2 className="text-2xl font-extrabold text-gray-800 border-b border-indigo-100 pb-2 w-full">Generate & Publish Question</h2>
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative w-full text-sm shadow-md">
                    <p className="font-bold">Error:</p>
                    <p className="mt-1">{error}</p>
                </div>
            )}

            {questionForReview ? (
                // Show the review panel if there is a question draft
                <QuestionReview 
                    questionForReview={questionForReview} 
                    questionsLength={questionsLength}
                    handleQuestionEdit={handleQuestionEdit}
                    handlePublishQuestion={handlePublishQuestion}
                    handleEmitQuestion={handleEmitQuestion}
                    handleDiscardQuestion={handleDiscardQuestion}
                    handleDeleteQuestion={handleDeleteQuestion}
                />
            ) : (
                // Show the input controls otherwise
                <div className="w-full">
                    
                    {/* Manual Prompt Input Box */}
                    <textarea
                        value={manualPrompt}
                        onChange={(e) => setManualPrompt(e.target.value)}
                        rows={4}
                        className="w-full border border-gray-300 rounded-xl p-3 mb-4 text-base text-gray-900 focus:ring-indigo-500 shadow-inner resize-none"
                        placeholder="Enter lecture content or a specific prompt for the AI to generate a quiz question (e.g., 'Summarize the causes of the French Revolution')."
                    />
                    
                    {/* Button Row: PROMPT AI and START RECORDING */}
                    <div className="flex space-x-4">
                        {/* Disable when there's no prompt or while generating */}
                        <button
                            onClick={handlePromptAiClick}
                            disabled={isGenerating || !manualPrompt.trim()}
                            aria-busy={isGenerating}
                            className={`flex-grow px-6 py-3 rounded-full text-white text-lg font-bold transition duration-150 shadow-lg ${
                            (isGenerating || !manualPrompt.trim()) ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                            } disabled:bg-gray-400 transform ${isGenerating ? '' : 'hover:scale-[1.02]'}`}
                        >
                            <span className="flex items-center justify-center space-x-2">
                                {isGenerating && (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                    </svg>
                                )}
                                <span className="font-bold">{isGenerating ? 'GENERATING...' : 'PROMPT AI'}</span>
                            </span>
                        </button>
                        
                        <button
                            onClick={handleRecordingClick}
                            className={`flex-grow px-6 py-3 rounded-full text-white text-lg font-bold transition duration-150 shadow-lg ${
                            isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                            } disabled:bg-gray-400 transform hover:scale-[1.02]`}
                            // Disable recording if manual prompt is entered, or if generating/recording is active
                        >
                            {isRecording ? 'STOP RECORDING' : 'START RECORDING'}
                        </button>
                        
                        <button
                            onClick={() => handleCreateBlankQuestion && handleCreateBlankQuestion()}
                            className={`px-6 py-3 rounded-full text-white text-lg font-bold transition duration-150 shadow-lg bg-yellow-600 hover:bg-yellow-700 transform hover:scale-[1.02]`}
                        >
                            CREATE BLANK
                        </button>
                    </div>
                </div>
            )}

            <QuestionsList 
                questions={questions} 
                handleEditQuestion={handleEditQuestion} 
                handleDeleteQuestion={handleDeleteQuestion}
                handlePublishQuestion={(q) => handlePublishFromList ? handlePublishFromList(q) : undefined}
            />

        </div>
    );
};

export default QuestionInput;