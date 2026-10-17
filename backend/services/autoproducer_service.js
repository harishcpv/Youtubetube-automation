const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const aiService = require('./ai_service');
const ttsService = require('./tts_service');
const ragService = require('./rag_service');
const soundService = require('./sound_service');
const ffmpegService = require('./ffmpeg_service');

class AutoProducerService {
  constructor() {
    this.outputDir = path.join(__dirname, '../../outputs');
    this.thumbDir = path.join(this.outputDir, 'thumbnails');
    this.voiceDir = path.join(this.outputDir, 'voiceovers');
    this.sfxDir = path.join(this.outputDir, 'sfx');

    if (!fs.existsSync(this.outputDir)) fs.mkdirSync(this.outputDir, { recursive: true });
    if (!fs.existsSync(this.thumbDir)) fs.mkdirSync(this.thumbDir, { recursive: true });
    if (!fs.existsSync(this.voiceDir)) fs.mkdirSync(this.voiceDir, { recursive: true });

    this.jobs = new Map();
    this.fontParam = ffmpegService.fontParam;
  }

  // Master Multi-Clip Stitching & Production Pipeline
  async startBatchProduction({
    clipPaths = [],
    topic = 'My Viral Video',
    language = 'en',
    hookStyle = 'pattern-interrupt',
    thumbnailHeadline = null,
    enableMusic = true,
    enableVoiceover = true,
    aspectRatio = '16:9'
  }) {
    if (!clipPaths || clipPaths.length === 0) {
      throw new Error('Please provide at least 1 or more raw video clips to stitch.');
    }

    const jobId = `batch_${Date.now()}_${Math.round(Math.random() * 1e4)}`;
    const outputFilename = `final_stitched_${jobId}.mp4`;
    const outputPath = path.join(this.outputDir, outputFilename);

    const jobState = {
      jobId,
      status: 'PROCESSING',
      step: '1/6: Analyzing & Stitiching Raw Footages',
      progress: 10,
      clipsCount: clipPaths.length,
      topic,
      language,
      outputFilename,
      downloadUrl: null,
      thumbnailUrl: null,
      voiceoverUrl: null,
      seo: null,
      compliance: null,
      startTime: Date.now(),
      error: null
    };

    this.jobs.set(jobId, jobState);

    // Run execution in background
    this.executeProduction(jobId, {
      clipPaths,
      topic,
      language,
      hookStyle,
      thumbnailHeadline,
      enableMusic,
      enableVoiceover,
      aspectRatio,
      outputPath,
      outputFilename
    });

    return { jobId, status: 'PROCESSING', clipsCount: clipPaths.length };
  }

  async executeProduction(jobId, config) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      console.log(`Starting Batch Production [Job ${jobId}] with ${config.clipPaths.length} clips...`);

      // ==========================================
      // STEP 1: Probe Clip Metadata & Durations
      // ==========================================
      job.step = '1/6: Probing & Normalizing Clips...';
      job.progress = 15;

      const clipMetas = [];
      let totalDuration = 0;
      const chapters = [];

      for (let i = 0; i < config.clipPaths.length; i++) {
        const cPath = config.clipPaths[i];
        let meta = { durationSec: 10 };
        try {
          meta = await ffmpegService.getVideoMetadata(cPath);
        } catch (e) {
          console.warn(`Probe notice for clip ${i}:`, e.message);
        }
        clipMetas.push(meta);

        const startSec = Math.floor(totalDuration);
        const mins = Math.floor(startSec / 60).toString().padStart(2, '0');
        const secs = (startSec % 60).toString().padStart(2, '0');
        chapters.push(`${mins}:${secs} - Part ${i + 1}: Key Segment`);
        totalDuration += (meta.durationSec || 10);
      }

      // ==========================================
      // STEP 2: AI Hook & Multi-Language Script
      // ==========================================
      job.step = `2/6: Generating Hook & Script (${config.language.toUpperCase()})...`;
      job.progress = 30;

      const hookData = await aiService.generateHooks({
        topic: config.topic,
        language: config.language,
        format: config.aspectRatio
      });
      const selectedHook = hookData.recommendedHook;

      // Script tailored for the video
      const narrationScript = `${selectedHook.text} In this complete video, we reveal everything step by step. Notice how every single detail connects seamlessly together. Watch closely till the end to see the final result!`;

      // ==========================================
      // STEP 3: Multi-Language AI Voiceover (TTS)
      // ==========================================
      let voiceoverFile = null;
      let voiceoverDuration = 5;

      if (config.enableVoiceover) {
        job.step = `3/6: Synthesizing Spoken Voiceover (${config.language.toUpperCase()})...`;
        job.progress = 45;
        try {
          const ttsResult = await ttsService.synthesizeVoiceover({
            text: narrationScript,
            lang: config.language
          });
          voiceoverFile = ttsResult.outputPath;
          voiceoverDuration = ttsResult.estimatedDurationSec;
          job.voiceoverUrl = ttsResult.downloadUrl;
        } catch (ttsErr) {
          console.warn('Voiceover generation skipped/failed:', ttsErr.message);
        }
      }

