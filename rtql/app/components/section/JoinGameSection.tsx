import React, { useState } from 'react';

const JoinGameSection: React.FC = () => {
  const [userName, setUserName] = useState('');
  const [roomCode, setRoomCode] = useState('');


  const handleJoinGame = () => {
    const trimmedUserName = userName.trim();
    const trimmedRoomCode = roomCode.trim().toUpperCase(); 

    if (!trimmedUserName) {
      console.log('Error: Please enter your name.');
      return;
    }

    if (!trimmedRoomCode) {
      console.log('Error: Please enter a room code.');
      return;
    }
    console.log(`Username: ${trimmedUserName}`);
    console.log(`Room Code: ${trimmedRoomCode}`);
    //Join quiz logic here
    
    
  };

  // Tailwind classes for the main section to center the content
  return (
    <section className="min-h-[70vh] flex items-center justify-center py-16 sm:py-24 bg-gradient-to-br from-indigo-50 to-white">
      <div className="w-full max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Card/Box for the Join Form */}
        <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-2xl border-4 border-indigo-200/50 transform transition-all duration-300 hover:shadow-indigo-300/60">
          
          <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-gray-900 mb-2">
            JOIN A QUIZ
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Enter the 4-letter room code and your name to start playing!
          </p>

          {/* Form Group for Name Input */}
          <div className="mb-6">
            <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="userName"
              placeholder="e.g., CoolLearner"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-lg text-gray-900 shadow-sm transition duration-150"
              maxLength={15}
            />
          </div>

          {/* Form Group for Room Code Input */}
          <div className="mb-8">
            <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 mb-2">
              Room Code
            </label>
            <input
              type="text"
              id="roomCode"
              placeholder="Get from Teacher"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-lg text-gray-900 font-mono font-bold shadow-sm transition duration-150"
            />
          </div>

          {/* Join Button */}
          <button
            onClick={handleJoinGame}
            // Button is disabled if either field is empty
            disabled={!userName.trim() || roomCode.trim().length === 0}
            className="w-full flex items-center justify-center space-x-2 px-10 py-4 text-xl font-bold text-white rounded-xl shadow-lg transition duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            // Conditional styling based on disabled state
            style={{
              backgroundColor: (!userName.trim() || roomCode.trim().length === 0) ? '#9CA3AF' : '#4F46E5', // Gray or Indigo
              boxShadow: (!userName.trim() || roomCode.trim().length === 0) ? 'none' : '0 10px 15px -3px rgba(79, 70, 229, 0.5), 0 4px 6px -2px rgba(79, 70, 229, 0.05)',
            }}
          >
            <span>JOIN QUIZ</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default JoinGameSection;