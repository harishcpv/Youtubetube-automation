const express = require('express');
const router = express.Router();
const aiService = require('../services/ai_service');
const ragService = require('../services/rag_service');
const ffmpegService = require('../services/ffmpeg_service');
const ttsService = require('../services/tts_service');

router.post('/run', async (req, res) => {
  try {
    const { topic, format = '16:9', niche = 'Tech & AI', language = 'en' } = req.body;
    const cleanTopic = topic || '5 Mind-Blowing AI Tools in 2026';

    console.log(`Starting Auto-Pilot Pipeline for topic: "${cleanTopic}" [${format}] [Lang: ${language}]`);

    // 1. Hook & Retention Agent (Multi-Language)
    const hookData = await aiService.generateHooks({ topic: cleanTopic, format, language });
    const selectedHook = hookData.recommendedHook;

    // 2. Subtitles & Script Agent (Multi-Language)
    const sampleScript = `${selectedHook.text} Welcome back to the channel. Today we are uncovering the hidden tools changing everything. Make sure to subscribe for more actionable breakdowns!`;
    const subtitlesData = aiService.generateSubtitlesFromScript(sampleScript, 140, language);

    // 3. Multi-Language Voiceover Generation
    let voiceoverData = null;
    try {
      voiceoverData = await ttsService.synthesizeVoiceover({
        text: selectedHook.text,
        lang: language
      });
    } catch (ttsErr) {
      console.warn('TTS voiceover notice:', ttsErr.message);
    }

    // 4. Policy & Compliance RAG Agent
    const complianceAudit = ragService.auditContent({
      script: sampleScript,
      title: `I Tested ${cleanTopic} for 30 Days`,
      description: `Ultimate guide to ${cleanTopic}. Check the full breakdown!`,
      audioTracks: ['Royalty Free Synth Ambient'],
      duration: subtitlesData.totalDuration
    });

    // 5. SEO & Metadata Agent (Multi-Language)
    const seoPackage = await aiService.generateSEOPackage({ topic: cleanTopic, niche, language });

    // 6. Viral Thumbnail Agent
    const thumbnailConcepts = aiService.generateThumbnailConcepts({ topic: cleanTopic, niche });

    // 7. Video Rendering Agent (FFmpeg synthesis)
    let renderedVideo = null;
    try {
      renderedVideo = await ffmpegService.generateProceduralVideo({
        title: seoPackage.selectedTitle,
        hookText: selectedHook.text,
        subtitles: subtitlesData.subtitles,
        duration: Math.min(15, Math.max(8, subtitlesData.totalDuration)),
        aspectRatio: format === 'Shorts' ? '9:16' : '16:9',
        sfxType: selectedHook.sfxRecommended || 'boom'
      });
    } catch (ffmpegErr) {
      console.warn('FFmpeg render notice:', ffmpegErr.message);
      renderedVideo = {
        filename: 'preview_ready.mp4',
        downloadUrl: null,
        notice: 'Render skipped or available upon individual click'
      };
    }

    const packageResult = {
      topic: cleanTopic,
      language,
      generatedAt: new Date().toISOString(),
      hook: selectedHook,
      allHooks: hookData.hooks,
      subtitles: subtitlesData,
      voiceover: voiceoverData,
      compliance: complianceAudit,
      seo: seoPackage,
      thumbnail: {
        concepts: thumbnailConcepts,
        recommended: thumbnailConcepts[0]
      },
      video: renderedVideo
    };

    res.json({
      success: true,
      message: 'Complete Multi-Language YouTube Automation Package generated successfully!',
      package: packageResult
    });
  } catch (err) {
    console.error('Auto-pilot error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
