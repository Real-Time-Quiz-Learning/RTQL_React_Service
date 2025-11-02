import React from 'react';
import { FeatureCardProps } from '../types/global';

const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description }) => (
  <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-gray-100 transition duration-300 hover:shadow-xl hover:scale-[1.02]">
    <div className="flex items-center space-x-4 mb-4">
      <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
    </div>
    <p className="text-gray-600 leading-relaxed">{description}</p>
  </div>
);

export default FeatureCard;
