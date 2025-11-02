import React from 'react';

// Import Layout Components
// FIX: Added the .tsx file extension to all local imports
import AppHeader from './components/layout/AppHeader';
import AppFooter from './components/layout/AppFooter';

// Import Section Components
import HeroSection from './components/section/HeroSection';
import FeatureSection from './components/section/FeatureSection';
import CallToActionSection from './components/section/CallToActionSection';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased text-gray-800">

      <AppHeader />

      <main>
        <HeroSection />
        <FeatureSection />
        <CallToActionSection />
      </main>

      <AppFooter />
      
    </div>
  );
};

export default App;