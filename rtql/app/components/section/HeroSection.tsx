import React from 'react';

const HeroSection: React.FC = () => (
  <section className="pt-16 pb-24 sm:pt-24 sm:pb-32 bg-gradient-to-br from-indigo-50 to-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight mb-4">
        Learn Faster with <br className="hidden sm:inline"/>
        <span className="text-indigo-600 block sm:inline mt-2">Real Time Quiz Learning.</span>
      </h1>
      <p className="mt-4 text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto">
        Transform passive studying into an active, engaging, and competitive experience that boosts retention instantly.
      </p>
      <div className="mt-10 flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
        <a href="#" className="w-full sm:w-auto px-10 py-4 text-lg font-bold text-white bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/50 hover:bg-indigo-700 transition duration-300 transform hover:scale-105">
          Get Started for Free
        </a>
        <a href="#" className="w-full sm:w-auto px-10 py-4 text-lg font-medium text-gray-700 bg-white border border-gray-300 rounded-xl shadow-md hover:bg-gray-50 transition duration-300 transform hover:scale-105">
          Watch Demo
        </a>
      </div>
      {/* Mock Dashboard Preview */}
      <div className="mt-16 relative">
        <div className="bg-indigo-100 rounded-2xl p-6 shadow-2xl border-4 border-white">
          <div className="h-64 sm:h-96 w-full bg-white rounded-lg border border-indigo-200 flex items-center justify-center text-indigo-400 text-lg font-medium">
            {/* Placeholder for chart/dashboard */}
          </div>
        </div>
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-48 h-8 bg-indigo-200 rounded-t-full blur-xl opacity-70"></div>
      </div>
    </div>
  </section>
);

export default HeroSection;