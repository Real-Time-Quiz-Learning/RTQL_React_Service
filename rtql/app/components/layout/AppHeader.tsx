"use client";

import React from 'react';
// Use react-router-dom Link for CRA
import { Link } from 'react-router-dom';

const AppHeader: React.FC = () => (
  <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
      {/* Use Link to navigate to the home route */}
  <Link to="/" className="text-2xl font-extrabold text-indigo-600 tracking-tight cursor-pointer">
        RTQL
        <span className="text-gray-900 text-base font-medium ml-1">
          Real Time Quiz Learning
        </span>
      </Link>
      <nav className="hidden md:flex space-x-6 text-gray-600 font-medium">
        {/* These links remain anchor tags as they target sections within the home page */}
        <a href="#" className="hover:text-indigo-600 transition">Features</a>
        <a href="#" className="hover:text-indigo-600 transition">Pricing</a>
        <a href="#" className="hover:text-indigo-600 transition">About</a>
      </nav>
      <div className="flex items-center space-x-4">
          {/* Use Link to navigate to the login route - This is now your new login page */}
          <Link to="/login" className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-200 rounded-full hover:bg-indigo-50 transition shadow-sm">
          Log In / Sign Up
        </Link>
        {/* Use Link to navigate to the signup route */}
  <Link to="/login" className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-full hover:bg-indigo-700 transition shadow-md hover:shadow-lg transform hover:scale-[1.02]">
          Start Free Quiz
        </Link>
      </div>
    </div>
  </header>
);

export default AppHeader;