import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { GhostRadarWidget } from './components/GhostRadarWidget';
import { GhostArchetypesSection } from './components/GhostArchetypesSection';
import { ProblemSection } from './components/ProblemSection';
import { FeatureBar } from './components/FeatureBar';
import { BottomSection } from './components/BottomSection';
import { HowItWorks } from './components/HowItWorks';
import { ArchitectureSection } from './components/ArchitectureSection';
import { UseCasesSection } from './components/UseCasesSection';
import { ResearchSection } from './components/ResearchSection';
import { DocsSection } from './components/DocsSection';
import { InvestigationExplorer } from './components/InvestigationExplorer';
import { CaseInvestigationDetail } from './components/CaseInvestigationDetail';
import { EvidenceExplorer } from './components/EvidenceExplorer';
import { InteractiveRelationshipGraph } from './components/InteractiveRelationshipGraph';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { InvestigationModal } from './components/InvestigationModal';
import { SpookyScrollBackground } from './components/SpookyScrollBackground';
import allCases from './data/all_cases.json';

export function App() {
  const [currentView, setCurrentView] = useState<string>('product');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('case_09');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleNavigate = (view: string, caseId?: string) => {
    if (caseId) {
      setSelectedCaseId(caseId);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenSampleCase = (caseId: string = 'case_09') => {
    setSelectedCaseId(caseId);
    setIsModalOpen(true);
  };

  const handleDownloadOutput = () => {
    const headers = 'case_id,deletion_status,steps_json\n';
    const rows = allCases.map(c => {
      const escapedSteps = JSON.stringify(c.steps).replace(/"/g, '""');
      return `${c.case_id},${c.deletion_status},"${escapedSteps}"`;
    }).join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'output.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF9] text-stone-900 selection:bg-stone-200 selection:text-stone-900 transition-colors">
      
      {/* 1. Spooky Scroll Progress Bar & Floating Atmosphere */}
      <SpookyScrollBackground />

      {/* 2. Global Handcrafted Pill Navigation Bar */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => handleNavigate(view)}
        onDownloadOutput={handleDownloadOutput}
        onOpenSampleCase={() => handleOpenSampleCase('case_09')}
      />

      {/* 3. Main Viewport Container */}
      <main className="flex-1 w-full relative z-10">
        
        {/* VIEW 1: PRODUCT (Hero, Ghost Radar, Ghost Archetypes, Problem, FeatureBar, Bottom Section) */}
        {currentView === 'product' && (
          <div className="space-y-4">
            <Hero
              onStartInvestigation={() => handleNavigate('explorer')}
              onSeeHowItWorks={() => handleNavigate('how-it-works')}
            />

            {/* Interactive Ghost Radar Widget: Minimalist Aesthetic Scanner */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <GhostRadarWidget
                onInspectCase={(cid) => handleNavigate('investigation', cid)}
              />
            </div>
            
            {/* The 5 Specters of Deleted Data: Justifying 'Ghost Data Still Exists' */}
            <GhostArchetypesSection 
              onSelectCase={(cid) => handleNavigate('investigation', cid)}
            />

            <ProblemSection />
            <FeatureBar />
            
            <BottomSection
              onOpenSampleCase={() => handleOpenSampleCase('case_09')}
            />
          </div>
        )}

        {/* VIEW 2: GHOST RADAR (Dedicated Radar Room) */}
        {currentView === 'radar' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                Spectral Ectoplasm Scanner
              </h2>
              <p className="text-xs sm:text-sm text-stone-500">
                Pinging 94 distributed evidence artifacts for residual records, replication lag, and restore risks.
              </p>
            </div>
            <GhostRadarWidget
              onInspectCase={(cid) => handleNavigate('investigation', cid)}
            />
            <BottomSection
              onOpenSampleCase={() => handleOpenSampleCase('case_09')}
            />
          </div>
        )}

        {/* VIEW 3: HOW IT WORKS */}
        {currentView === 'how-it-works' && (
          <div className="py-6">
            <HowItWorks />
            <BottomSection
              onOpenSampleCase={() => handleOpenSampleCase('case_09')}
            />
          </div>
        )}

        {/* VIEW 4: ARCHITECTURE */}
        {currentView === 'architecture' && (
          <div className="py-6">
            <ArchitectureSection />
            <BottomSection
              onOpenSampleCase={() => handleOpenSampleCase('case_09')}
            />
          </div>
        )}

        {/* VIEW 5: USE CASES ($2.4M Lawsuit, DR Cold Backup, GDPR vs Rule 12) */}
        {currentView === 'use-cases' && (
          <div className="py-6">
            <UseCasesSection 
              onSelectCase={(cid) => handleNavigate('investigation', cid)}
            />
            <BottomSection
              onOpenSampleCase={() => handleOpenSampleCase('case_09')}
            />
          </div>
        )}

        {/* VIEW 6: RESEARCH & MATHEMATICAL FORMULATION */}
        {currentView === 'research' && (
          <div className="py-6">
            <ResearchSection />
            <BottomSection
              onOpenSampleCase={() => handleOpenSampleCase('case_09')}
            />
          </div>
        )}

        {/* VIEW 7: DOCUMENTATION & API CONTRACT */}
        {currentView === 'docs' && (
          <div className="py-6">
            <DocsSection />
            <BottomSection
              onOpenSampleCase={() => handleOpenSampleCase('case_09')}
            />
          </div>
        )}

        {/* VIEW 8: INVESTIGATION EXPLORER (All 518 Evaluation Cases) */}
        {currentView === 'explorer' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <InvestigationExplorer 
              onSelectCase={(cid) => handleNavigate('investigation', cid)} 
            />
          </div>
        )}

        {/* VIEW 9: CASE INVESTIGATION DETAIL (Deep Dive with Live Exorcism Runner) */}
        {currentView === 'investigation' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <CaseInvestigationDetail
              caseId={selectedCaseId}
              onBack={() => handleNavigate('explorer')}
              onSelectCase={(cid) => setSelectedCaseId(cid)}
            />
          </div>
        )}

        {/* VIEW 10: INTERACTIVE RELATIONSHIP GRAPH */}
        {currentView === 'lineage' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <InteractiveRelationshipGraph
              initialCaseId={selectedCaseId}
              onSelectCase={(cid) => setSelectedCaseId(cid)}
            />
          </div>
        )}

        {/* VIEW 11: EVIDENCE MANIFEST EXPLORER */}
        {currentView === 'evidence' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <EvidenceExplorer />
          </div>
        )}

        {/* VIEW 12: COMPLIANCE ANALYTICS */}
        {currentView === 'analytics' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <AnalyticsDashboard />
          </div>
        )}

      </main>

      {/* 4. Interactive Sample Case Exorcism Modal */}
      <InvestigationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialCaseId={selectedCaseId}
      />

      {/* 5. Minimalist Global Footer */}
      <footer className="border-t border-stone-200/80 bg-white/70 backdrop-blur-xs py-6 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#EA580C]"></span>
            <span className="font-bold text-stone-900">AEGIS 3.0</span>
            <span>&bull; HackerRank Orchestrate: Ghost Data Still Exists</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>518 Cases Audited</span>
            <span>&bull;</span>
            <span>0 Temporal Leakage</span>
            <span>&bull;</span>
            <button
              onClick={handleDownloadOutput}
              className="text-[#EA580C] hover:underline font-bold cursor-pointer"
            >
              output.csv verified
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
