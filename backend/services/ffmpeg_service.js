const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class FFmpegService {
  constructor() {
    this.outputDir = path.join(__dirname, '../../outputs');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    // In-memory active render jobs
    this.jobs = new Map();

    // Determine safe font path on Windows to avoid Fontconfig crashes
    this.fontParam = this.resolveFontParam();
  }

  resolveFontParam() {
    if (process.platform === 'win32') {
      const winFont = 'C:/Windows/Fonts/arial.ttf';
      if (fs.existsSync(winFont)) {
        // In FFmpeg filter syntax, colon in drive letter must be escaped: C\:/Windows/Fonts/arial.ttf
        return "fontfile='C\\:/Windows/Fonts/arial.ttf':";
      }
    }
    return '';
  }

  // 1. Probe Video Metadata (Duration, Resolution, Audio channels, Bitrate)
  getVideoMetadata(filePath) {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(filePath)) {
        return reject(new Error(`File not found: ${filePath}`));
      }

      const args = [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        '-show_streams',
        filePath
      ];

      const proc = spawn('ffprobe', args);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (d) => { stdout += d.toString(); });
      proc.stderr.on('data', (d) => { stderr += d.toString(); });

      proc.on('close', (code) => {
        if (code === 0) {
          try {
            const data = JSON.parse(stdout);
            const durationSec = parseFloat(data.format?.duration || 0);
            const vStream = data.streams?.find(s => s.codec_type === 'video');
            const aStream = data.streams?.find(s => s.codec_type === 'audio');

            const hours = Math.floor(durationSec / 3600);
            const minutes = Math.floor((durationSec % 3600) / 60);
            const seconds = Math.floor(durationSec % 60);
            const formatted = `${hours > 0 ? `${hours}h ` : ''}${minutes}m ${seconds}s`;

            resolve({
              filePath,
              filename: path.basename(filePath),
              durationSec: Number(durationSec.toFixed(2)),
              durationFormatted: formatted,
              isOverOneHour: durationSec >= 3600,
              width: vStream?.width || 1920,
              height: vStream?.height || 1080,
              fps: vStream?.r_frame_rate ? eval(vStream.r_frame_rate) : 30,
              videoCodec: vStream?.codec_name || 'h264',
              audioCodec: aStream?.codec_name || 'aac',
              sizeBytes: parseInt(data.format?.size || 0, 10),
              sizeMB: Number((parseInt(data.format?.size || 0, 10) / (1024 * 1024)).toFixed(2)),
              sizeGB: Number((parseInt(data.format?.size || 0, 10) / (1024 * 1024 * 1024)).toFixed(2))
            });
          } catch (e) {
            reject(new Error(`Failed to parse ffprobe json: ${e.message}`));
          }
        } else {
          reject(new Error(`ffprobe failed with code ${code}: ${stderr}`));
        }
      });

      proc.on('error', (err) => reject(err));
    });
  }

  // 2. Detect Dead-Air / Silences for Automatic Trimming
  detectSilences(filePath, noiseDb = -30, minDuration = 1.5) {
    return new Promise((resolve, reject) => {
      const args = [
        '-i', filePath,
        '-af', `silencedetect=noise=${noiseDb}dB:d=${minDuration}`,
        '-f', 'null',
        '-'
      ];

      const proc = spawn('ffmpeg', args);
      let stderr = '';

      proc.stderr.on('data', (d) => { stderr += d.toString(); });

      proc.on('close', () => {
        const silences = [];
        const startRegex = /silence_start:\s*([0-9.]+)/g;
        const endRegex = /silence_end:\s*([0-9.]+)\s*\|\s*silence_duration:\s*([0-9.]+)/g;

        let match;
        const starts = [];
        while ((match = startRegex.exec(stderr)) !== null) {
          starts.push(parseFloat(match[1]));
        }

        let idx = 0;
        let totalSilentSec = 0;
        while ((match = endRegex.exec(stderr)) !== null && idx < starts.length) {
          const end = parseFloat(match[1]);
          const duration = parseFloat(match[2]);
          const start = starts[idx];
          silences.push({
            start: Number(start.toFixed(2)),
            end: Number(end.toFixed(2)),
            duration: Number(duration.toFixed(2))
          });
          totalSilentSec += duration;
          idx++;
        }

        resolve({
          silenceCount: silences.length,
          totalSilentSec: Number(totalSilentSec.toFixed(2)),
          totalSilentMinutes: Number((totalSilentSec / 60).toFixed(2)),
          silences: silences.slice(0, 50)
        });
      });

      proc.on('error', (err) => reject(err));
    });
  }

  // 3. Start Asynchronous Video Render Job (Supports ANY duration up to 1 hour, or custom)
  async startLongFormJob({
    inputPath,
    targetDuration = null, // null = keep full duration (up to 1 hour or natural duration)
    segments = [],
    removeSilence = false,
    hookText = '',
    fastMode = true
  }) {
    const jobId = `job_${Date.now()}_${Math.round(Math.random() * 1e4)}`;
    const outputFilename = `edited_${jobId}.mp4`;
    const outputPath = path.join(this.outputDir, outputFilename);

    // Initial Job State
    const jobState = {
      jobId,
      status: 'INITIALIZING',
      progress: 0,
      currentTime: '00:00:00',
      targetDuration: targetDuration || 3600,
      targetDurationFormatted: targetDuration ? `${Math.floor(targetDuration/60)}m` : 'Natural Length',
      speed: '0x',
      fps: 0,
      eta: 'Calculating...',
      outputFilename,
      outputPath,
      downloadUrl: null,
      startTime: Date.now(),
      error: null
    };

    this.jobs.set(jobId, jobState);

    // Run processing in background
    this.executeLongFormRender(jobId, {
      inputPath,
      targetDuration,
      segments,
      removeSilence,
      hookText,
      fastMode,
      outputPath,
      outputFilename
    });

    return { jobId, status: 'INITIALIZING' };
  }

  async executeLongFormRender(jobId, config) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'PROCESSING';

    try {
      // 1. Probe input video metadata first to get ACTUAL duration
      let meta = null;
      try {
        meta = await this.getVideoMetadata(config.inputPath);
      } catch (probeErr) {
        console.warn('Metadata probe fallback:', probeErr.message);
      }

      const actualDuration = meta?.durationSec || 60;
      
      // Determine effective duration:
      // If targetDuration was given (e.g. 3600s), but video is shorter (e.g. 484s / 8m),
      // cap it to the actual duration so we don't try cutting nonexistent timestamps!
      let effectiveTargetSec = actualDuration;
      if (config.targetDuration && config.targetDuration > 0) {
        effectiveTargetSec = Math.min(actualDuration, config.targetDuration);
      }

      job.targetDuration = effectiveTargetSec;
      job.targetDurationFormatted = `${Math.floor(effectiveTargetSec / 60)}m ${Math.floor(effectiveTargetSec % 60)}s`;

      let args = ['-y'];

      // Build video filter safely with explicit fontfile to avoid Windows Fontconfig crash
      const font = this.fontParam;
      const cleanHook = (config.hookText || '').replace(/'/g, '').replace(/:/g, '\\:').trim();
      let videoFilter = null;

      if (cleanHook.length > 0) {
        videoFilter = `drawtext=${font}text='${cleanHook}':fontcolor=yellow:fontsize=44:borderw=3:bordercolor=black:x=(w-text_w)/2:y=60:enable='between(t,0,5)'`;
      }

      // If segments were provided
      if (config.segments && config.segments.length > 0) {
        const filterParts = [];
        config.segments.forEach((seg, i) => {
          filterParts.push(`[0:v]trim=start=${seg.start}:end=${seg.end},setpts=PTS-STARTPTS[v${i}];[0:a]atrim=start=${seg.start}:end=${seg.end},asetpts=PTS-STARTPTS[a${i}]`);
        });

        const concatInputs = config.segments.map((_, i) => `[v${i}][a${i}]`).join('');
        let filterComplex = `${filterParts.join(';')};${concatInputs}concat=n=${config.segments.length}:v=1:a=1[vconcat][a]`;

        if (videoFilter) {
          filterComplex += `;[vconcat]${videoFilter}[v]`;
          args.push('-i', config.inputPath, '-filter_complex', filterComplex, '-map', '[v]', '-map', '[a]');
        } else {
          args.push('-i', config.inputPath, '-filter_complex', filterComplex, '-map', '[vconcat]', '-map', '[a]');
        }

        args.push(
          '-c:v', 'libx264',
          '-preset', 'veryfast',
          '-threads', '0',
          '-c:a', 'aac',
          '-b:a', '192k',
          config.outputPath
        );
      } else {
        // Standard video cut / compression up to effectiveTargetSec
        args.push(
          '-ss', '0',
          '-i', config.inputPath
        );

        // Only add duration limit if trimming is strictly required
        if (config.targetDuration && config.targetDuration < actualDuration) {
          args.push('-t', effectiveTargetSec.toString());
        }

        if (videoFilter) {
          args.push('-vf', videoFilter);
        }

        args.push(
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-threads', '0',
          '-c:a', 'aac',
          '-b:a', '192k',
          '-pix_fmt', 'yuv420p',
          config.outputPath
        );
      }

      console.log(`Executing Video Edit [Job ${jobId}]: ffmpeg`, args.join(' '));

      const proc = spawn('ffmpeg', args);

      // Parse real-time progress from stderr
      proc.stderr.on('data', (data) => {
        const text = data.toString();

        const timeMatch = text.match(/time=([0-9]{2}):([0-9]{2}):([0-9]{2})/);
        const speedMatch = text.match(/speed=\s*([0-9.]+)x/);
        const fpsMatch = text.match(/fps=\s*([0-9.]+)/);

        if (timeMatch) {
          const h = parseInt(timeMatch[1], 10);
          const m = parseInt(timeMatch[2], 10);
          const s = parseInt(timeMatch[3], 10);
          const currentSec = (h * 3600) + (m * 60) + s;
          const pct = Math.min(99, Math.round((currentSec / effectiveTargetSec) * 100));

          job.progress = pct;
          job.currentTime = `${timeMatch[1]}:${timeMatch[2]}:${timeMatch[3]}`;

          if (speedMatch) {
            job.speed = `${speedMatch[1]}x`;
            const speedVal = parseFloat(speedMatch[1]);
            if (speedVal > 0) {
              const remainingSec = Math.max(0, effectiveTargetSec - currentSec);
              const etaSec = Math.round(remainingSec / speedVal);
              const etaM = Math.floor(etaSec / 60);
              const etaS = etaSec % 60;
              job.eta = `${etaM}m ${etaS}s`;
            }
          }

          if (fpsMatch) {
            job.fps = Math.round(parseFloat(fpsMatch[1]));
          }
        }
      });

      proc.on('close', (code) => {
        if (code === 0) {
          job.status = 'COMPLETED';
          job.progress = 100;
          job.eta = 'Done!';
          job.downloadUrl = `/outputs/${config.outputFilename}`;
          console.log(`Job ${jobId} finished successfully! URL: ${job.downloadUrl}`);
        } else {
          // If failed with font error, retry without drawtext automatically!
          if (videoFilter) {
            console.warn(`Job ${jobId} exited with code ${code}. Retrying without text filter fallback...`);
            this.retryWithoutFilter(jobId, config, effectiveTargetSec);
          } else {
            job.status = 'FAILED';
            job.error = `FFmpeg exited with code ${code}`;
          }
        }
      });

      proc.on('error', (err) => {
        job.status = 'FAILED';
        job.error = err.message;
      });

    } catch (err) {
      job.status = 'FAILED';
      job.error = err.message;
    }
  }

  // Fallback retry without filter if any font/filter error occurs
  retryWithoutFilter(jobId, config, effectiveTargetSec) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    const retryArgs = [
      '-y',
      '-i', config.inputPath,
      '-c:v', 'copy',
      '-c:a', 'copy'
    ];

    if (config.targetDuration && config.targetDuration < effectiveTargetSec) {
      retryArgs.push('-t', effectiveTargetSec.toString());
    }
    retryArgs.push(config.outputPath);

    console.log(`Executing Fallback Stream Copy [Job ${jobId}]: ffmpeg`, retryArgs.join(' '));
    const proc = spawn('ffmpeg', retryArgs);

    proc.on('close', (code) => {
      if (code === 0) {
        job.status = 'COMPLETED';
        job.progress = 100;
        job.eta = 'Done (Stream Copy)!';
        job.downloadUrl = `/outputs/${config.outputFilename}`;
      } else {
        job.status = 'FAILED';
        job.error = `Render failed with code ${code}`;
      }
    });

    proc.on('error', (err) => {
      job.status = 'FAILED';
      job.error = err.message;
    });
  }

  getJobStatus(jobId) {
    return this.jobs.get(jobId) || null;
  }

  // 4. Standard Procedural Generator (for quick intro demos)
  async generateProceduralVideo({
    title = 'AI Automation Secrets',
    hookText = 'STOP SCROLLING! WATCH THIS NOW',
    subtitles = [],
    duration = 10,
    aspectRatio = '16:9',
    sfxType = 'boom',
    outputFilename = null
  }) {
    const isShorts = aspectRatio === '9:16';
    const width = isShorts ? 1080 : 1920;
    const height = isShorts ? 1920 : 1080;
    const filename = outputFilename || `rendered_video_${Date.now()}.mp4`;
    const outputPath = path.join(this.outputDir, filename);

    const sfxPath = path.join(this.outputDir, 'sfx', `${sfxType}.wav`);
    const hasSfx = fs.existsSync(sfxPath);
    const font = this.fontParam;

    const safeTitle = (title || 'VIRAL VIDEO').replace(/'/g, '').replace(/:/g, '\\:');
    const safeHook = (hookText || 'WATCH THIS FIRST!').replace(/'/g, '').replace(/:/g, '\\:');

    const hookFilter = `drawtext=${font}text='${safeHook}':fontcolor=yellow:fontsize=${isShorts ? 64 : 54}:borderw=4:bordercolor=black:x=(w-text_w)/2:y=(h-text_h)/3:enable='between(t,0,3.5)'`;
    const titleFilter = `drawtext=${font}text='${safeTitle}':fontcolor=white:fontsize=${isShorts ? 40 : 36}:borderw=2:bordercolor=black:x=(w-text_w)/2:y=${isShorts ? 120 : 60}`;

    const sampleSub = (subtitles.length > 0 && subtitles[0].text) 
      ? subtitles[0].text.replace(/'/g, '').replace(/:/g, '\\:') 
      : 'Automate your entire YouTube channel in seconds.';
    const subFilter = `drawtext=${font}text='${sampleSub}':fontcolor=white:fontsize=${isShorts ? 52 : 46}:box=1:boxcolor=black@0.6:boxborderw=10:x=(w-text_w)/2:y=(h-text_h)*0.75:enable='gte(t,3.5)'`;

    const videoFilters = `${hookFilter},${titleFilter},${subFilter}`;

    let args = [
      '-y',
      '-f', 'lavfi',
      '-i', `testsrc=size=${width}x${height}:rate=30:duration=${duration}`,
      '-f', 'lavfi',
      '-i', `sine=frequency=220:duration=${duration}`,
    ];

    if (hasSfx) {
      args.push('-i', sfxPath);
      args.push(
        '-filter_complex',
        `[0:v]eq=contrast=1.3:saturation=1.5,hue=s=0.5,${videoFilters}[v];[1:a]volume=0.15[a1];[2:a]volume=0.85[a2];[a1][a2]amix=inputs=2:duration=first[a]`,
        '-map', '[v]',
        '-map', '[a]'
      );
    } else {
      args.push(
        '-vf', videoFilters,
        '-c:a', 'aac',
        '-b:a', '128k'
      );
    }

    args.push(
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-pix_fmt', 'yuv420p',
      outputPath
    );

    await this.runCommand(args);
    return {
      filename,
      outputPath,
      downloadUrl: `/outputs/${filename}`,
      duration,
      aspectRatio,
      width,
      height
    };
  }

  // 5. Short Clip Quick Edit
  async processVideo({
    inputVideoPath,
    startTime = 0,
    endTime = null,
    hookText = '',
    subtitles = [],
    sfxType = null,
    aspectRatio = 'original',
    outputFilename = null
  }) {
    if (!fs.existsSync(inputVideoPath)) {
      throw new Error(`Input video not found: ${inputVideoPath}`);
    }

    const filename = outputFilename || `edited_${Date.now()}.mp4`;
    const outputPath = path.join(this.outputDir, filename);
    const font = this.fontParam;
    const args = ['-y'];

    if (startTime > 0) {
      args.push('-ss', startTime.toString());
    }

    args.push('-i', inputVideoPath);

    if (endTime && endTime > startTime) {
      args.push('-t', (endTime - startTime).toString());
    }

    const filters = [];
    if (aspectRatio === '9:16') {
      filters.push(`crop=ih*(9/16):ih`);
    } else if (aspectRatio === '16:9') {
      filters.push(`scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2`);
    }

    if (hookText && hookText.trim()) {
      const cleanHook = hookText.replace(/'/g, '').replace(/:/g, '\\:');
      filters.push(`drawtext=${font}text='${cleanHook}':fontcolor=yellow:fontsize=56:borderw=4:bordercolor=black:x=(w-text_w)/2:y=(h-text_h)/3:enable='between(t,0,3.5)'`);
    }

    if (subtitles && subtitles.length > 0) {
      subtitles.slice(0, 5).forEach((sub, idx) => {
        const cleanSub = sub.text.replace(/'/g, '').replace(/:/g, '\\:');
        const sTime = sub.startTime || (idx * 3);
        const eTime = sub.endTime || (sTime + 3);
        filters.push(`drawtext=${font}text='${cleanSub}':fontcolor=white:fontsize=44:box=1:boxcolor=black@0.6:boxborderw=8:x=(w-text_w)/2:y=(h-text_h)*0.8:enable='between(t,${sTime},${eTime})'`);
      });
    }

    if (filters.length > 0) {
      args.push('-vf', filters.join(','));
    }

    args.push(
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-pix_fmt', 'yuv420p',
      outputPath
    );

    await this.runCommand(args);

    return {
      filename,
      outputPath,
      downloadUrl: `/outputs/${filename}`,
      status: 'SUCCESS'
    };
  }

  runCommand(args) {
    return new Promise((resolve, reject) => {
      const proc = spawn('ffmpeg', args);
      let stderr = '';
      proc.stderr.on('data', (d) => { stderr += d.toString(); });
      proc.on('close', (code) => {
        if (code === 0) resolve({ success: true, logs: stderr });
        else reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-300)}`));
      });
      proc.on('error', (err) => reject(err));
    });
  }
}

module.exports = new FFmpegService();
