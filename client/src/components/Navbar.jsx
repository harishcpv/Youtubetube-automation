import React from 'react';
import { 
  Sparkles, 
  Video, 
  ShieldCheck, 
  Image as ImageIcon, 
  Rocket, 
  Zap, 
  DownloadCloud, 
  Globe, 
  Smartphone, 
  MonitorPlay 
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  aspectRatio, 
  setAspectRatio, 
  selectedLanguage, 
  setSelectedLanguage, 
  onOpenExport 
}) {
  const tabs = [
    { id: 'autopilot', label: 'Auto-Pilot Mode', icon: Zap, highlight: true },
    { id: 'video', label: 'Video & Hook Studio', icon: Video },
    { id: 'policy', label: 'Policy & Copyright RAG', icon: ShieldCheck },
    { id: 'thumbnail', label: 'Viral Thumbnail Canvas', icon: ImageIcon },
    { id: 'seo', label: 'SEO & Metadata', icon: Rocket },
  ];

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिन्दी (Hindi)', flag: '🇮🇳' },
    { code: 'te', name: 'తెలుగు (Telugu)', flag: '🇮🇳' },
    { code: 'ta', name: 'தமிழ் (Tamil)', flag: '🇮🇳' },
    { code: 'es', name: 'Español (Spanish)', flag: '🇪🇸' },
    { code: 'fr', name: 'Français (French)', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch (German)', flag: '🇩🇪' },
    { code: 'ja', name: '日本語 (Japanese)', flag: '🇯🇵' },
    { code: 'ko', name: '한국어 (Korean)', flag: '🇰🇷' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'ar', name: 'العربية (Arabic)', flag: '🇸🇦' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-red-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Youtubetube automation
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-red-500/10 text-red-400 border border-red-500/30">
                Multi-Agent AI
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              All Languages Voiceover & Subtitles Supported
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? tab.highlight 
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-500/20' 
                      : 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : tab.highlight ? 'text-red-400' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right Action Controls: Language + Aspect Ratio + Export */}
        <div className="flex items-center gap-2.5">
          {/* Language Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-transparent text-white font-medium text-xs focus:outline-none cursor-pointer"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                  {l.flag} {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Format Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setAspectRatio('16:9')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-all ${
                aspectRatio === '16:9' ? 'bg-slate-800 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-300'
              }`}
              title="Standard Landscape (16:9)"
            >
              <MonitorPlay className="w-3.5 h-3.5" />
              16:9
            </button>
            <button
              onClick={() => setAspectRatio('9:16')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-all ${
                aspectRatio === '9:16' ? 'bg-slate-800 text-white font-medium shadow-sm' : 'text-slate-400 hover:text-slate-300'
              }`}
              title="Vertical Shorts / Reels (9:16)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              9:16
            </button>
          </div>

          {/* Quick Export ZIP Button */}
          <button
            onClick={onOpenExport}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-500/10 cursor-pointer"
          >
            <DownloadCloud className="w-3.5 h-3.5" />
            Export Bundle
          </button>
        </div>
      </div>
    </header>
  );
}
