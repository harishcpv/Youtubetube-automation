const express = require('express');
const router = express.Router();
const ragService = require('../services/rag_service');

// 1. Audit content (script, title, description, audio)
router.post('/audit', (req, res) => {
  try {
    const { script, title, description, audioTracks, duration } = req.body;
    const auditResult = ragService.auditContent({
      script,
      title,
      description,
      audioTracks,
      duration
    });
    res.json({ success: true, audit: auditResult });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Search YouTube policies
router.get('/search', (req, res) => {
  try {
    const query = req.query.q || '';
    const results = ragService.searchPolicies(query, 5);
    res.json({ success: true, count: results.length, policies: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Get all policies
router.get('/guidelines', (req, res) => {
  try {
    res.json({ success: true, policies: ragService.policies });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
