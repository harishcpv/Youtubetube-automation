class AIService {
  constructor() {
    this.geminiKey = process.env.GEMINI_API_KEY || '';

    // Multi-Language Intro Hook Templates
    this.localizedHooks = {
      en: [
        { style: '🚨 Pattern Interrupt (Shock & Awe)', template: (t) => `Stop doing this immediately if you want ${t}!`, voice: 'Urgent, high-energy' },
        { style: '🔍 Curiosity Loop (Open Loop)', template: (t) => `There is a hidden secret about ${t} that nobody talks about...`, voice: 'Suspenseful' },
        { style: '⚡ Extreme Stakes (FOMO)', template: (t) => `If you don't know this in 2026, you will be left behind in ${t}!`, voice: 'Direct, serious' },
        { style: '❓ Counter-Intuitive Truth', template: (t) => `Everything you were told about ${t} is completely wrong. Here's why.`, voice: 'Casual authority' }
      ],
      hi: [
        { style: '🚨 Pattern Interrupt (Shock & Awe)', template: (t) => `अगर आप ${t} चाहते हैं, तो इसे तुरंत करना बंद करें!`, voice: 'Urgent & energetic Hindi' },
        { style: '🔍 Curiosity Loop (Open Loop)', template: (t) => `${t} के बारे में एक ऐसा गुप्त रहस्य है जिसके बारे में कोई बात नहीं करता...`, voice: 'Suspenseful Hindi' },
        { style: '⚡ Extreme Stakes (FOMO)', template: (t) => `अगर आप 2026 में यह नहीं जानते, तो आप ${t} में बहुत पीछे रह जाएंगे!`, voice: 'Direct Hindi' },
        { style: '❓ Counter-Intuitive Truth', template: (t) => `${t} के बारे में आपको जो कुछ भी बताया गया था वह गलत है। जानिए सच।`, voice: 'Authoritative Hindi' }
      ],
      te: [
        { style: '🚨 Pattern Interrupt (Shock & Awe)', template: (t) => `మీరు ${t} పొందాలనుకుంటే, దీన్ని వెంటనే ఆపండి!`, voice: 'Urgent Telugu' },
        { style: '🔍 Curiosity Loop (Open Loop)', template: (t) => `${t} గురించి ఎవరూ చెప్పని ఒక అద్భుతమైన రహస్యం ఉంది...`, voice: 'Intriguing Telugu' },
        { style: '⚡ Extreme Stakes (FOMO)', template: (t) => `2026 లో ఇది తెలియకపోతే, మీరు ${t} లో చాలా వెనుకబడిపోతారు!`, voice: 'Serious Telugu' },
        { style: '❓ Counter-Intuitive Truth', template: (t) => `${t} గురించి ఇప్పటివరకు మీకు తెలిసినదంతా తప్పు. అసలు నిజం ఇదిగో.`, voice: 'Authoritative Telugu' }
      ],
      ta: [
        { style: '🚨 Pattern Interrupt (Shock & Awe)', template: (t) => `நீங்கள் ${t} செய்ய விரும்பினால், இதை உடனடியாக நிறுத்துங்கள்!`, voice: 'Urgent Tamil' },
        { style: '🔍 Curiosity Loop (Open Loop)', template: (t) => `${t} பற்றி யாரும் சொல்லாத ஒரு ரகசியம் உள்ளது...`, voice: 'Curious Tamil' },
        { style: '⚡ Extreme Stakes (FOMO)', template: (t) => `2026 இல் இதை நீங்கள் தெரிந்து கொள்ளவில்லை என்றால் மிகவும் பின்தங்குவீர்கள்!`, voice: 'Direct Tamil' }
      ],
      es: [
        { style: '🚨 Pattern Interrupt (Shock & Awe)', template: (t) => `¡Deja de hacer esto inmediatamente si quieres dominar ${t}!`, voice: 'Urgent Spanish' },
        { style: '🔍 Curiosity Loop (Open Loop)', template: (t) => `Hay un secreto oculto sobre ${t} del que nadie habla...`, voice: 'Intriguing Spanish' },
        { style: '⚡ Extreme Stakes (FOMO)', template: (t) => `¡Si no sabes esto en 2026, te quedarás completamente atrás en ${t}!`, voice: 'Direct Spanish' }
      ],
      fr: [
        { style: '🚨 Pattern Interrupt (Shock & Awe)', template: (t) => `Arrêtez de faire cela immédiatement si vous voulez maîtriser ${t} !`, voice: 'Urgent French' },
        { style: '🔍 Curiosity Loop (Open Loop)', template: (t) => `Il y a un secret caché sur ${t} dont personne ne parle...`, voice: 'Suspenseful French' }
      ],
      de: [
        { style: '🚨 Pattern Interrupt (Shock & Awe)', template: (t) => `Hör sofort damit auf, wenn du ${t} meistern willst!`, voice: 'Direct German' },
        { style: '🔍 Curiosity Loop (Open Loop)', template: (t) => `Es gibt ein großes Geheimnis über ${t}, über das niemand spricht...`, voice: 'Mysterious German' }
      ],
      ja: [
        { style: '🚨 Pattern Interrupt (Shock & Awe)', template: (t) => `${t}で成功したいなら、今すぐこれをやめてください！`, voice: 'High-energy Japanese' },
        { style: '🔍 Curiosity Loop (Open Loop)', template: (t) => `誰も話さない${t}の隠された秘密があります...`, voice: 'Curious Japanese' }
      ]
    };
  }

  // 1. Generate Multi-Language Intro Hooks
  async generateHooks({ topic, audience = 'General', format = '16:9', language = 'en' }) {
    const cleanTopic = topic || 'YouTube AI Automation';
    const langCode = (language || 'en').toLowerCase().split('-')[0];
    const hookTemplates = this.localizedHooks[langCode] || this.localizedHooks['en'];

    const hooks = hookTemplates.map((h, idx) => ({
      style: h.style,
      text: h.template(cleanTopic),
      voiceDirection: h.voice,
      visualHook: 'Rapid dynamic zoom with glowing yellow subtitle banner and sound effect riser',
      sfxRecommended: idx % 2 === 0 ? 'boom' : 'whoosh',
      durationSec: 3.8,
      retentionScore: 92 + (idx * 2)
    }));

    return {
      topic: cleanTopic,
      format,
      language: langCode,
      hooks,
      recommendedHook: hooks[0]
    };
  }

  // 2. Generate Timed Subtitles (Supports All Language Scripts & Unicode)
  generateSubtitlesFromScript(script, wordsPerMinute = 145, language = 'en') {
    if (!script || !script.trim()) {
      script = "Welcome to the video! In this tutorial, we cover everything you need. Watch till the end!";
    }

    const langCode = (language || 'en').toLowerCase().split('-')[0];

    // For Asian languages without space separation (like Japanese or Chinese), split by punctuation or 8-12 char chunks
    let words = [];
    if (langCode === 'ja' || langCode === 'zh') {
      words = script.match(/.{1,10}/g) || [script];
    } else {
      words = script.replace(/\s+/g, ' ').trim().split(' ');
    }

    const chunks = [];
    let currentChunk = [];

    for (let i = 0; i < words.length; i++) {
      currentChunk.push(words[i]);
      if (currentChunk.length >= 4 || words[i].endsWith('.') || words[i].endsWith('!') || words[i].endsWith('?') || words[i].endsWith('।') || i === words.length - 1) {
        chunks.push(currentChunk.join(' '));
        currentChunk = [];
      }
    }

    const secPerWord = 60 / wordsPerMinute;
    let currentTime = 0;
    const subtitles = [];
    let srtString = '';

    chunks.forEach((chunk, index) => {
      const chunkWords = chunk.split(' ');
      const duration = Math.max(1.2, chunkWords.length * secPerWord);
      const startTime = currentTime;
      const endTime = currentTime + duration;
      currentTime = endTime;

      const formatSRTTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
        const millis = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
        return `${hrs}:${mins}:${secs},${millis}`;
      };

      const srtStartTime = formatSRTTime(startTime);
      const srtEndTime = formatSRTTime(endTime);

      subtitles.push({
        id: index + 1,
        startTime: Number(startTime.toFixed(2)),
        endTime: Number(endTime.toFixed(2)),
        duration: Number(duration.toFixed(2)),
        text: chunk,
        language: langCode
      });

      srtString += `${index + 1}\n${srtStartTime} --> ${srtEndTime}\n${chunk}\n\n`;
    });

    return {
      totalDuration: Number(currentTime.toFixed(2)),
      subtitlesCount: subtitles.length,
      language: langCode,
      subtitles,
      srtContent: srtString.trim()
    };
  }

  // 3. Generate Multi-Language Viral SEO Metadata
  async generateSEOPackage({ topic, niche = 'Tech', language = 'en' }) {
    const mainTopic = topic || 'YouTube AI Automation';
    const langCode = (language || 'en').toLowerCase().split('-')[0];

    // Localized Title Archetypes
    let titles = [];
    if (langCode === 'hi') {
      titles = [
        { title: `मैंने 30 दिनों तक ${mainTopic} किया (चौंकाने वाले नतीजे)`, ctrEstimate: '12.4%', style: 'कहानी / व्यक्तिगत प्रयोग' },
        { title: `${mainTopic} में 99% लोग यह भयानक गलती करते हैं!`, ctrEstimate: '11.1%', style: 'चेतावनी / FOMO' },
        { title: `10 मिनट में ${mainTopic} कैसे सीखें (2026 गाइड)`, ctrEstimate: '10.5%', style: 'ट्यूटोरियल / गाइड' }
      ];
    } else if (langCode === 'te') {
      titles = [
        { title: `నేను 30 రోజులు ${mainTopic} ప్రయత్నించాను (షాకింగ్ ఫలితాలు!)`, ctrEstimate: '12.8%', style: 'వ్యక్తిగత ప్రయోగం' },
        { title: `${mainTopic} లో 99% మంది చేసే పెద్ద తప్పు ఇదే!`, ctrEstimate: '11.5%', style: 'హెచ్చరిక / భయం' },
        { title: `10 నిమిషాల్లో ${mainTopic} ఎలా నేర్చుకోవాలి (2026 గైడ్)`, ctrEstimate: '10.8%', style: 'కంప్లీట్ ట్యుటోరియల్' }
      ];
    } else if (langCode === 'ta') {
      titles = [
        { title: `நான் 30 நாட்கள் ${mainTopic} செய்தேன் (அதிர்ச்சி முடிவுகள்!)`, ctrEstimate: '12.2%', style: 'தனிப்பட்ட அனுபவம்' },
        { title: `${mainTopic} பற்றி 99% பேர் செய்யும் மிகப்பெரிய தவறு!`, ctrEstimate: '11.0%', style: 'எச்சரிக்கை' }
      ];
    } else if (langCode === 'es') {
      titles = [
        { title: `Probé ${mainTopic} por 30 Días (Resultados IMPACTANTES)`, ctrEstimate: '11.9%', style: 'Experimento Personal' },
        { title: `El Gran Error que el 99% Comete con ${mainTopic}`, ctrEstimate: '10.8%', style: 'Advertencia' },
        { title: `Cómo Dominar ${mainTopic} en 10 Minutos (Guía 2026)`, ctrEstimate: '10.2%', style: 'Tutorial Rápido' }
      ];
    } else {
      // Default English
      titles = [
        { title: `I Tried ${mainTopic} for 30 Days (SHOCKING Results)`, ctrEstimate: '11.8%', style: 'Personal Experiment / Storytelling', charCount: 47 },
        { title: `The DEADLY Mistake Everyone Makes With ${mainTopic}`, ctrEstimate: '10.4%', style: 'Fear of Failure / Cautionary Hook', charCount: 54 },
        { title: `How to Master ${mainTopic} in 10 Minutes (2026 Guide)`, ctrEstimate: '9.9%', style: 'High Value / Rapid Tutorial', charCount: 51 },
        { title: `Why 99% Fail at ${mainTopic} (And How to Win)`, ctrEstimate: '10.9%', style: 'Contrarian / Elitism', charCount: 44 }
      ];
    }

    const description = `In this video, we break down everything you need to know about ${mainTopic}.

⏱️ CHAPTERS / TIMESTAMPS:
00:00 - Introduction & Hook
00:45 - Key Strategy Breakdown
02:15 - Live Execution & Tutorial
04:30 - Important Rules & Guidelines
05:45 - Final Summary & Takeaways

👍 Enjoyed this video? Drop a LIKE and SUBSCRIBE for weekly high-signal growth breakdowns!

#${mainTopic.replace(/[^a-zA-Z0-9]/g, '')} #YouTubeAutomation #CreatorGuide #2026`;

    const baseTags = [
      mainTopic,
      `${mainTopic} tutorial`,
      `${mainTopic} 2026`,
      'youtube automation',
      'content creator',
      'how to go viral',
      'video editing',
      'youtube growth'
    ];

    const hashtags = [
      `#${mainTopic.replace(/[^a-zA-Z0-9]/g, '')}`,
      '#YouTubeAutomation',
      '#ContentCreator',
      '#GrowthTips'
    ];

    return {
      topic: mainTopic,
      language: langCode,
      titles,
      selectedTitle: titles[0].title,
      description,
      tags: baseTags,
      tagsFormatted: baseTags.join(', '),
      hashtags
    };
  }

  // 4. Generate Viral Thumbnail Concepts & Directives
  generateThumbnailConcepts({ topic, niche = 'Tech' }) {
    const cleanTopic = topic || 'YouTube AI Automation';

    return [
      {
        id: 'mrbeast-style',
        name: '🔥 High-Energy Shock & Contrast (MrBeast Style)',
        background: 'Split color: Electric Neon Cyan on left, Fiery Orange/Red on right',
        textOverlay: 'IT FINALLY HAPPENED!',
        focalElement: 'Expressive wide-eyed face looking astonished, pointing at glowing screen',
        badges: ['🔴 LIVE ALERT', 'NEW 2026', '100% FREE']
      },
      {
        id: 'dark-minimalist',
        name: '🧠 Dark Curiosity & Mystery (Documentary Style)',
        background: 'Deep Charcoal / Slate with subtle glowing cyan grid and light leak',
        textOverlay: 'THE 1% SECRET',
        focalElement: 'Floating golden futuristic core with a 3D yellow question mark',
        badges: ['DO NOT IGNORE', '⚠️ WARNING']
      }
    ];
  }
}

module.exports = new AIService();
