import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Upload, 
  Play, 
  Volume2, 
  Flame, 
  Layers, 
  Download, 
  Check, 
  Sparkles, 
  Music, 
  Sliders, 
  FileText,
  Loader2,
  Trash2,
  Clock,
  Scissors,
  CheckCircle2,
  AlertCircle,
  FolderOpen
} from 'lucide-react';

export default function VideoStudio({ aspectRatio, projectData, setProjectData }) {
  // Mode: 'short' or 'longform'
  const [editingMode, setEditingMode] = useState('longform'); // default to long-form 1-hour studio

  // Media Source States
  const [videoFile, setVideoFile] = useState(null);
  const [uploadedFilename, setUploadedFilename] = useState('');
  const [localFilePath, setLocalFilePath] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState('');

  // Video Inspection Metadata
  const [videoMeta, setVideoMeta] = useState(null);
  const [isInspecting, setIsInspecting] = useState(false);

  // Silence Detection States
  const [silenceData, setSilenceData] = useState(null);
  const [isDetectingSilence, setIsDetectingSilence] = useState(false);
  const [autoRemoveSilence, setAutoRemoveSilence] = useState(true);

  // Long-Form 1-Hour Configuration
  const [targetDurationMin, setTargetDurationMin] = useState(60); // 60 minutes = 1 hour
  const [hookText, setHookText] = useState('FULL 1-HOUR COMPLETE BREAKDOWN');
  const [segments, setSegments] = useState([
    { id: 1, title: 'Introduction & Context', start: 0, end: 900 },
    { id: 2, title: 'Deep-Dive Execution', start: 900, end: 2400 },
    { id: 3, title: 'Case Study & Analysis', start: 2400, end: 3600 },
  ]);

  // Long-Form Job Tracker
  const [activeJobId, setActiveJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [isJobRunning, setIsJobRunning] = useState(false);

  // Standard Short-Form / SFX states
  const [topic, setTopic] = useState('How AI will change coding forever');
  const [script, setScript] = useState('Welcome to the complete breakdown! In this video we cover everything you need.');
  const [subtitles, setSubtitles] = useState([]);
  const [sfxList, setSfxList] = useState([]);
  const [selectedSfx, setSelectedSfx] = useState('boom');
  const [playingSfx, setPlayingSfx] = useState(null);

  // Load SFX on mount
  useEffect(() => {
    fetch('/api/video/sfx-list')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSfxList(data.sfx);
      })
      .catch((err) => console.error('Error fetching SFX:', err));
  }, []);

  // Poll Long-Form Job Status
  useEffect(() => {
    if (!activeJobId || !isJobRunning) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/video/longform/status/${activeJobId}`);
        const data = await res.json();
        if (data.success && data.job) {
          setJobStatus(data.job);
          if (data.job.status === 'COMPLETED' || data.job.status === 'FAILED') {
            setIsJobRunning(false);
          }
        }
      } catch (err) {
        console.error('Job polling error:', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [activeJobId, isJobRunning]);

  // Inspect Video File Metadata
  const handleInspectVideo = async (filename, pathInput) => {
    setIsInspecting(true);
    try {
      const res = await fetch('/api/video/analyze-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadedFilename: filename || uploadedFilename,
          localFilePath: pathInput || localFilePath
        })
      });
      const data = await res.json();
      if (data.success && data.metadata) {
        setVideoMeta(data.metadata);
      }
    } catch (err) {
      console.error('Error inspecting video:', err);
    } finally {
      setIsInspecting(false);
    }
  };

  // Upload Raw Video
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
    setIsUploading(true);

    const formData = new FormData();
    formData.append('video', file);

    try {
      const res = await fetch('/api/video/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setUploadedFilename(data.filename);
        handleInspectVideo(data.filename, null);
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Detect Dead Air / Silences
  const handleDetectSilence = async () => {
    setIsDetectingSilence(true);
    try {
      const res = await fetch('/api/video/detect-silence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadedFilename,
          localFilePath,
          noiseDb: -30,
          minDuration: 1.5
        })
      });
      const data = await res.json();
      if (data.success) {
        setSilenceData(data);
      }
    } catch (err) {
      console.error('Error detecting silence:', err);
    } finally {
      setIsDetectingSilence(false);
    }
  };

  // Start 1-Hour Long-Form Render Job
  const handleStart1HourJob = async () => {
    setIsJobRunning(true);
    setJobStatus({ status: 'STARTING', progress: 0, currentTime: '00:00:00', eta: 'Starting FFmpeg...' });

    try {
      const targetSec = targetDurationMin * 60; // 60 min = 3600 sec
      const res = await fetch('/api/video/longform/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadedFilename: uploadedFilename || null,
          localFilePath: localFilePath || null,
          targetDuration: targetSec,
          hookText,
          removeSilence: autoRemoveSilence,
          fastMode: true
        })
      });

      const data = await res.json();
      if (data.success && data.jobId) {
        setActiveJobId(data.jobId);
      } else {
        setIsJobRunning(false);
        alert(data.error || 'Failed to start long-form render job.');
      }
    } catch (err) {
      console.error('Start job error:', err);
      setIsJobRunning(false);
    }
  };

  // Play Sound Effect preview
  const playSfx = (sfxId) => {
    const audio = new Audio(`/outputs/sfx/${sfxId}.wav`);
    setPlayingSfx(sfxId);
    audio.play().catch((err) => console.log('Audio play blocked:', err));
    audio.onended = () => setPlayingSfx(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Studio Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-indigo-400" />
              Video Production & Long-Form Studio
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-500/10 text-red-400 border border-red-500/30">
              1+ Hour → 1 Hour Engine
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Engineered to process massive raw footage (1 to 4+ hours) and edit it down into a polished 1-hour YouTube video.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setEditingMode('longform')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold transition ${
              editingMode === 'longform'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            1-Hour Long-Form Mode
          </button>
          <button
            onClick={() => setEditingMode('short')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold transition ${
              editingMode === 'short'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Highlights & Intro Clips
          </button>
        </div>
      </div>

      {editingMode === 'longform' ? (
        /* ================= 1-HOUR LONG-FORM STUDIO ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Raw Footage Ingestion & Analysis (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Input Selection: Local Path OR Upload */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-indigo-400" />
                1. Raw Footage Source (1+ Hour File)
              </h3>
              <p className="text-xs text-slate-400">
                For massive files (2GB - 20GB+), you can paste the <b>local file path</b> directly from your computer to bypass slow browser uploads, or drop the file below.
              </p>

              {/* Direct Local File Path Input */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-300">
                  Option A: Paste Direct Local File Path (Instant for 10GB+ Raw Files):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={localFilePath}
                    onChange={(e) => setLocalFilePath(e.target.value)}
                    placeholder="e.g. C:\Users\Haris\Videos\Raw_Podcast_Episode_1h25m.mp4"
                    className="flex-1 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none font-mono"
                  />
                  <button
                    onClick={() => handleInspectVideo(null, localFilePath)}
                    disabled={isInspecting || !localFilePath.trim()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
                  >
                    {isInspecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Inspect File'}
                  </button>
                </div>
              </div>

              {/* Or Browser File Upload */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <label className="block text-[11px] font-semibold text-slate-300">
                  Option B: Or Upload from Browser:
                </label>
                <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-950/40">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Upload className="w-5 h-5 text-slate-400 mb-1" />
                  <span className="text-xs text-slate-300 font-medium">
                    {isUploading ? 'Uploading file...' : uploadedFilename ? `Uploaded: ${uploadedFilename}` : 'Click to select raw video file'}
                  </span>
                </label>
              </div>

              {/* Video Inspection Metadata Card */}
              {videoMeta && (
                <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 text-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Raw Footage Verified: {videoMeta.filename}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      videoMeta.isOverOneHour ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {videoMeta.durationFormatted} ({videoMeta.durationSec}s)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300">
                    <div className="p-2 rounded bg-slate-900">
                      <span className="text-slate-500 block text-[10px]">Total Size</span>
                      <span className="font-bold">{videoMeta.sizeGB > 0 ? `${videoMeta.sizeGB} GB` : `${videoMeta.sizeMB} MB`}</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900">
                      <span className="text-slate-500 block text-[10px]">Resolution</span>
                      <span className="font-bold">{videoMeta.width}x{videoMeta.height}</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900">
                      <span className="text-slate-500 block text-[10px]">Framerate</span>
                      <span className="font-bold">{Math.round(videoMeta.fps)} FPS</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900">
                      <span className="text-slate-500 block text-[10px]">Video Codec</span>
                      <span className="font-bold uppercase">{videoMeta.videoCodec}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Target Duration & Dead-Air Removal */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Scissors className="w-4 h-4 text-red-400" />
                2. Target 1-Hour Compression & Silence Removal
              </h3>

              {/* Target Duration Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                  Target Final Video Duration:
                </label>
                <div className="flex gap-2">
                  {[
                    { min: 60, label: '🎯 Exactly 60:00 (1 Hour)' },
                    { min: 45, label: '⏱️ 45:00 Minutes' },
                    { min: 90, label: '🎬 90:00 (1.5 Hours)' }
                  ].map((d) => (
                    <button
                      key={d.min}
                      onClick={() => setTargetDurationMin(d.min)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                        targetDurationMin === d.min
                          ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-500/20'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dead Air Scanning */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Smart Dead-Air & Silence Removal</h4>
                    <p className="text-[11px] text-slate-400">
                      Scans raw footage to cut pauses longer than 1.5 seconds, saving time and keeping pace fast.
                    </p>
                  </div>
                  <button
                    onClick={handleDetectSilence}
                    disabled={isDetectingSilence || (!uploadedFilename && !localFilePath)}
                    className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition disabled:opacity-40"
                  >
                    {isDetectingSilence ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Scan Silences'}
                  </button>
                </div>

                {silenceData && (
                  <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">{silenceData.silenceCount} Silent Pauses Found</p>
                      <p className="text-[11px] text-indigo-300">
                        Total Dead Air: {silenceData.totalSilentMinutes} minutes ({silenceData.totalSilentSec}s)
                      </p>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoRemoveSilence}
                        onChange={(e) => setAutoRemoveSilence(e.target.checked)}
                        className="rounded accent-indigo-500"
                      />
                      <span className="text-xs font-semibold text-white">Auto-Trim Dead Air</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Intro Hook Banner */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Intro Hook Banner (First 5s of the 1-Hour Video):
                </label>
                <input
                  type="text"
                  value={hookText}
                  onChange={(e) => setHookText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Execution Monitor & Progress (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Render Action Card */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Play className="w-4 h-4 text-red-500 fill-red-500" />
                  Execute 1-Hour Render Pipeline
                </h3>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  Target: {targetDurationMin}:00
                </span>
              </div>

              <p className="text-xs text-slate-400">
                Uses FFmpeg multi-threaded stream processing (`-threads 0 -preset veryfast`) to compile 1+ hour raw footage into a tightly edited 1-hour video with zero timeouts.
              </p>

              <button
                onClick={handleStart1HourJob}
                disabled={isJobRunning || (!uploadedFilename && !localFilePath)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-xl shadow-red-500/20 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isJobRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Rendering 1-Hour Video ({jobStatus?.progress || 0}%)...
                  </>
                ) : (
                  <>
                    <Scissors className="w-4 h-4" />
                    Start 1-Hour Long-Form Render
                  </>
                )}
              </button>

              {/* Live Render Monitor */}
              {jobStatus && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-white flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${jobStatus.status === 'COMPLETED' ? 'bg-emerald-400' : 'bg-red-400 animate-pulse'}`}></span>
                      Status: {jobStatus.status}
                    </span>
                    <span className="text-indigo-400 font-mono">{jobStatus.progress}%</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-red-500 to-indigo-500 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${jobStatus.progress}%` }}
                    ></div>
                  </div>

                  {/* Metric Chips */}
                  <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400">
                    <div className="p-1.5 rounded bg-slate-900 text-center">
                      <span className="block text-slate-500">Timeline</span>
                      <span className="font-mono text-white font-bold">{jobStatus.currentTime || '00:00:00'}</span>
                    </div>
                    <div className="p-1.5 rounded bg-slate-900 text-center">
                      <span className="block text-slate-500">Speed</span>
                      <span className="font-mono text-emerald-400 font-bold">{jobStatus.speed || '0x'}</span>
                    </div>
                    <div className="p-1.5 rounded bg-slate-900 text-center">
                      <span className="block text-slate-500">ETA</span>
                      <span className="font-mono text-indigo-300 font-bold">{jobStatus.eta || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Download Button when completed */}
                  {jobStatus.downloadUrl && (
                    <a
                      href={jobStatus.downloadUrl}
                      download
                      className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-500/20"
                    >
                      <Download className="w-4 h-4" />
                      Download 1-Hour Video (MP4)
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Architecture Tip */}
            <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs space-y-1.5">
              <span className="font-bold text-indigo-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Hardware Acceleration & Stream Copy
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                FFmpeg uses stream copy and multi-threaded encoding (`-threads 0`). For 1+ hour raw files, it slices chapters and dead air, stitching the output directly into a YouTube-compliant 1-hour MP4.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* ================= SHORT-FORM / HIGHLIGHT STUDIO ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-400" />
                Raw Footage or Procedural Synth
              </h3>
              <p className="text-xs text-slate-400">
                Upload short raw clips or generate procedural motion graphics for quick testing.
              </p>
              <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-950/40">
                <input type="file" accept="video/*" onChange={handleFileUpload} className="hidden" />
                <Upload className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-xs text-slate-300 font-medium">
                  {uploadedFilename ? `Selected: ${uploadedFilename}` : 'Drop clip here'}
                </span>
              </label>
            </div>
          </div>
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Music className="w-4 h-4 text-emerald-400" />
                Audition Sound Effects
              </h3>
              <div className="space-y-2">
                {sfxList.slice(0, 4).map((sfx) => (
                  <div key={sfx.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 text-xs">
                    <span className="text-white font-medium">{sfx.name}</span>
                    <button
                      onClick={() => playSfx(sfx.id)}
                      className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                    >
                      ▶ Play
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
