import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

import { HomePage } from './pages/HomePage';
import { ProductPage } from './pages/ProductPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { ArchitecturePage } from './pages/ArchitecturePage';
import { UseCasesPage } from './pages/UseCasesPage';
import { ResearchPage } from './pages/ResearchPage';
import { DocsPage } from './pages/DocsPage';

export function App() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FBF8F5] text-[#1E232A]">
      {/* Global Navigation Header */}
      <Navbar />

      {/* Main Dynamic View Router */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/product" element={<ProductPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/architecture" element={<ArchitecturePage />} />
          <Route path="/use-cases" element={<UseCasesPage />} />
          <Route path="/research" element={<ResearchPage />} />
          <Route path="/docs" element={<DocsPage />} />
        </Routes>
      </main>

      {/* Global Editorial Footer */}
      <Footer />
    </div>
  );
}

export default App;
