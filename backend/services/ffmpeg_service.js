const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class FFmpegService {
  constructor() {
    this.outputDir = path.join(__dirname, '../../outputs');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    // In-memory active long-form render jobs
    this.jobs = new Map();
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
              fps: eval(vStream?.r_frame_rate || '30'),
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

  // 2. Detect Dead-Air / Silences for Automatic Long-Form Trimming
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
          silences: silences.slice(0, 50) // sample first 50
        });
      });

      proc.on('error', (err) => reject(err));
    });
  }

  // 3. Start Asynchronous Long-Form Editing Job (More than 1 hour -> 1 hour video)
  async startLongFormJob({
    inputPath,
    targetDuration = 3600, // 3600 seconds = exactly 1 hour
    segments = [], // optional manual segment in/out cut list
    removeSilence = true,
    hookText = 'FULL 1-HOUR MASTERCLASS',
    fastMode = true // true = stream copy / concat demuxer where possible
  }) {
    const jobId = `job_${Date.now()}_${Math.round(Math.random() * 1e4)}`;
    const outputFilename = `edited_1hour_${jobId}.mp4`;
    const outputPath = path.join(this.outputDir, outputFilename);

    // Initial Job State
    const jobState = {
      jobId,
      status: 'INITIALIZING',
      progress: 0,
      currentTime: '00:00:00',
      targetDuration,
      targetDurationFormatted: '01:00:00 (1 Hour)',
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
      let args = ['-y'];

      // If segments were provided (e.g., cutting multiple chapters totaling 1 hour)
      if (config.segments && config.segments.length > 0) {
        // Build concat filter
        // Segment example: [{ start: 60, end: 1260 }, { start: 1500, end: 3900 }]
        const filterParts = [];
        let totalExpectedDuration = 0;

        config.segments.forEach((seg, i) => {
          const segDur = (seg.end - seg.start);
          totalExpectedDuration += segDur;
          filterParts.push(`[0:v]trim=start=${seg.start}:end=${seg.end},setpts=PTS-STARTPTS[v${i}];[0:a]atrim=start=${seg.start}:end=${seg.end},asetpts=PTS-STARTPTS[a${i}]`);
        });

        const concatInputs = config.segments.map((_, i) => `[v${i}][a${i}]`).join('');
        const filterComplex = `${filterParts.join(';')};${concatInputs}concat=n=${config.segments.length}:v=1:a=1[vconcat][a]`;

        // Add Hook text in first 5 seconds
        const cleanHook = (config.hookText || 'FULL 1-HOUR SPECIAL').replace(/'/g, '').replace(/:/g, '\\:');
        const finalVideoFilter = `${filterComplex};[vconcat]drawtext=text='${cleanHook}':fontcolor=yellow:fontsize=48:borderw=4:bordercolor=black:x=(w-text_w)/2:y=80:enable='between(t,0,5)'[v]`;

        args.push(
          '-i', config.inputPath,
          '-filter_complex', finalVideoFilter,
          '-map', '[v]',
          '-map', '[a]',
          '-c:v', 'libx264',
          '-preset', 'veryfast',
          '-threads', '0',
          '-c:a', 'aac',
          '-b:a', '192k',
          config.outputPath
        );
      } else {
        // No manual segments: Auto-trim 1+ hour raw footage directly to targetDuration (default 3600s / 1 Hour)
        const cleanHook = (config.hookText || '1-HOUR COMPLETE EPISODE').replace(/'/g, '').replace(/:/g, '\\:');
        const drawHook = `drawtext=text='${cleanHook}':fontcolor=yellow:fontsize=48:borderw=4:bordercolor=black:x=(w-text_w)/2:y=80:enable='between(t,0,5)'`;

        args.push(
          '-ss', '0',
          '-i', config.inputPath,
          '-t', config.targetDuration.toString(), // Hard cut at exactly 1 Hour (3600 seconds)
          '-vf', drawHook,
          '-c:v', 'libx264',
          '-preset', 'veryfast',
          '-threads', '0',
          '-c:a', 'aac',
          '-b:a', '192k',
          '-pix_fmt', 'yuv420p',
          config.outputPath
        );
      }

      console.log(`Starting 1-Hour Long-Form Render [Job ${jobId}]:`, args.join(' '));

      const proc = spawn('ffmpeg', args);

      // Parse real-time progress from stderr
      proc.stderr.on('data', (data) => {
        const text = data.toString();

        // Match time: time=00:14:22.50
        const timeMatch = text.match(/time=([0-9]{2}):([0-9]{2}):([0-9]{2})/);
        const speedMatch = text.match(/speed=\s*([0-9.]+)x/);
        const fpsMatch = text.match(/fps=\s*([0-9.]+)/);

        if (timeMatch) {
          const h = parseInt(timeMatch[1], 10);
          const m = parseInt(timeMatch[2], 10);
          const s = parseInt(timeMatch[3], 10);
          const currentSec = (h * 3600) + (m * 60) + s;
          const pct = Math.min(99, Math.round((currentSec / config.targetDuration) * 100));

          job.progress = pct;
          job.currentTime = `${timeMatch[1]}:${timeMatch[2]}:${timeMatch[3]}`;

          if (speedMatch) {
            job.speed = `${speedMatch[1]}x`;
            const speedVal = parseFloat(speedMatch[1]);
            if (speedVal > 0) {
              const remainingSec = Math.max(0, config.targetDuration - currentSec);
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
          console.log(`Job ${jobId} successfully completed! Output: ${config.outputPath}`);
        } else {
          job.status = 'FAILED';
          job.error = `FFmpeg exited with error code ${code}`;
          console.error(`Job ${jobId} failed with code ${code}`);
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

    const safeTitle = (title || 'VIRAL VIDEO').replace(/'/g, '').replace(/:/g, '\\:');
    const safeHook = (hookText || 'WATCH THIS FIRST!').replace(/'/g, '').replace(/:/g, '\\:');

    const hookFilter = `drawtext=text='${safeHook}':fontcolor=yellow:fontsize=${isShorts ? 64 : 54}:borderw=4:bordercolor=black:x=(w-text_w)/2:y=(h-text_h)/3:enable='between(t,0,3.5)'`;
    const titleFilter = `drawtext=text='${safeTitle}':fontcolor=white:fontsize=${isShorts ? 40 : 36}:borderw=2:bordercolor=black:x=(w-text_w)/2:y=${isShorts ? 120 : 60}`;

    const sampleSub = (subtitles.length > 0 && subtitles[0].text) 
      ? subtitles[0].text.replace(/'/g, '').replace(/:/g, '\\:') 
      : 'Automate your entire YouTube channel in seconds.';
    const subFilter = `drawtext=text='${sampleSub}':fontcolor=white:fontsize=${isShorts ? 52 : 46}:box=1:boxcolor=black@0.6:boxborderw=10:x=(w-text_w)/2:y=(h-text_h)*0.75:enable='gte(t,3.5)'`;

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
      filters.push(`drawtext=text='${cleanHook}':fontcolor=yellow:fontsize=56:borderw=4:bordercolor=black:x=(w-text_w)/2:y=(h-text_h)/3:enable='between(t,0,3.5)'`);
    }

    if (subtitles && subtitles.length > 0) {
      subtitles.slice(0, 5).forEach((sub, idx) => {
        const cleanSub = sub.text.replace(/'/g, '').replace(/:/g, '\\:');
        const sTime = sub.startTime || (idx * 3);
        const eTime = sub.endTime || (sTime + 3);
        filters.push(`drawtext=text='${cleanSub}':fontcolor=white:fontsize=44:box=1:boxcolor=black@0.6:boxborderw=8:x=(w-text_w)/2:y=(h-text_h)*0.8:enable='between(t,${sTime},${eTime})'`);
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
