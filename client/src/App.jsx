import React, { useState } from 'react';
import Navbar from './components/Navbar';
import AutopilotView from './components/AutopilotView';
import VideoStudio from './components/VideoStudio';
import PolicyGuardView from './components/PolicyGuardView';
import ThumbnailStudio from './components/ThumbnailStudio';
import SEORocketView from './components/SEORocketView';
import ExportModal from './components/ExportModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('autopilot');
  const [aspectRatio, setAspectRatio] = useState('16:9'); // '16:9' or '9:16'
  const [projectData, setProjectData] = useState(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        aspectRatio={aspectRatio}
        setAspectRatio={setAspectRatio}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'autopilot' && (
          <AutopilotView
            aspectRatio={aspectRatio}
            projectData={projectData}
            setProjectData={setProjectData}
            onPackageGenerated={(pkg) => setProjectData(pkg)}
          />
        )}

        {activeTab === 'video' && (
          <VideoStudio
            aspectRatio={aspectRatio}
            projectData={projectData}
            setProjectData={setProjectData}
          />
        )}

        {activeTab === 'policy' && (
          <PolicyGuardView />
        )}

        {activeTab === 'thumbnail' && (
          <ThumbnailStudio
            projectData={projectData}
          />
        )}

        {activeTab === 'seo' && (
          <SEORocketView
            projectData={projectData}
          />
        )}
      </main>

      {/* Export Bundle Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        projectData={projectData}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-5 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>Youtubetube automation AI • 4 Agentic Engines Integrated</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> FFmpeg 9.0 Active
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> RAG Policy Guardian Online
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> 1280x720 HD Ready
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
