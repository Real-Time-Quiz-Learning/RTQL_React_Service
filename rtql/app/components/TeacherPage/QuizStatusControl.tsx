import React from 'react';

// --- Type Definitions ---
interface QuizStatusControlProps {
    quizActive: boolean;
    handleQuizControl: (willBeActive: boolean) => void;
    roomId: string; 
}

const QuizStatusControl: React.FC<QuizStatusControlProps> = ({ quizActive, handleQuizControl, roomId }) => (
  <button
    onClick={() => handleQuizControl(!quizActive)}
    className={`px-4 py-2 rounded-full text-sm font-bold text-white transition duration-150 shadow-md ${
      quizActive
        ? 'bg-red-600 hover:bg-red-700' // Use red for destructive/stop action
        : 'bg-indigo-600 hover:bg-indigo-700' // Use indigo for primary start action
    } transform hover:scale-[1.02]`}
  >
    {quizActive ? `END QUIZ` : 'START QUIZ'}
  </button>
);

export default QuizStatusControl;