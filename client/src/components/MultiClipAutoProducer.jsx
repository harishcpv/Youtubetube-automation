import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Upload, 
  Play, 
  Volume2, 
  Flame, 
  Download, 
  CheckCircle2, 
  Sparkles, 
  Music, 
  FileText, 
  Loader2, 
  Trash2, 
  Globe, 
  Image as ImageIcon, 
  ShieldCheck, 
  Copy, 
  Check,
  Plus,
  ChevronUp,
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function MultiClipAutoProducer({ selectedLanguage = 'en', onPackageGenerated }) {
  // Uploaded clips list
  const [clips, setClips] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [localPathInput, setLocalPathInput] = useState('');

  // Production Settings
  const [topic, setTopic] = useState('Ultimate Guide to Space-Saving Study Table Setup');
  const [language, setLanguage] = useState(selectedLanguage || 'en');
  const [thumbnailText, setThumbnailText] = useState('DON\'T BUY BEFORE THIS!');
  const [enableVoiceover, setEnableVoiceover] = useState(true);
  const [enableMusic, setEnableMusic] = useState(true);
  const [enableSubtitles, setEnableSubtitles] = useState(true);

  // Job Tracker
  const [isProducing, setIsProducing] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [jobData, setJobData] = useState(null);
  const [copiedLabel, setCopiedLabel] = useState('');

  // Sync language from parent if changed
  useEffect(() => {
    if (selectedLanguage) setLanguage(selectedLanguage);
  }, [selectedLanguage]);

  // Poll Job Status
  useEffect(() => {
    if (!jobId || !isProducing) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/producer/status/${jobId}`);
        const data = await res.json();
        if (data.success && data.job) {
          setJobData(data.job);
          if (data.job.status === 'COMPLETED' || data.job.status === 'FAILED') {
            setIsProducing(false);
            if (data.job.status === 'COMPLETED') {
              confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
              if (onPackageGenerated) onPackageGenerated(data.job);
            }
          }
        }
      } catch (err) {
        console.error('Producer polling error:', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [jobId, isProducing]);

  // Handle Multiple File Upload
  const handleBatchUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setIsUploading(true);
    const formData = new FormData();
    files.forEach((file) => formData.append('clips', file));

    try {
      const res = await fetch('/api/producer/upload-batch', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success && data.clips) {
        setClips((prev) => [...prev, ...data.clips]);
      }
    } catch (err) {
      console.error('Batch upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Add Local Path
  const handleAddLocalPath = () => {
    if (!localPathInput.trim()) return;
    setClips((prev) => [
      ...prev,
      {
        id: Date.now(),
        filename: localPathInput.split('\\').pop() || localPathInput,
        localPath: localPathInput,
        originalName: localPathInput.split('\\').pop() || localPathInput,
        sizeMB: 0
      }
    ]);
    setLocalPathInput('');
  };

  // Remove a clip
  const handleRemoveClip = (id) => {
    setClips(clips.filter((c) => c.id !== id));
  };

  // Move clip up in sequence order
  const moveClipUp = (index) => {
    if (index === 0) return;
    setClips((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  // Move clip down in sequence order
  const moveClipDown = (index) => {
    if (index === clips.length - 1) return;
    setClips((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  // Clear all clips
  const handleClearAll = () => {
    setClips([]);
  };

  // Run Master Stitch & Automate
  const handleProduceAll = async () => {
    if (!clips.length) {
      alert('Please upload or add at least 1 or more raw clips first.');
      return;
    }

    setIsProducing(true);
    setJobData({
      status: 'PROCESSING',
      step: 'Starting Master Production Engine...',
      progress: 5
    });

    const clipFilenames = clips.filter((c) => c.filename && !c.localPath).map((c) => c.filename);
    const localFilePaths = clips.filter((c) => c.localPath).map((c) => c.localPath);

    try {
      const res = await fetch('/api/producer/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clipFilenames,
          localFilePaths,
          topic,
          language,
          thumbnailHeadline: thumbnailText,
          enableMusic,
          enableVoiceover
        })
      });

      const data = await res.json();
      if (data.success && data.jobId) {
        setJobId(data.jobId);
      } else {
        setIsProducing(false);
        alert(data.error || 'Failed to start batch production.');
      }
    } catch (err) {
      console.error('Start error:', err);
      setIsProducing(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(''), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Banner */}
      <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/50 to-slate-900 border border-indigo-500/30 p-8 shadow-2xl overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold mb-3">
            <Layers className="w-3.5 h-3.5" />
            Multi-Clip Batch Automation Studio (Any Number of Clips)
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
            Upload Any Number of Raw Footages → 1 Complete YouTube Video
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            Upload 1, 2, 4, 8, 15 or more raw video takes. The engine will <b>stitch all footages together in order</b>, inject <b>hooks</b>, synthesize <b>voiceover in your chosen language</b>, add <b>background music & SFX</b>, generate a <b>viral thumbnail with text</b>, and build complete <b>SEO titles & timestamps</b>.
          </p>

          {/* Quick Topic Input */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8">
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Video Topic / Concept:
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Space-Saving Writing & Study Table Setup for Home"
                className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-3 text-xs text-white font-semibold focus:outline-none"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Thumbnail Text Overlay:
              </label>
              <input
                type="text"
                value={thumbnailText}
                onChange={(e) => setThumbnailText(e.target.value)}
                placeholder="e.g. DON'T BUY BEFORE THIS!"
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-3 text-xs text-yellow-300 font-extrabold uppercase focus:outline-none tracking-wide"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Multi-Clip Drop Zone & Clip Order (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-400" />
                1. Upload Raw Footages (Any Number of Clips)
              </h3>
              <div className="flex items-center gap-2">
                {clips.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-[11px] text-slate-400 hover:text-red-400 flex items-center gap-1 transition"
                    title="Clear list"
                  >
                    <RotateCcw className="w-3 h-3" /> Clear
                  </button>
                )}
                <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                  {clips.length} Clips Queued
                </span>
              </div>
            </div>

            {/* Drag & Drop Multi-Upload Box */}
            <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-950/40 group">
              <input
                type="file"
                multiple
                accept="video/*"
                onChange={handleBatchUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-indigo-600/20 text-slate-400 group-hover:text-indigo-400 flex items-center justify-center mb-2 transition">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-white">
                {isUploading ? 'Uploading Raw Clips...' : 'Drop any number of raw video clips here (no limit)'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Select multiple files at once (MP4, MOV, WEBM)
              </p>
            </label>

            {/* Or Paste Direct Local File Path */}
            <div className="pt-2">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Or Add Direct Local File Path:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={localPathInput}
                  onChange={(e) => setLocalPathInput(e.target.value)}
                  placeholder="e.g. C:\Users\Haris\Videos\clip1.mp4"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                />
                <button
                  onClick={handleAddLocalPath}
                  disabled={!localPathInput.trim()}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>

            {/* List of Stitched Sequence Clips */}
            {clips.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Stitching Sequence (Use ⬆️ ⬇️ to re-order):
                  </span>
                </div>
                <div className="space-y-2">
                  {clips.map((clip, index) => (
                    <div
                      key={clip.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 font-bold flex items-center justify-center text-[11px]">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-white font-bold truncate max-w-xs">{clip.originalName}</p>
                          <p className="text-[10px] text-slate-400">
                            {clip.sizeMB > 0 ? `${clip.sizeMB} MB` : 'Local File'} • Clip {index + 1} of {clips.length}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveClipUp(index)}
                          disabled={index === 0}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800 transition"
                          title="Move earlier"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveClipDown(index)}
                          disabled={index === clips.length - 1}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-slate-800 transition"
                          title="Move later"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveClip(clip.id)}
                          className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800 transition ml-1"
                          title="Remove clip"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Master Automation Triggers (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              2. Included Automation Features (All 1-Click)
            </h3>

            {/* Feature Checkboxes */}
            <div className="space-y-2.5 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              <label className="flex items-center gap-2.5 text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableVoiceover}
                  onChange={(e) => setEnableVoiceover(e.target.checked)}
                  className="rounded accent-indigo-500"
                />
                <span className="font-semibold">
                  🎙️ Synthesize Native AI Voiceover ({language.toUpperCase()})
                </span>
              </label>

              <label className="flex items-center gap-2.5 text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableMusic}
                  onChange={(e) => setEnableMusic(e.target.checked)}
                  className="rounded accent-emerald-500"
                />
                <span className="font-semibold">
                  🎵 Layer Royalty-Free Background Music & Impact SFX
                </span>
              </label>

              <label className="flex items-center gap-2.5 text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableSubtitles}
                  onChange={(e) => setEnableSubtitles(e.target.checked)}
                  className="rounded accent-yellow-500"
                />
                <span className="font-semibold">
                  💬 Generate & Burn Synced Subtitles (.SRT)
                </span>
              </label>

              <div className="flex items-center gap-2.5 text-emerald-400 pt-1 border-t border-slate-800/80">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-bold">
                  🎨 Generate 1280x720 Viral Thumbnail with Text on It
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-indigo-400">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-bold">
                  🚀 Generate Titles, Timestamped Chapters & 500-char Studio Tags
                </span>
              </div>
            </div>

            {/* BIG ACTION BUTTON */}
            <button
              onClick={handleProduceAll}
              disabled={isProducing || clips.length === 0}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-red-500/20 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2.5"
            >
              {isProducing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Stitching & Producing Video ({jobData?.progress || 0}%)...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-white" />
                  <span>STITCH {clips.length > 0 ? `${clips.length} CLIPS` : 'ALL CLIPS'} & AUTOMATE (1-CLICK)</span>
                </>
              )}
            </button>

            {/* Progress Status Card */}
            {jobData && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-white flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${jobData.status === 'COMPLETED' ? 'bg-emerald-400' : 'bg-red-400 animate-pulse'}`}></span>
                    {jobData.step || jobData.status}
                  </span>
                  <span className="text-indigo-400 font-mono">{jobData.progress}%</span>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-red-500 via-rose-500 to-indigo-500 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${jobData.progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= FINAL OUTPUT SHOWCASE ================= */}
      {jobData?.status === 'COMPLETED' && (
        <div className="space-y-6 pt-6 border-t border-slate-800 animate-in slide-in-from-bottom-4 duration-500">
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Full Video Package Completed & Stitched!</h3>
                <p className="text-xs text-emerald-300">
                  All {clips.length} clips merged + hook + voiceover + music + thumbnail + SEO generated.
                </p>
              </div>
            </div>
            {copiedLabel && (
              <span className="text-xs font-bold px-3 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                ✓ Copied {copiedLabel}!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Rendered Video Player (7 cols) */}
            <div className="lg:col-span-7 space-y-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Play className="w-4 h-4 text-red-500 fill-red-500" />
                  Final Stitched Video with Hook & Music
                </span>
                <a
                  href={jobData.downloadUrl}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
                >
                  <Download className="w-3.5 h-3.5" /> Download Stitched MP4
                </a>
              </div>

              <div className="relative rounded-xl overflow-hidden bg-black aspect-video border border-slate-800">
                <video src={jobData.downloadUrl} controls autoPlay className="w-full h-full object-contain" />
              </div>

              {/* Spoken Voiceover Player */}
              {jobData.voiceoverUrl && (
                <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span>🎙️ Spoken AI Voiceover ({language.toUpperCase()})</span>
                    <a href={jobData.voiceoverUrl} download className="text-indigo-300 hover:text-white text-[11px] flex items-center gap-1">
                      <Download className="w-3 h-3" /> Download Voiceover MP3
                    </a>
                  </div>
                  <audio controls src={jobData.voiceoverUrl} className="w-full h-8" />
                </div>
              )}
            </div>

            {/* Thumbnail with Text on It + SEO (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Thumbnail Card */}
              {jobData.thumbnailUrl && (
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-amber-400" />
                      Generated Viral Thumbnail with Text
                    </span>
                    <a
                      href={jobData.thumbnailUrl}
                      download
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Download 1280x720 PNG
                    </a>
                  </div>

                  <div className="relative rounded-xl overflow-hidden border border-slate-800 aspect-video shadow-2xl">
                    <img src={jobData.thumbnailUrl} alt="Thumbnail with text" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              {/* SEO Title & Chapters Card */}
              {jobData.seo && (
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      YouTube Studio Package
                    </span>
                    <button
                      onClick={() => copyToClipboard(jobData.seo.selectedTitle, 'Title')}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> Copy Title
                    </button>
                  </div>

                  <p className="text-xs font-bold text-white p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    {jobData.seo.selectedTitle}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <span className="text-xs text-slate-400">Chapters & Tags:</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(jobData.seo.description, 'Description')}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                      >
                        Copy Description
                      </button>
                      <button
                        onClick={() => copyToClipboard(jobData.seo.tagsFormatted, 'Tags')}
                        className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                      >
                        Copy Tags
                      </button>
                    </div>
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
