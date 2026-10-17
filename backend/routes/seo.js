const express = require('express');
const router = express.Router();
const aiService = require('../services/ai_service');

// Generate complete SEO metadata package
router.post('/generate', async (req, res) => {
  try {
    const { topic, niche, keywords, language = 'en' } = req.body;
    const result = await aiService.generateSEOPackage({ topic, niche, keywords, language });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
