const fs = require('fs');
const path = require('path');
const https = require('https');

class TTSService {
  constructor() {
    this.voiceDir = path.join(__dirname, '../../outputs/voiceovers');
    if (!fs.existsSync(this.voiceDir)) {
      fs.mkdirSync(this.voiceDir, { recursive: true });
    }
  }

  // Supported World Languages
  getAvailableLanguages() {
    return [
      { code: 'en', name: 'English (US/UK)', native: 'English', flag: '🇺🇸' },
      { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
      { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
      { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
      { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
      { code: 'ml', name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
      { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
      { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
      { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
      { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
      { code: 'ko', name: 'Korean', native: '한국어', flag: '🇰🇷' },
      { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇧🇷' },
      { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
      { code: 'it', name: 'Italian', native: 'Italiano', flag: '🇮🇹' },
      { code: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺' },
      { code: 'zh-CN', name: 'Chinese (Simplified)', native: '简体中文', flag: '🇨🇳' },
      { code: 'tr', name: 'Turkish', native: 'Türkçe', flag: '🇹🇷' },
      { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia', flag: '🇮🇩' },
      { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', flag: '🇻🇳' },
    ];
  }

  // Fetch audio chunk from public TTS endpoint
  fetchAudioChunk(text, lang) {
    return new Promise((resolve, reject) => {
      const encodedText = encodeURIComponent(text);
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${lang}&client=tw-ob`;

      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      };

      https.get(url, options, (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`TTS request failed with status: ${res.statusCode}`));
        }

        const data = [];
        res.on('data', (chunk) => data.push(chunk));
        res.on('end', () => resolve(Buffer.concat(data)));
        res.on('error', (err) => reject(err));
      }).on('error', (err) => reject(err));
    });
  }

  // Split text into natural sentence/phrase chunks (Google TTS limit is ~180 chars per chunk)
  splitTextIntoChunks(text, maxLen = 140) {
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    const chunks = [];

    for (let sentence of sentences) {
      sentence = sentence.trim();
      if (!sentence) continue;

      if (sentence.length <= maxLen) {
        chunks.push(sentence);
      } else {
        // Split long sentence by commas or words
        const words = sentence.split(' ');
        let current = '';
        for (let word of words) {
          if ((current + ' ' + word).trim().length <= maxLen) {
            current = (current + ' ' + word).trim();
          } else {
            if (current) chunks.push(current);
            current = word;
          }
        }
        if (current) chunks.push(current);
      }
    }

    return chunks.length > 0 ? chunks : [text.slice(0, maxLen)];
  }

  // Synthesize complete voiceover audio file
  async synthesizeVoiceover({ text, lang = 'en' }) {
    if (!text || !text.trim()) {
      throw new Error('No text provided for voiceover');
    }

    const cleanLang = (lang || 'en').toLowerCase().split('-')[0];
    const chunks = this.splitTextIntoChunks(text, 150);
    const audioBuffers = [];

    for (const chunk of chunks) {
      try {
        const buf = await this.fetchAudioChunk(chunk, cleanLang);
        audioBuffers.push(buf);
      } catch (err) {
        console.warn(`TTS chunk error for '${chunk}':`, err.message);
      }
    }

    if (audioBuffers.length === 0) {
      throw new Error('Failed to generate voiceover audio chunks');
    }

    const finalBuffer = Buffer.concat(audioBuffers);
    const filename = `voiceover_${cleanLang}_${Date.now()}.mp3`;
    const outputPath = path.join(this.voiceDir, filename);

    fs.writeFileSync(outputPath, finalBuffer);

    // Approximate duration: ~150 words per minute
    const wordCount = text.trim().split(/\s+/).length;
    const estimatedDurationSec = Math.max(2, Number(((wordCount / 145) * 60).toFixed(1)));

    return {
      filename,
      outputPath,
      downloadUrl: `/outputs/voiceovers/${filename}`,
      sizeBytes: finalBuffer.length,
      estimatedDurationSec,
      language: cleanLang,
      chunksCount: chunks.length
    };
  }
}

module.exports = new TTSService();
