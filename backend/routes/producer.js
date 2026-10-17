const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const autoProducer = require('../services/autoproducer_service');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `clip_${Date.now()}_${Math.round(Math.random() * 1e5)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// 1. Upload multiple clips at once (e.g. 4 raw video takes)
router.post('/upload-batch', upload.array('clips', 15), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No video files uploaded.' });
    }

    const files = req.files.map((f, idx) => ({
      id: idx + 1,
      filename: f.filename,
      filePath: f.path,
      originalName: f.originalname,
      sizeMB: Number((f.size / (1024 * 1024)).toFixed(2))
    }));

    res.json({ success: true, count: files.length, clips: files });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Start Full Multi-Clip Production Pipeline
router.post('/start', async (req, res) => {
  try {
    const {
      clipFilenames = [],
      localFilePaths = [],
      topic = 'My Complete Video',
      language = 'en',
      thumbnailHeadline = null,
      enableMusic = true,
      enableVoiceover = true,
      aspectRatio = '16:9'
    } = req.body;

    const allPaths = [];

    // Resolve uploaded filenames
    if (clipFilenames && clipFilenames.length > 0) {
      clipFilenames.forEach(fn => {
        const fullPath = path.join(uploadDir, fn);
        if (fs.existsSync(fullPath)) allPaths.push(fullPath);
      });
    }

    // Resolve local paths if provided
    if (localFilePaths && localFilePaths.length > 0) {
      localFilePaths.forEach(lp => {
        if (lp && fs.existsSync(lp)) allPaths.push(lp);
      });
    }

    if (allPaths.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid video clip paths found. Please upload at least 2 to 4 clips.'
      });
    }

    const job = await autoProducer.startBatchProduction({
      clipPaths: allPaths,
      topic,
      language,
      thumbnailHeadline,
      enableMusic,
      enableVoiceover,
      aspectRatio
    });

    res.json({ success: true, ...job });
  } catch (err) {
    console.error('Batch producer error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Poll Batch Job Status
router.get('/status/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const job = autoProducer.getJobStatus(jobId);

    if (!job) {
      return res.status(404).json({ success: false, error: 'Batch job not found' });
    }

    res.json({ success: true, job });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
