import React from 'react';

const CallToActionSection: React.FC = () => (
  <section className="py-20 bg-indigo-600">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
        Ready to Accelerate Your Knowledge?
      </h2>
      <p className="text-xl text-indigo-100 mb-8">
        Join thousands of students and educators mastering topics faster than ever before.
      </p>
      <a href="#" className="inline-flex px-10 py-4 text-lg font-bold text-indigo-600 bg-white rounded-xl shadow-lg hover:bg-gray-100 transition duration-300 transform hover:scale-105">
        Create Your Free Account
      </a>
    </div>
  </section>
);

export default CallToActionSection;