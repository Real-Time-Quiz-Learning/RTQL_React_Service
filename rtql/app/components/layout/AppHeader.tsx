"use client";

import React, { useState, useEffect } from 'react';
// Use react-router-dom Link for CRA
import { Link } from 'react-router-dom';

const AppHeader: React.FC = () => {
  // 1. State to track the login status
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 2. Function to handle user logout
  const handleLogout = () => {
    // Remove the 'token' from localStorage
    localStorage.removeItem('token');
    // Update the state to reflect the logged-out status
    setIsLoggedIn(false);
    // You might want to navigate to the home page or login page after logout
    // window.location.href = '/'; // Simple hard refresh/navigation
  };

  // 3. useEffect hook to check local storage when the component mounts
  useEffect(() => {
    // Check if the 'token' exists in local storage
    const token = localStorage.getItem('token');
    // Set the state based on the presence of the token
    setIsLoggedIn(!!token);
  }, []); // The empty dependency array ensures this runs only once after the initial render

  return (
    <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        {/* Use Link to navigate to the home route */}
        <Link to="/" className="text-2xl font-extrabold text-indigo-600 tracking-tight cursor-pointer">
          RTQL
          <span className="text-gray-900 text-base font-medium ml-1">
            Real Time Quiz Learning
          </span>
        </Link>
        
        {/* Navigation Links */}
        <nav className="hidden md:flex space-x-6 text-gray-600 font-medium">
          {/* These links remain anchor tags as they target sections within the home page */}
          <a href="#" className="hover:text-indigo-600 transition">Features</a>
          <a href="#" className="hover:text-indigo-600 transition">About</a>
        </nav>

        {/* Dynamic Buttons based on Login Status */}
        <div className="flex items-center space-x-4">
          {isLoggedIn ? (
            // If the user is logged in, show 'Start Quiz' and 'Logout'
            <>
              {/* Button to start a quiz (assuming it's a logged-in feature) */}
              <Link 
                to="/teacher" // Change this to your actual quiz start route
                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-full hover:bg-indigo-700 transition shadow-md hover:shadow-lg transform hover:scale-[1.02]"
              >
                Start Quiz
              </Link>
              {/* Logout Button */}
              <button 
                onClick={handleLogout} 
                className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-200 rounded-full hover:bg-indigo-50 transition shadow-sm"
              >
                Log Out
              </button>
            </>
          ) : (
            // If the user is NOT logged in, show 'Log In / Sign Up' and 'Start Free Quiz'
            <>
              {/* Log In / Sign Up button */}
              <Link 
                to="/login" 
                className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-indigo-600 bg-white border border-indigo-200 rounded-full hover:bg-indigo-50 transition shadow-sm"
              >
                Log In / Sign Up
              </Link>
              {/* Start Free Quiz (directs to login to start) */}
              <Link 
                to="/login" 
                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-full hover:bg-indigo-700 transition shadow-md hover:shadow-lg transform hover:scale-[1.02]"
              >
                Start Free Quiz
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;