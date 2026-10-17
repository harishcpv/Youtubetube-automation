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
  // Mode: 'smart' (any duration up to 1 hour) or 'short' (procedural / quick highlights)
  const [editingMode, setEditingMode] = useState('smart');

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
  const [autoRemoveSilence, setAutoRemoveSilence] = useState(false);

  // Duration Options: 'full' (keep full video length up to 1 hr) or number in minutes
  const [durationMode, setDurationMode] = useState('full');
  const [customMinutes, setCustomMinutes] = useState(60);

  // Hook Text Overlay
  const [enableHookOverlay, setEnableHookOverlay] = useState(false);
  const [hookText, setHookText] = useState('WATCH THIS FIRST!');

  // Long-Form Job Tracker
  const [activeJobId, setActiveJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [isJobRunning, setIsJobRunning] = useState(false);

  // SFX states
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

  // Poll Render Job Status
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
    }, 1200);

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
        if (data.metadata.durationSec < 3600) {
          setDurationMode('full');
        }
      } else {
        alert(data.error || 'Could not analyze video file.');
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

  // Start Video Render Job (Any Duration up to 1 Hour)
  const handleStartRenderJob = async () => {
    setIsJobRunning(true);
    setJobStatus({ status: 'PROCESSING', progress: 0, currentTime: '00:00:00', eta: 'Initializing FFmpeg...' });

    try {
      let targetSec = null;
      if (durationMode === 'custom') {
        targetSec = customMinutes * 60;
      } else if (durationMode === 'hour') {
        targetSec = 3600;
      } else {
        // 'full': keep natural duration
        targetSec = videoMeta ? videoMeta.durationSec : null;
      }

      const res = await fetch('/api/video/longform/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadedFilename: uploadedFilename || null,
          localFilePath: localFilePath || null,
          targetDuration: targetSec,
          hookText: enableHookOverlay ? hookText : '',
          removeSilence: autoRemoveSilence,
          fastMode: true
        })
      });

      const data = await res.json();
      if (data.success && data.jobId) {
        setActiveJobId(data.jobId);
      } else {
        setIsJobRunning(false);
        alert(data.error || 'Failed to start video render job.');
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
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-indigo-400" />
              Smart Video Editor & Processing Studio
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Any Duration Up to 1 Hour
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Edit, trim, and polish raw video of any duration (from 2 minutes, 8 minutes, 25 minutes, up to 1+ hour raw footage) into a ready-to-publish video.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setEditingMode('smart')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-bold transition ${
              editingMode === 'smart'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Full Video Editor (Up to 1 Hour)
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
            Quick Procedural Generator
          </button>
        </div>
      </div>

      {editingMode === 'smart' ? (
        /* ================= SMART FULL VIDEO EDITOR ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Video Ingestion & Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Input Selection */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-indigo-400" />
                1. Select Raw Video Source
              </h3>
              <p className="text-xs text-slate-400">
                Works with any video format. Paste a local file path (instant for large files) or upload directly.
              </p>

              {/* Direct Local Path */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold text-slate-300">
                  Option A: Paste Local File Path (Instant for Large Files):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={localFilePath}
                    onChange={(e) => setLocalFilePath(e.target.value)}
                    placeholder="e.g. C:\Users\Haris\Videos\my_recording.mp4"
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

              {/* Browser Upload */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <label className="block text-[11px] font-semibold text-slate-300">
                  Option B: Or Drop / Upload from Browser:
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

              {/* Inspected Video Details */}
              {videoMeta && (
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 text-xs space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Video Ready: {videoMeta.filename}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Duration: {videoMeta.durationFormatted} ({videoMeta.durationSec}s)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300">
                    <div className="p-2 rounded bg-slate-900">
                      <span className="text-slate-500 block text-[10px]">File Size</span>
                      <span className="font-bold">{videoMeta.sizeMB} MB</span>
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
                      <span className="text-slate-500 block text-[10px]">Codec</span>
                      <span className="font-bold uppercase">{videoMeta.videoCodec}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Target Duration Settings */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Scissors className="w-4 h-4 text-red-400" />
                2. Output Duration Settings (Up to 1 Hour)
              </h3>

              <div className="space-y-2.5">
                <label className="block text-[11px] font-semibold text-slate-400">
                  Select Desired Output Length:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => setDurationMode('full')}
                    className={`p-3 rounded-xl text-xs font-bold border text-left transition ${
                      durationMode === 'full'
                        ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="block text-emerald-400">✓ Full Video</span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {videoMeta ? `Keep full ${videoMeta.durationFormatted}` : 'Keep natural duration'}
                    </span>
                  </button>

                  <button
                    onClick={() => setDurationMode('hour')}
                    className={`p-3 rounded-xl text-xs font-bold border text-left transition ${
                      durationMode === 'hour'
                        ? 'bg-red-950/40 border-red-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="block text-red-400">🎯 Exactly 1 Hour</span>
                    <span className="text-[10px] text-slate-400 font-normal">Cut/Compress to 60:00</span>
                  </button>

                  <button
                    onClick={() => setDurationMode('custom')}
                    className={`p-3 rounded-xl text-xs font-bold border text-left transition ${
                      durationMode === 'custom'
                        ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="block text-indigo-400">⏱️ Custom Trimming</span>
                    <span className="text-[10px] text-slate-400 font-normal">{customMinutes} Minutes</span>
                  </button>
                </div>

                {durationMode === 'custom' && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 pt-3">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Trim to Duration:</span>
                      <span className="font-bold text-indigo-400">{customMinutes} Minutes</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="60"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Optional Hook Overlay Checkbox */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableHookOverlay}
                    onChange={(e) => setEnableHookOverlay(e.target.checked)}
                    className="rounded accent-red-500"
                  />
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-red-400" />
                    Add Intro Hook Banner (First 5 seconds)
                  </span>
                </label>

                {enableHookOverlay && (
                  <input
                    type="text"
                    value={hookText}
                    onChange={(e) => setHookText(e.target.value)}
                    placeholder="Enter intro hook text..."
                    className="w-full mt-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 font-semibold"
                  />
                )}
              </div>

              {/* Dead Air Scanning */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Silence & Dead-Air Detection</h4>
                    <p className="text-[10px] text-slate-400">Find pauses longer than 1.5s to speed up pace.</p>
                  </div>
                  <button
                    onClick={handleDetectSilence}
                    disabled={isDetectingSilence || (!uploadedFilename && !localFilePath)}
                    className="px-3 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition disabled:opacity-40"
                  >
                    {isDetectingSilence ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Scan Silences'}
                  </button>
                </div>

                {silenceData && (
                  <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/20 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">{silenceData.silenceCount} Pauses Found</p>
                      <p className="text-[10px] text-indigo-300">Total Dead Air: {silenceData.totalSilentMinutes}m ({silenceData.totalSilentSec}s)</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Execution Monitor & Progress (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Play className="w-4 h-4 text-red-500 fill-red-500" />
                  Render & Polish Video
                </h3>
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  {durationMode === 'full' ? 'Full Video' : durationMode === 'hour' ? '60:00' : `${customMinutes}:00`}
                </span>
              </div>

              <p className="text-xs text-slate-400">
                Multi-threaded FFmpeg engine with Windows font compatibility and automated fallback. Processes any video up to 1 hour with zero crashes.
              </p>

              <button
                onClick={handleStartRenderJob}
                disabled={isJobRunning || (!uploadedFilename && !localFilePath)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-xl shadow-red-500/20 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isJobRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Rendering ({jobStatus?.progress || 0}%)...
                  </>
                ) : (
                  <>
                    <Scissors className="w-4 h-4" />
                    Start Video Render
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

                  {/* Completed Download Link */}
                  {jobStatus.downloadUrl && (
                    <a
                      href={jobStatus.downloadUrl}
                      download
                      className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-500/20"
                    >
                      <Download className="w-4 h-4" />
                      Download Rendered MP4
                    </a>
                  )}

                  {jobStatus.error && (
                    <div className="p-2.5 rounded bg-red-950/40 border border-red-500/30 text-red-300 text-[11px]">
                      Error: {jobStatus.error}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SFX Quick Test */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Music className="w-4 h-4 text-emerald-400" />
                Audition Sound Effects
              </h4>
              <div className="space-y-1.5">
                {sfxList.slice(0, 3).map((sfx) => (
                  <div key={sfx.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-950 text-xs">
                    <span className="text-slate-300">{sfx.name}</span>
                    <button
                      onClick={() => playSfx(sfx.id)}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px]"
                    >
                      ▶ Play
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= QUICK PROCEDURAL MODE ================= */
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
          <p className="text-sm font-semibold text-slate-200">Procedural Motion Generator</p>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Use the Auto-Pilot tab or Full Video Editor tab to import and edit your video clips.
          </p>
        </div>
      )}
    </div>
  );
}