      // ==========================================
      // STEP 4: Subtitles Generation (.SRT)
      // ==========================================
      job.step = '4/6: Generating Timed Subtitles...';
      job.progress = 55;

      const subtitlesData = aiService.generateSubtitlesFromScript(
        narrationScript,
        145,
        config.language
      );
      job.subtitles = subtitlesData;

      // ==========================================
      // STEP 5: Stitch Clips + Audio Ducking + Hook Overlay
      // ==========================================
      job.step = '5/6: Stitching Footages & Mixing Music with FFmpeg...';
      job.progress = 70;

      await this.stitchAndComposite({
        clipPaths: config.clipPaths,
        outputPath: config.outputPath,
        hookText: selectedHook.text,
        voiceoverFile,
        enableMusic: config.enableMusic,
        totalDuration: Math.min(3600, totalDuration)
      });

      job.downloadUrl = `/outputs/${config.outputFilename}`;

      // ==========================================
      // STEP 6: Thumbnail Generation with Text on It
      // ==========================================
      job.step = '6/6: Creating Viral Thumbnail with 3D Text...';
      job.progress = 85;

      const thumbFilename = `thumb_${jobId}.png`;
      const thumbPath = path.join(this.thumbDir, thumbFilename);
      const headlineText = config.thumbnailHeadline || selectedHook.text.slice(0, 32).toUpperCase();

      await this.generateThumbnailWithText({
        sourceVideoPath: config.outputPath,
        outputThumbPath: thumbPath,
        headline: headlineText
      });

      job.thumbnailUrl = `/outputs/thumbnails/${thumbFilename}`;

      // ==========================================
      // STEP 7: SEO & RAG Compliance
      // ==========================================
      const seoData = await aiService.generateSEOPackage({
        topic: config.topic,
        language: config.language
      });

      // Inject accurate clip chapter timestamps into description
      seoData.description = `${selectedHook.text}\n\nUltimate guide and showcase for ${config.topic}.\n\n⏱️ CHAPTERS / TIMESTAMPS:\n${chapters.join('\n')}\n\n👍 LIKE & SUBSCRIBE for more high quality breakdowns!`;
      job.seo = seoData;

      // RAG Compliance
      const compliance = ragService.auditContent({
        script: narrationScript,
        title: seoData.selectedTitle,
        description: seoData.description,
        audioTracks: ['Royalty Free Ambient BGM'],
        duration: totalDuration
      });
      job.compliance = compliance;

