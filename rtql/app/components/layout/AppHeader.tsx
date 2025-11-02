import React from 'react';

const AppHeader: React.FC = () => (
  <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
      <div className="text-2xl font-extrabold text-indigo-600 tracking-tight">
        RTQL
        <span className="text-gray-900 text-base font-medium ml-1">
          Real Time Quiz Learning
        </span>
      </div>
      <nav className="hidden md:flex space-x-6 text-gray-600 font-medium">
        <a href="#" className="hover:text-indigo-600 transition">Features</a>
        <a href="#" className="hover:text-indigo-600 transition">Pricing</a>
        <a href="#" className="hover:text-indigo-600 transition">About</a>
      </nav>
      <div className="flex items-center space-x-4">
          <button className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-200 rounded-full hover:bg-indigo-50 transition shadow-sm">
          Log In
        </button>
        <button className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-full hover:bg-indigo-700 transition shadow-md hover:shadow-lg transform hover:scale-[1.02]">
          Start Free Quiz
        </button>
      </div>
    </div>
  </header>
);

export default AppHeader;
