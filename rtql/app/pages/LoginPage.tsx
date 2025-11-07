import React from "react";
import AppHeader from '../components/layout/AppHeader';
import AppFooter from '../components/layout/AppFooter';
import LoginForm from '../components/LoginPage/LoginForm';
import SignupForm from '../components/LoginPage/SignupForm';
import { useState } from 'react';


const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  return (
    <>
      <AppHeader />
      <div className="flex items-center justify-center min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full p-10 bg-white rounded-xl shadow-2xl">
          <div className="flex gap-2 mb-4">
            <button
              className={`flex-1 py-2 rounded-md font-medium ${mode === 'login' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setMode('login')}
            >
              Log in
            </button>
            <button
              className={`flex-1 py-2 rounded-md font-medium ${mode === 'signup' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setMode('signup')}
            >
              Sign up
            </button>
          </div>
          {mode === 'login' ? (
            <LoginForm onSwitch={() => setMode('signup')} />
          ) : (
            <SignupForm onSwitch={() => setMode('login')} />
          )}
        </div>
      </div>
      <AppFooter />
    </>
  );
};

export default LoginPage;