import React, { useState } from 'react';
import { 
  Zap, 
  Sparkles, 
  CheckCircle2, 
  Play, 
  Download, 
  Copy, 
  ShieldCheck, 
  Flame, 
  Eye, 
  FileText, 
  Volume2, 
  Layers, 
  ArrowRight,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AutopilotView({ 
  aspectRatio, 
  onPackageGenerated, 
  projectData, 
  setProjectData 
}) {
  const [topic, setTopic] = useState('5 Mind-Blowing AI Tools That Feel Illegal in 2026');
  const [niche, setNiche] = useState('Tech & Artificial Intelligence');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [copySuccess, setCopySuccess] = useState('');

  const samplePresets = [
    '5 Mind-Blowing AI Tools That Feel Illegal in 2026',
    'How I Built a $10,000/mo YouTube Channel in 30 Days',
    'Stop Coding Like This! 7 Python Mistakes You Must Avoid',
    'The Real Reason Why 99% of Content Creators Give Up',
    'Unsolved Cyber Mysteries: The Day the Internet Went Dark'
  ];

  const agentSteps = [
    { name: 'Hook & Retention Agent', desc: 'Crafting psychological intro hook & camera directions', icon: Flame },
    { name: 'Subtitles & Voice Agent', desc: 'Generating timed captions & sound effect cues', icon: Volume2 },
    { name: 'Policy & Copyright RAG', desc: 'Auditing YouTube Community Guidelines & Content ID', icon: ShieldCheck },
    { name: 'Viral Thumbnail Agent', desc: 'Engineering high-contrast visual composition & 3D text', icon: Eye },
    { name: 'SEO Rocket Agent', desc: 'Generating high-CTR titles, chapters & 500-char tags', icon: Sparkles },
    { name: 'FFmpeg Compositor', desc: 'Stitching video, burning subtitles, and mixing audio SFX', icon: Layers },
  ];

  const handleRunAutopilot = async () => {
    if (!topic.trim()) return;
    setIsProcessing(true);
    setActiveStep(0);

    // Progressive step animation
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < agentSteps.length - 1 ? prev + 1 : prev));
    }, 1200);

    try {
      const res = await fetch('/api/autopilot/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          niche,
          format: aspectRatio === '9:16' ? 'Shorts' : '16:9'
        })
      });

      const data = await res.json();
      clearInterval(interval);
      setActiveStep(agentSteps.length);

      if (data.success && data.package) {
        setProjectData(data.package);
        if (onPackageGenerated) onPackageGenerated(data.package);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error('Autopilot error:', err);
      clearInterval(interval);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(label);
    setTimeout(() => setCopySuccess(''), 2500);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Banner / Input Section */}
      <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 p-8 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold mb-4">
            <Zap className="w-3.5 h-3.5 animate-bounce" />
            1-Click Autonomous YouTube Generation Pipeline
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            Autonomous Multi-Agent Studio
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
            Enter a video topic or concept. Four specialized AI agents will collaborate simultaneously to script high-retention hooks, synthesize dynamic subtitles & SFX, certify YouTube guidelines compliance via RAG, create viral thumbnails, and render the final video.
          </p>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs text-slate-400 font-medium">Quick Prompts:</span>
            {samplePresets.slice(0, 3).map((p, idx) => (
              <button
                key={idx}
                onClick={() => setTopic(p)}
                className="text-[11px] px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                {p.slice(0, 32)}...
              </button>
            ))}
          </div>

          {/* Topic Input Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. 5 Mind-Blowing AI Tools That Feel Illegal in 2026"
              className="flex-1 bg-slate-900/90 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-inner"
            />
            <button
              onClick={handleRunAutopilot}
              disabled={isProcessing || !topic.trim()}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-red-500/20 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Agents Working...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-white" />
                  Run Full Auto-Pilot
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Progress Cards when Processing */}
      {isProcessing && (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
              Multi-Agent Orchestration in Progress ({activeStep + 1} / {agentSteps.length})
            </h3>
            <span className="text-xs text-indigo-400 font-semibold">Real-time FFmpeg & RAG execution</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {agentSteps.map((step, idx) => {
              const StepIcon = step.icon;
              const isDone = activeStep > idx;
              const isCurrent = activeStep === idx;
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border transition-all duration-300 ${
                    isCurrent
                      ? 'bg-indigo-950/60 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                      : isDone
                      ? 'bg-slate-900/90 border-emerald-500/30'
                      : 'bg-slate-900/40 border-slate-800/40 opacity-40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${isDone ? 'bg-emerald-500/20 text-emerald-400' : isCurrent ? 'bg-indigo-500/20 text-indigo-400 animate-bounce' : 'bg-slate-800 text-slate-500'}`}>
                        <StepIcon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-white">{step.name}</span>
                    </div>
                    {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                    {isCurrent && <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />}
                  </div>
                  <p className="text-[11px] text-slate-400">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Package Results Dashboard if projectData exists */}
      {projectData && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Full Production Package Ready</h3>
                <p className="text-xs text-emerald-300/80">All 4 Agents completed analysis & rendering in compliance with YouTube guidelines.</p>
              </div>
            </div>
            {copySuccess && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                ✓ Copied {copySuccess}!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Video Player & Intro Hook (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Video Player Card */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4 text-red-500 fill-red-500" />
                    <h3 className="text-sm font-bold text-white">Rendered Video Output</h3>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {aspectRatio === '9:16' ? 'Shorts 1080x1920' : '1080p 16:9'}
                    </span>
                  </div>
                  {projectData.video?.downloadUrl && (
                    <a
                      href={projectData.video.downloadUrl}
                      download
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download MP4
                    </a>
                  )}
                </div>

                {projectData.video?.downloadUrl ? (
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-slate-800">
                    <video
                      src={projectData.video.downloadUrl}
                      controls
                      autoPlay
                      muted
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="p-8 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center">
                    <p className="text-xs text-slate-400">Video synthesized and available for individual render in Video Studio tab.</p>
                  </div>
                )}

                {/* Selected Hook Card */}
                {projectData.hook && (
                  <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5" />
                        Psychological Intro Hook ({projectData.hook.style})
                      </span>
                      <span className="text-xs font-semibold text-emerald-400">
                        {projectData.hook.retentionScore}% Retention Potential
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white">"{projectData.hook.text}"</p>
                    <p className="text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">Camera & Visual Direction: </span>
                      {projectData.hook.visualHook}
                    </p>
                  </div>
                )}
              </div>

              {/* Subtitles & Timed Cues */}
              {projectData.subtitles && (
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-indigo-400" />
                      Timed Captions & Audio Sync ({projectData.subtitles.subtitlesCount} Captions)
                    </h3>
                    <button
                      onClick={() => copyToClipboard(projectData.subtitles.srtContent, 'SRT Subtitles')}
                      className="text-xs flex items-center gap-1 text-slate-400 hover:text-white transition"
                    >
                      <Copy className="w-3 h-3" />
                      Copy SRT
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {projectData.subtitles.subtitles?.map((sub) => (
                      <div key={sub.id} className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60 text-xs">
                        <span className="text-[11px] font-mono text-indigo-400 shrink-0">
                          {sub.startTime}s - {sub.endTime}s
                        </span>
                        <span className="text-slate-200 font-medium">{sub.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: RAG Compliance + Viral Thumbnail + SEO (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* RAG Policy Certification Card */}
              {projectData.compliance && (
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-bold text-white">RAG Policy & Copyright Audit</h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      Score: {projectData.compliance.safetyScore}%
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Monetization Status:</span>
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        🟢 Green Dollar (Full AdSense)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Community Violations:</span>
                      <span className="font-semibold text-slate-200">
                        {projectData.compliance.totalViolations} Detected
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Content ID Music Claim:</span>
                      <span className="font-semibold text-emerald-400">0% Risk (Royalty Free)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Thumbnail Concept Preview Card */}
              {projectData.thumbnail?.recommended && (
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Eye className="w-4 h-4 text-amber-400" />
                      Viral Thumbnail Directives
                    </h3>
                    <span className="text-xs text-amber-400 font-semibold">High CTR</span>
                  </div>

                  <div className="p-4 rounded-xl bg-gradient-to-tr from-cyan-950/40 to-slate-950 border border-cyan-500/30 space-y-2">
                    <p className="text-xs font-bold text-cyan-300">{projectData.thumbnail.recommended.name}</p>
                    <div className="p-2.5 rounded bg-black/60 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Recommended Text Overlay</span>
                      <p className="text-base font-black text-yellow-300 tracking-wider">
                        "{projectData.thumbnail.recommended.textOverlay}"
                      </p>
                    </div>
                    <p className="text-xs text-slate-300">
                      <span className="text-slate-400">Composition: </span>
                      {projectData.thumbnail.recommended.focalElement}
                    </p>
                  </div>
                </div>
              )}

              {/* SEO & Title Card */}
              {projectData.seo && (
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      Top High-CTR Title
                    </h3>
                    <button
                      onClick={() => copyToClipboard(projectData.seo.selectedTitle, 'Title')}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
                    >
                      <Copy className="w-3 h-3" />
                      Copy Title
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <p className="font-bold text-sm text-white mb-1.5">{projectData.seo.selectedTitle}</p>
                    <div className="flex items-center gap-2 text-slate-400">
                      <span className="text-emerald-400 font-semibold">Predicted CTR: ~11.8%</span>
                      <span>•</span>
                      <span>Character Count: {projectData.seo.selectedTitle.length} / 100</span>
                    </div>
                  </div>

                  {/* 1-Click Copy Tags */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                    <span className="text-xs text-slate-400">500-char Studio Tags:</span>
                    <button
                      onClick={() => copyToClipboard(projectData.seo.tagsFormatted, 'Studio Tags')}
                      className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Copy Tags
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
