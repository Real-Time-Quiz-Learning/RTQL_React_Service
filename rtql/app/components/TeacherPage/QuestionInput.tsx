import React from 'react';
import QuestionReview from './QuestionReview';
import QuestionsList from './QuestionList';

// --- Type Definitions ---
interface Question {
    id: string;
    text: string;
    options: string[];
    correct: number;
    explanation: string;
    topic: string;
    timestamp: string;
    isEdited?: boolean;
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
    handleDiscardQuestion: () => void;
    handleEditQuestion: (question: Question) => void;
    handleDeleteQuestion: (id: string) => void;
    setManualPrompt: React.Dispatch<React.SetStateAction<string>>;
    handlePromptAiClick: () => void;
}

const QuestionInput: React.FC<QuestionInputProps> = ({ 
    quizActive, isRecording, isGenerating, transcribedText, error, 
    questionForReview, handleRecordingClick, handleQuestionEdit, 
    handlePublishQuestion, handleDiscardQuestion, questions,
    handleEditQuestion, handleDeleteQuestion,
    manualPrompt, setManualPrompt, handlePromptAiClick
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
                    handleDiscardQuestion={handleDiscardQuestion}
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
                        disabled={isGenerating || isRecording || !quizActive}
                    />
                    
                    {/* STT Status/Pending Generation Box */}
                    <div className="text-gray-600 text-sm font-medium h-24 flex flex-col items-center justify-center border-2 border-dashed border-indigo-300 w-full rounded-xl mb-4 bg-white shadow-inner">
                        {isRecording ? (
                            <p className="animate-pulse flex items-center text-red-600 font-bold">
                                <svg className="h-6 w-6 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4z" clipRule="evenodd" />
                                    <path fillRule="evenodd" d="M5.5 8A4.5 4.5 0 0110 3.5v1A3.5 3.5 0 006.5 8h-1zm9 0h-1A3.5 3.5 0 0010 4.5v-1A4.5 4.5 0 0114.5 8z" clipRule="evenodd" />
                                    <path d="M4 12a1 1 0 011-1h10a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2z" />
                                </svg>
                                Recording Lecture... (Max 30 seconds)
                            </p>
                        ) : isGenerating ? (
                            <p className="animate-pulse flex items-center text-indigo-600 font-bold">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating Question from Text...
                            </p>
                        ) : (
                            <p className='text-gray-500'>Enter text above or click "START RECORDING" below to use the microphone.</p>
                        )}
                        
                        {transcribedText && !isGenerating && !questionForReview && (
                            <p className="mt-2 text-xs text-gray-500 italic px-4">
                                Transcription: "{transcribedText}" (Generation successful/pending review or failed)
                            </p>
                        )}
                    </div>
                    
                    {/* Button Row: PROMPT AI and START RECORDING */}
                    <div className="flex space-x-4">
                        <button
                            onClick={handlePromptAiClick}
                            className={`flex-grow px-6 py-3 rounded-full text-white text-lg font-bold transition duration-150 shadow-lg ${
                            !manualPrompt.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                            } disabled:bg-gray-400 transform hover:scale-[1.02]`}
                            disabled={!quizActive || isGenerating || isRecording || !manualPrompt.trim()}
                        >
                            PROMPT AI
                        </button>
                        
                        <button
                            onClick={handleRecordingClick}
                            className={`flex-grow px-6 py-3 rounded-full text-white text-lg font-bold transition duration-150 shadow-lg ${
                            isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                            } disabled:bg-gray-400 transform hover:scale-[1.02]`}
                            // Disable recording if manual prompt is entered, or if generating/recording is active
                            disabled={!quizActive || isGenerating || manualPrompt.trim().length > 0}
                        >
                            {isRecording ? 'STOP RECORDING' : 'START RECORDING'}
                        </button>
                    </div>
                </div>
            )}

            <QuestionsList 
                questions={questions} 
                handleEditQuestion={handleEditQuestion} 
                handleDeleteQuestion={handleDeleteQuestion}
            />

        </div>
    );
};

export default QuestionInput;