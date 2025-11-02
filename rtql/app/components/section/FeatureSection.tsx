import React from 'react';
// Removing .tsx extension from local imports as bundlers often handle this
import FeatureCard from '../reusable/FeatureCard'; 
import { featuredata } from '../data/featuredata';

const FeatureSection: React.FC = () => (
  <section className="py-24 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-center text-gray-900 mb-4">
        Why RTQL is the Future of Learning
      </h2>
      <p className="text-xl text-center text-gray-600 mb-16 max-w-3xl mx-auto">
        We leverage real-time technology to make learning efficient, fun, and measurable.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {featuredata.map((feature, index) => (
          <FeatureCard key={index} {...feature} />
        ))}
      </div>
    </div>
  </section>
);

export default FeatureSection;
