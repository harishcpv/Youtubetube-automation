const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const aiService = require('../services/ai_service');
const soundService = require('../services/sound_service');
const ffmpegService = require('../services/ffmpeg_service');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `upload_${Date.now()}_${Math.round(Math.random() * 1e5)}${ext}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// 1. Analyze video file (Duration, File Size, Resolution, Codec)
router.post('/analyze-file', async (req, res) => {
  try {
    const { uploadedFilename, localFilePath } = req.body;
    let targetPath = null;

    if (localFilePath && fs.existsSync(localFilePath)) {
      targetPath = localFilePath;
    } else if (uploadedFilename) {
      targetPath = path.join(uploadDir, uploadedFilename);
    }

    if (!targetPath || !fs.existsSync(targetPath)) {
      return res.status(400).json({ success: false, error: 'Video file not found. Check local path or upload.' });
    }

    const metadata = await ffmpegService.getVideoMetadata(targetPath);
    res.json({ success: true, metadata });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Detect Dead-Air / Silences in 1+ Hour Video
router.post('/detect-silence', async (req, res) => {
  try {
    const { uploadedFilename, localFilePath, noiseDb = -30, minDuration = 1.5 } = req.body;
    let targetPath = null;

    if (localFilePath && fs.existsSync(localFilePath)) {
      targetPath = localFilePath;
    } else if (uploadedFilename) {
      targetPath = path.join(uploadDir, uploadedFilename);
    }

    if (!targetPath || !fs.existsSync(targetPath)) {
      return res.status(400).json({ success: false, error: 'Target video file not found' });
    }

    const result = await ffmpegService.detectSilences(targetPath, noiseDb, minDuration);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Start Video Render Job (Any Duration Up to 1 Hour)
router.post('/longform/start', async (req, res) => {
  try {
    const {
      uploadedFilename,
      localFilePath,
      targetDuration = null,
      segments = [],
      removeSilence = false,
      hookText = '',
      fastMode = true
    } = req.body;

    let targetPath = null;
    if (localFilePath && fs.existsSync(localFilePath)) {
      targetPath = localFilePath;
    } else if (uploadedFilename) {
      targetPath = path.join(uploadDir, uploadedFilename);
    }

    if (!targetPath || !fs.existsSync(targetPath)) {
      return res.status(400).json({ success: false, error: 'Video source file not found' });
    }

    let parsedDuration = null;
    if (targetDuration && targetDuration !== 'natural' && Number(targetDuration) > 0) {
      parsedDuration = Number(targetDuration);
    }

    const job = await ffmpegService.startLongFormJob({
      inputPath: targetPath,
      targetDuration: parsedDuration,
      segments,
      removeSilence,
      hookText,
      fastMode
    });

    res.json({ success: true, ...job });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Poll Long-Form Render Job Status
router.get('/longform/status/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const job = ffmpegService.getJobStatus(jobId);

    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    res.json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Generate Hooks
router.post('/generate-hooks', async (req, res) => {
  try {
    const { topic, audience, format } = req.body;
    const result = await aiService.generateHooks({ topic, audience, format });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Generate Subtitles from script
router.post('/generate-subtitles', (req, res) => {
  try {
    const { script, wordsPerMinute } = req.body;
    const result = aiService.generateSubtitlesFromScript(script, wordsPerMinute);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Get SFX Library
router.get('/sfx-list', (req, res) => {
  try {
    const list = soundService.getAvailableSFX();
    res.json({ success: true, sfx: list });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Upload Raw Footage
router.post('/upload', upload.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No video file provided' });
    }
    res.json({
      success: true,
      filename: req.file.filename,
      filePath: req.file.path,
      size: req.file.size,
      originalName: req.file.originalname,
      url: `/uploads/${req.file.filename}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Short Render Video (Procedural or Clip)
router.post('/render', async (req, res) => {
  try {
    const {
      uploadedFilename,
      title,
      hookText,
      subtitles = [],
      duration = 10,
      aspectRatio = '16:9',
      sfxType = 'boom',
      startTime = 0,
      endTime = null
    } = req.body;

    let result;
    if (uploadedFilename) {
      const inputPath = path.join(uploadDir, uploadedFilename);
      result = await ffmpegService.processVideo({
        inputVideoPath: inputPath,
        startTime,
        endTime,
        hookText,
        subtitles,
        sfxType,
        aspectRatio
      });
    } else {
      result = await ffmpegService.generateProceduralVideo({
        title,
        hookText,
        subtitles,
        duration: Math.min(30, Math.max(5, duration)),
        aspectRatio,
        sfxType
      });
    }

    res.json({ success: true, video: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
