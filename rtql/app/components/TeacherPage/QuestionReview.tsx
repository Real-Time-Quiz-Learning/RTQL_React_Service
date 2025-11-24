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

interface QuestionReviewProps {
    questionForReview: Question;
    questionsLength: number;
    handleQuestionEdit: (field: 'text' | 'correct' | 'option', value: string | number, optionIndex?: number | null) => void;
    handlePublishQuestion: () => void; // This is the original function passed from the parent
    handleDiscardQuestion: () => void;
}

// --- API Configuration ---
const SAVE_API_ENDPOINT = 'http://64.181.233.131:3677/question/update';

const QuestionReview: React.FC<QuestionReviewProps> = ({ 
    questionForReview, 
    questionsLength, 
    handleQuestionEdit, 
    handlePublishQuestion, 
    handleDiscardQuestion 
}) => {
    
    const isEditing = !!questionForReview.id;
    
    const isPublishDisabled = !questionForReview.text || questionForReview.options.some(opt => !opt);

    /**
     * Defines the function to send the clean JSON format via POST request 
     * before calling the parent's publish handler.
     */
    const handlePublishAndSend = async () => {
        
        // --- MODIFICATION START ---
        // Include the question ID (qid) which is stored in questionForReview.id
        const conciseQuestion = {
            qid: questionForReview.id, // <-- ADDED: The database ID for the question
            question: questionForReview.text,
            options: questionForReview.options,
            correct: questionForReview.correct
        };
        // --- MODIFICATION END ---
        
        console.log("Attempting to send data to server...");
        console.log(JSON.stringify(conciseQuestion, null, 2));
        console.log(typeof conciseQuestion)

        const token = localStorage.getItem('token');
        // NOTE: This token parsing logic is slightly inconsistent but preserved from your original code block.
        const authtoken = token ? JSON.parse(token)["token"] || '' : '';

        const response = await fetch(SAVE_API_ENDPOINT, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'authorization': 'Bearer ' + authtoken,
            },
            body: JSON.stringify(conciseQuestion),
        });

        // Optional: Log success message from server
        const result = await response.json();
        console.log("Question successfully saved to server:", result);
        
        // 2. Call the original prop function to update the parent state (publish/save)
        handlePublishQuestion(); 

    };

    return (
        <div className="w-full bg-white shadow-lg p-4 rounded-xl text-left border border-gray-200">
            <p className="text-sm font-bold mb-2 text-indigo-700 border-b pb-2">
                {isEditing ? 'Editing Question' : `Review Draft (Q${questionsLength + 1})`}
            </p>
            
            {/* Question Text Area */}
            <textarea
                value={questionForReview.text}
                onChange={(e) => handleQuestionEdit('text', e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg p-3 mb-3 text-sm text-gray-900 focus:ring-indigo-500 shadow-inner resize-none"
                placeholder="Edit the question text..."
            />
            
            {/* Explanation Display/Placeholder */}
            <div className="text-xs text-gray-600 mb-3 p-2 bg-indigo-50 rounded-lg border border-indigo-200">
              {isEditing 
                ? 'Note: The original explanation is not available during edit. You can add a new one here if needed.'
                : `Model Explanation: ${questionForReview.explanation || 'No explanation provided by AI.'}`}
            </div>

            {/* Options and Correct Answer Selector */}
            <div className="space-y-3">
                {questionForReview.options.map((opt, index) => (
                    <div key={index} className="flex items-center">
                        <input
                            type="radio"
                            name="correctOption"
                            checked={questionForReview.correct === index}
                            onChange={() => handleQuestionEdit('correct', index)}
                            className="h-5 w-5 text-green-600 border-gray-300 focus:ring-green-500 cursor-pointer"
                            id={`option-radio-${index}`}
                        />
                        <label htmlFor={`option-radio-${index}`} className="ml-2 mr-3 text-sm font-bold text-gray-700 w-4 text-center">
                            {String.fromCharCode(65 + index)}.
                        </label>
                        <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleQuestionEdit('option', e.target.value, index)}
                            className={`flex-grow border rounded-lg p-2 text-sm shadow-sm transition text-gray-900 ${
                                questionForReview.correct === index
                                    ? 'border-green-500 ring-2 ring-green-200 bg-green-50'
                                    : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                            }`}
                            placeholder={`Option ${index + 1}`}
                        />
                    </div>
                ))}
            </div>
            
            {/* Publish / Discard Buttons */}
            <div className="flex justify-between space-x-3 mt-5 pt-4 border-t border-gray-100">
                <button
                    onClick={handleDiscardQuestion}
                    className="px-4 py-2 text-sm rounded-full border border-gray-300 text-gray-700 font-semibold transition hover:bg-gray-100 shadow-sm"
                >
                    {isEditing ? 'CANCEL EDIT' : 'Discard Draft'}
                </button>
                <button
                    onClick={handlePublishAndSend} // <-- Now calls the async function to send data
                    className="px-4 py-2 text-sm rounded-full bg-indigo-600 text-white font-semibold transition hover:bg-indigo-700 shadow-lg disabled:bg-indigo-400 transform hover:scale-[1.02]"
                    disabled={isPublishDisabled}
                >
                    {isEditing ? 'SAVE QUESTION' : 'PUBLISH'}
                </button>
            </div>
        </div>
    );
};

export default QuestionReview;