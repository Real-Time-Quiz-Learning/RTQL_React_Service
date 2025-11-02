import React from 'react';

const AppFooter: React.FC = () => (
  <footer className="bg-gray-800 text-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {/* Logo and Info */}
        <div>
          <h4 className="text-xl font-extrabold text-indigo-400 mb-3">RTQL</h4>
          <p className="text-sm text-gray-400">Real Time Quiz Learning.</p>
          <p className="text-sm text-gray-400 mt-2">© 2024 RTQL Inc.</p>
        </div>
        {/* Links 2 */}
        <div>
          <h4 className="text-lg font-semibold mb-3">Company</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><a href="#" className="hover:text-indigo-400 transition">About Us</a></li>
            <li><a href="#" className="hover:text-indigo-400 transition">Careers</a></li>
            <li><a href="#" className="hover:text-indigo-400 transition">Support</a></li>
            <li><a href="#" className="hover:text-indigo-400 transition">Blog</a></li>
          </ul>
        </div>
      </div>
      <div className="mt-10 border-t border-gray-700 pt-6 text-center text-sm text-gray-400">
         Designed for immediate learning and engagement.
      </div>
    </div>
  </footer>
);

export default AppFooter;
