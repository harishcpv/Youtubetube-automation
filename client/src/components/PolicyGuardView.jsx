import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  ExternalLink, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Wand2, 
  Loader2,
  HelpCircle,
  FileText
} from 'lucide-react';

export default function PolicyGuardView() {
  const [title, setTitle] = useState('5 Mind-Blowing AI Tools That Feel Illegal in 2026');
  const [script, setScript] = useState(
    'In this video we reveal secret AI tools that are completely insane. Warning: do not attempt to use these for illegal hacking or dangerous exploits. We break down the exact legal workflow to automate everything.'
  );
  const [description, setDescription] = useState(
    'Discover the top 5 AI productivity tools for creators in 2026. #ai #tech #tools #productivity #youtube'
  );
  const [audioTrack, setAudioTrack] = useState('Royalty Free Synth Ambient');

  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState(null);

  // Policy Search / Query Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Run initial audit on mount
  useEffect(() => {
    handleRunAudit();
  }, []);

  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await fetch('/api/policy/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          script,
          description,
          audioTracks: [audioTrack]
        })
      });
      const data = await res.json();
      if (data.success) {
        setAuditResult(data.audit);
      }
    } catch (err) {
      console.error('Audit error:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  // 1-Click Auto Sanitize
  const handleAutoSanitize = () => {
    let sanitizedScript = script
      .replace(/\bfuck\b/gi, 'freak')
      .replace(/\bshit\b/gi, 'crap')
      .replace(/\bkill\b/gi, 'dominate')
      .replace(/\bmurder\b/gi, 'crush')
      .replace(/\bhack(ing)?\b/gi, 'optimization');

    let sanitizedTitle = title.replace(/\billegal\b/gi, 'unreal');

    setScript(sanitizedScript);
    setTitle(sanitizedTitle);

    // Re-run audit with sanitized text
    setTimeout(() => {
      fetch('/api/policy/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: sanitizedTitle,
          script: sanitizedScript,
          description,
          audioTracks: [audioTrack]
        })
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setAuditResult(d.audit);
        });
    }, 100);
  };

  // Search Policy Knowledge Base
  const handlePolicySearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/policy/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.policies);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            RAG Policy, Copyright & Community Guidelines Guardian
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time compliance auditor powered by YouTube's official Community Guidelines, Fair Use doctrine, and AdSense advertiser rules.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleAutoSanitize}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition"
          >
            <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
            1-Click Auto Sanitize
          </button>
          <button
            onClick={handleRunAudit}
            disabled={isAuditing}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            {isAuditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            Run Full Policy Audit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Script & Metadata Inputs (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Content Under Inspection
            </h3>

            {/* Title */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Video Title:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>

            {/* Script */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Script / Narration Transcript:
              </label>
              <textarea
                rows={5}
                value={script}
                onChange={(e) => setScript(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl p-3 text-xs text-white focus:outline-none custom-scrollbar"
              />
            </div>

            {/* Audio Track */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Audio Soundtrack / Background Music:
              </label>
              <input
                type="text"
                value={audioTrack}
                onChange={(e) => setAudioTrack(e.target.value)}
                placeholder="e.g. Royalty Free Synth Ambient, Drake Instrumental, etc."
                className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Identifies commercial music tracks that trigger automatic Content ID revenue diversion.
              </p>
            </div>
          </div>

          {/* Interactive RAG Search Query */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-400" />
              Ask YouTube Policy Knowledge Base
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePolicySearch()}
                placeholder="e.g. Can I use 10 seconds of copyright movie clip?"
                className="flex-1 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
              />
              <button
                onClick={handlePolicySearch}
                disabled={isSearching}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
              >
                {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-3 pt-2">
                {searchResults.map((p) => (
                  <div key={p.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-300">{p.title}</span>
                      <a
                        href={p.official_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        Official Policy <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-slate-300 text-[11px]">{p.summary}</p>
                    <p className="text-[10px] text-emerald-400">
                      <span className="font-bold text-slate-400">Safe Approach:</span> {p.remediation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Real-Time Audit & Monetization Gauge (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {auditResult && (
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
              {/* Compliance Score Meter */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center font-extrabold text-xl border-4 ${
                    auditResult.safetyScore >= 80
                      ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                      : auditResult.safetyScore >= 50
                      ? 'border-amber-500 text-amber-400 bg-amber-500/10'
                      : 'border-red-500 text-red-400 bg-red-500/10'
                  }`}>
                    {auditResult.safetyScore}%
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Compliance & Safety Score</h4>
                    <p className="text-xs text-slate-400">{auditResult.statusLabel}</p>
                  </div>
                </div>

                {/* Monetization Pill */}
                <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
                  auditResult.monetizationStatus === 'GREEN_DOLLAR'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : auditResult.monetizationStatus === 'YELLOW_DOLLAR'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-current"></span>
                  {auditResult.monetizationStatus === 'GREEN_DOLLAR'
                    ? 'Green Dollar (Full AdSense)'
                    : auditResult.monetizationStatus === 'YELLOW_DOLLAR'
                    ? 'Yellow Dollar (Limited)'
                    : 'Strike / Restriction Risk'}
                </div>
              </div>

              {/* Flagged Findings List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Detected Flags & Violations ({auditResult.findings.length})</span>
                  {auditResult.findings.length === 0 && (
                    <span className="text-emerald-400 text-xs font-semibold">100% Clean</span>
                  )}
                </h4>

                {auditResult.findings.length === 0 ? (
                  <div className="p-6 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-center space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="text-xs font-bold text-white">No Policy Violations Detected</p>
                    <p className="text-[11px] text-slate-400">
                      Your script and metadata adhere to YouTube Community Guidelines and Advertiser-Friendly rules.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {auditResult.findings.map((f, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border space-y-2 text-xs ${
                          f.severity === 'CRITICAL'
                            ? 'bg-red-950/20 border-red-500/40'
                            : 'bg-amber-950/20 border-amber-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white flex items-center gap-1.5">
                            <AlertTriangle className={`w-3.5 h-3.5 ${f.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}`} />
                            {f.ruleTitle}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            f.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {f.monetizationRisk}
                          </span>
                        </div>

                        <p className="text-slate-300 bg-slate-950/60 p-2 rounded border border-slate-800 text-[11px] font-mono">
                          {f.flaggedText}
                        </p>

                        <div className="text-[11px] space-y-1">
                          <p className="text-slate-200">
                            <span className="font-bold text-indigo-400">Recommended Fix: </span>
                            {f.recommendation}
                          </p>
                          <a
                            href={f.officialUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 inline-block"
                          >
                            Official Policy Documentation <ExternalLink className="w-2.5 h-2.5 inline" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
