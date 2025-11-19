import React from 'react';

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

interface QuestionsListProps {
    questions: Question[];
    handleEditQuestion: (question: Question) => void;
    handleDeleteQuestion: (id: string) => void;
}

const QuestionsList: React.FC<QuestionsListProps> = ({ questions, handleEditQuestion, handleDeleteQuestion }) => (
    <div className="w-full mt-6">
        <h3 className="text-xl font-extrabold text-gray-800 mb-3 text-left">Published Questions ({questions.length})</h3>
        <div className="w-full max-h-60 overflow-y-auto bg-white p-4 border border-gray-300 rounded-xl text-left text-sm shadow-inner space-y-2">
            {questions.length > 0 ? (
                // Displaying questions in reverse chronological order (most recent first)
                [...questions].reverse().map((q, index) => (
                    <div key={q.id} className="flex justify-between items-center p-2 border-b border-gray-100 last:border-b-0 hover:bg-indigo-50 rounded-lg transition">
                        <p className="text-gray-800 flex-grow font-medium">
                            {/* Calculate the question number based on the total length and index */}
                            <span className="font-bold text-indigo-600 mr-3 text-sm flex-shrink-0">Q{questions.length - index}</span> 
                            {q.text}
                        </p>
                        <div className="flex space-x-3 flex-shrink-0 ml-4">
                            <button 
                                onClick={() => handleEditQuestion(q)}
                                className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full font-semibold transition hover:bg-indigo-200"
                            >
                                Edit
                            </button>
                            <button 
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full font-semibold transition hover:bg-red-200"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-gray-400 italic p-4 text-center">No questions published yet.</p>
            )}
        </div>
    </div>
);

export default QuestionsList;