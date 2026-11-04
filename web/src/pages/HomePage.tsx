import React from 'react';
import { Hero } from '../components/Hero';
import { FeatureBar } from '../components/FeatureBar';
import { ProblemSection } from '../components/ProblemSection';
import { HowItWorks } from '../components/HowItWorks';
import { ArchitectureSection } from '../components/ArchitectureSection';
import { BottomSection } from '../components/BottomSection';

export const HomePage: React.FC = () => {
  return (
    <div>
      <Hero />
      <FeatureBar />
      <ProblemSection />
      <HowItWorks />
      <ArchitectureSection />
      <BottomSection />
    </div>
  );
};

