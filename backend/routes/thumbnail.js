const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const aiService = require('../services/ai_service');

const thumbDir = path.join(__dirname, '../../outputs/thumbnails');
if (!fs.existsSync(thumbDir)) {
  fs.mkdirSync(thumbDir, { recursive: true });
}

// 1. Get Thumbnail Concepts & AI Directives
router.post('/concepts', (req, res) => {
  try {
    const { topic, niche } = req.body;
    const concepts = aiService.generateThumbnailConcepts({ topic, niche });
    res.json({ success: true, concepts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Save thumbnail exported from frontend HTML5 Canvas
router.post('/save', (req, res) => {
  try {
    const { dataUrl, filename } = req.body;
    if (!dataUrl) {
      return res.status(400).json({ success: false, error: 'No image data provided' });
    }

    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ success: false, error: 'Invalid data URL' });
    }

    const buffer = Buffer.from(matches[2], 'base64');
    const name = filename || `thumbnail_${Date.now()}.png`;
    const filePath = path.join(thumbDir, name);

    fs.writeFileSync(filePath, buffer);

    res.json({
      success: true,
      filename: name,
      downloadUrl: `/outputs/thumbnails/${name}`,
      sizeBytes: buffer.length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