      // Done!
      job.status = 'COMPLETED';
      job.progress = 100;
      job.step = 'Ready to Download!';
      console.log(`Job ${jobId} finished successfully! Video: ${job.downloadUrl}, Thumb: ${job.thumbnailUrl}`);

    } catch (err) {
      console.error(`Batch Production [Job ${jobId}] error:`, err);
      job.status = 'FAILED';
      job.error = err.message;
    }
  }

  // FFmpeg multi-clip stitcher with scaling, hook, and multi-track audio mixing
  stitchAndComposite({ clipPaths, outputPath, hookText, voiceoverFile, enableMusic, totalDuration }) {
    return new Promise((resolve, reject) => {
      const args = ['-y'];

      // Add all video inputs
      clipPaths.forEach((cp) => {
        args.push('-i', cp);
      });

      let nextInputIdx = clipPaths.length;
      let voiceoverIdx = -1;
      let bgmIdx = -1;
      let boomIdx = -1;

      // Voiceover input
      if (voiceoverFile && fs.existsSync(voiceoverFile)) {
        args.push('-i', voiceoverFile);
        voiceoverIdx = nextInputIdx++;
      }

      // Background music input
      const bgmPath = path.join(this.sfxDir, 'bgm.wav');
      if (enableMusic && fs.existsSync(bgmPath)) {
        args.push('-stream_loop', '-1', '-i', bgmPath);
        bgmIdx = nextInputIdx++;
      }

      // Hook Boom SFX
      const boomPath = path.join(this.sfxDir, 'boom.wav');
      if (fs.existsSync(boomPath)) {
        args.push('-i', boomPath);
        boomIdx = nextInputIdx++;
      }

      // Build Filter Complex
      // Normalize each video clip to 1280x720 30fps
      const filterParts = [];
      const concatInputs = [];

      clipPaths.forEach((_, i) => {
        filterParts.push(`[${i}:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30[v${i}]`);
        concatInputs.push(`[v${i}][${i}:a]`);
      });

      // Concat all clips
      filterParts.push(`${concatInputs.join('')}concat=n=${clipPaths.length}:v=1:a=1[v_raw][a_raw]`);

      // Hook Text Filter (Safe with Windows font)
      const font = this.fontParam;
      const cleanHook = (hookText || 'WATCH THIS FIRST!').replace(/'/g, '').replace(/:/g, '\\:').trim();
      const hookFilter = `drawtext=${font}text='${cleanHook}':fontcolor=yellow:fontsize=48:borderw=4:bordercolor=black:x=(w-text_w)/2:y=80:enable='between(t,0,4)'`;

      filterParts.push(`[v_raw]${hookFilter}[v_final]`);

      // Audio Mixing: Original Audio (ducked) + Voiceover + BGM + SFX
      const audioMixInputs = ['[a_raw]volume=0.25[a_ducked]'];
      const amixTracks = ['[a_ducked]'];

      if (voiceoverIdx !== -1) {
        audioMixInputs.push(`[${voiceoverIdx}:a]volume=1.15[a_voice]`);
        amixTracks.push('[a_voice]');
      }

      if (bgmIdx !== -1) {
        audioMixInputs.push(`[${bgmIdx}:a]volume=0.12[a_bgm]`);
        amixTracks.push('[a_bgm]');
      }

      if (boomIdx !== -1) {
        audioMixInputs.push(`[${boomIdx}:a]volume=0.8[a_boom]`);
        amixTracks.push('[a_boom]');
      }

      filterParts.push(audioMixInputs.join(';'));
      filterParts.push(`${amixTracks.join('')}amix=inputs=${amixTracks.length}:duration=first[a_final]`);

      args.push(
        '-filter_complex', filterParts.join(';'),
        '-map', '[v_final]',
        '-map', '[a_final]',
        '-c:v', 'libx264',
        '-preset', 'veryfast',
        '-threads', '0',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-pix_fmt', 'yuv420p',
        outputPath
      );

      console.log('Running Multi-Clip FFmpeg Compositor:', args.join(' '));
      const proc = spawn('ffmpeg', args);
      let stderr = '';
      proc.stderr.on('data', (d) => { stderr += d.toString(); });

      proc.on('close', (code) => {
        if (code === 0) resolve();
        else {
          console.error('Multi-clip stitch error:', stderr.slice(-400));
          // If complex filter fails (e.g., if one clip had no audio stream), fallback to safe simple concat
          this.fallbackStitch(clipPaths, outputPath).then(resolve).catch(reject);
        }
      });
      proc.on('error', (err) => reject(err));
    });
  }

  // Safe fallback stitch
  fallbackStitch(clipPaths, outputPath) {
    return new Promise((resolve, reject) => {
      console.log('Running safe fallback stitch...');
      const listFile = path.join(this.outputDir, `concat_list_${Date.now()}.txt`);
      const fileLines = clipPaths.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n');
      fs.writeFileSync(listFile, fileLines);

      const args = [
        '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', listFile,
        '-c', 'copy',
        outputPath
      ];

      const proc = spawn('ffmpeg', args);
      proc.on('close', (code) => {
        try { fs.unlinkSync(listFile); } catch(e){}
        if (code === 0) resolve();
        else reject(new Error(`Fallback stitch exited with code ${code}`));
      });
      proc.on('error', (err) => reject(err));
    });
  }

  // Generate Viral Thumbnail with 3D Text Overlay on Keyframe
  generateThumbnailWithText({ sourceVideoPath, outputThumbPath, headline }) {
    return new Promise((resolve) => {
      const tempFrame = path.join(this.thumbDir, `temp_frame_${Date.now()}.jpg`);
      const font = this.fontParam;
      const cleanHeadline = (headline || 'MUST WATCH').replace(/'/g, '').replace(/:/g, '\\:').toUpperCase();

      // Step 1: Extract frame at 2 seconds
      const extractArgs = [
        '-y',
        '-ss', '00:00:02',
        '-i', sourceVideoPath,
        '-vframes', '1',
        '-q:v', '2',
        tempFrame
      ];

      const proc1 = spawn('ffmpeg', extractArgs);
      proc1.on('close', () => {
        if (!fs.existsSync(tempFrame)) {
          return resolve(null);
        }

        // Step 2: Draw 3D bold text on the image
        const drawFilter = `drawtext=${font}text='${cleanHeadline}':fontcolor=yellow:fontsize=76:borderw=8:bordercolor=black:x=(w-text_w)/2:y=180,drawtext=${font}text='NEW 2026':fontcolor=white:fontsize=36:box=1:boxcolor=red@0.9:boxborderw=12:x=(w-text_w)/2:y=100`;

        const renderArgs = [
          '-y',
          '-i', tempFrame,
          '-vf', drawFilter,
          outputThumbPath
        ];

        const proc2 = spawn('ffmpeg', renderArgs);
        proc2.on('close', () => {
          try { fs.unlinkSync(tempFrame); } catch(e){}
          resolve(outputThumbPath);
        });
        proc2.on('error', () => resolve(null));
      });
      proc1.on('error', () => resolve(null));
    });
  }

  getJobStatus(jobId) {
    return this.jobs.get(jobId) || null;
  }
}

module.exports = new AutoProducerService();
