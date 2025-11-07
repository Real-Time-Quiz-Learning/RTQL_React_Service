import React from 'react';

import AppHeader from '../components/layout/AppHeader';
import AppFooter from '../components/layout/AppFooter';

// Import Section Components
import HeroSection from '../components/section/HeroSection';
import FeatureSection from '../components/section/FeatureSection';
import CallToActionSection from '../components/section/CallToActionSection';

const HomePage: React.FC = () => {
  return (
    <>
      <AppHeader />
      <main>
        <HeroSection />
        <FeatureSection />
        <CallToActionSection />
      </main>
      <AppFooter />
    </>
      
  );
};

export default HomePage;