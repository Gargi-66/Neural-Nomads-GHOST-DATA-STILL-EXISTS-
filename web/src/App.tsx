import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FeatureBar } from './components/FeatureBar';
import { ProblemSection } from './components/ProblemSection';
import { HowItWorks } from './components/HowItWorks';
import { ArchitectureSection } from './components/ArchitectureSection';
import { BottomSection } from './components/BottomSection';
import { InvestigationModal } from './components/InvestigationModal';

export function App() {
  const [activeSection, setActiveSection] = useState('product');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState('case_0412');

  const handleOpenInvestigate = (caseId = 'case_0412') => {
    setSelectedCaseId(caseId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSeeHowItWorks = () => {
    setActiveSection('how-it-works');
    const el = document.getElementById('how-it-works');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF8F5] text-[#1E232A]">
      {/* 1. Navbar */}
      <Navbar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onOpenInvestigate={() => handleOpenInvestigate('case_0412')}
      />

      {/* 2. Hero Section */}
      <Hero
        onStartInvestigation={() => handleOpenInvestigate('case_0412')}
        onSeeHowItWorks={handleSeeHowItWorks}
      />

      {/* 3. Feature Highlights (4 Cards) */}
      <FeatureBar />

      {/* 4. THE PROBLEM */}
      <ProblemSection />

      {/* 5. How AEGIS Works (5 Cards) */}
      <HowItWorks />

      {/* 6. System Architecture */}
      <ArchitectureSection />

      {/* 7. Bottom Section (Tech Stack on Left + Explore a Live Investigation on Right + Landscape) */}
      <BottomSection onOpenSampleCase={() => handleOpenInvestigate('case_0412')} />

      {/* 8. Interactive Investigation Console Modal */}
      <InvestigationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        initialCaseId={selectedCaseId}
      />
    </div>
  );
}

export default App;
