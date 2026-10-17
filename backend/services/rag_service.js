const fs = require('fs');
const path = require('path');

class PolicyRAGService {
  constructor() {
    this.policiesPath = path.join(__dirname, '../rag_data/youtube_guidelines.json');
    this.policies = [];
    this.loadPolicies();

    // High risk keywords & profanity mappings for instant acoustic/text audit
    this.profanityList = [
      'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'dick', 'pussy', 'nigger', 'faggot'
    ];
    this.violenceKeywords = [
      'kill', 'murder', 'blood', 'slaughter', 'beating', 'gunshot', 'stab', 'suicide', 'bomb', 'terrorist'
    ];
    this.copyrightKeywords = [
      'taylor swift', 'drake', 'marvel clip', 'netflix footage', 'nfl highlights', 'full movie', 'disney soundtrack', 'spotify track'
    ];
  }

  loadPolicies() {
    try {
      const data = fs.readFileSync(this.policiesPath, 'utf8');
      this.policies = JSON.parse(data);
    } catch (err) {
      console.error('Error loading YouTube policies:', err);
      this.policies = [];
    }
  }

  // Hybrid vector/keyword similarity calculation
  calculateSimilarity(query, text) {
    const qTokens = query.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(Boolean);
    const tTokens = text.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(Boolean);
    if (!qTokens.length || !tTokens.length) return 0;

    const tSet = new Set(tTokens);
    let matches = 0;
    for (const q of qTokens) {
      if (tSet.has(q)) matches++;
    }
    return matches / Math.sqrt(qTokens.length * tTokens.length);
  }

  // Search policies based on user question or topic
  searchPolicies(query, topK = 3) {
    const results = this.policies.map(policy => {
      const fullText = `${policy.title} ${policy.category} ${policy.summary} ${policy.keywords.join(' ')} ${policy.prohibited.join(' ')}`;
      const score = this.calculateSimilarity(query, fullText);
      return { policy, score };
    });

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK).map(r => r.policy);
  }

  // Deep Audit of video script, title, description, and audio choices
  auditContent({ script = '', title = '', description = '', audioTracks = [], duration = 60 }) {
    const findings = [];
    const fullText = `${title}\n${description}\n${script}`.toLowerCase();
    const lines = script.split(/\r?\n/).filter(l => l.trim().length > 0);

    let totalDeductions = 0;

    // 1. Audit Opening 10 Seconds (Profanity / Inappropriate Language)
    const introPortion = lines.slice(0, Math.min(3, lines.length)).join(' ').toLowerCase();
    for (const badWord of this.profanityList) {
      if (introPortion.includes(badWord)) {
        findings.push({
          timestamp: '00:00 - 00:08',
          category: 'Advertiser-Friendly Guidelines',
          ruleId: 'adsense-language-01',
          ruleTitle: 'Profanity in Opening 8 Seconds',
          severity: 'HIGH',
          monetizationRisk: 'YELLOW DOLLAR (AdSense Limited)',
          flaggedText: `Detected '${badWord}' in the introductory seconds.`,
          recommendation: `Bleep or substitute '${badWord}' with a mild term or silence it to preserve full green-dollar monetization.`,
          officialUrl: 'https://support.google.com/youtube/answer/6162278'
        });
        totalDeductions += 25;
        break;
      }
    }

    // 2. Audit Violence & Graphic Language
    for (const vWord of this.violenceKeywords) {
      if (fullText.includes(vWord)) {
        // Find corresponding line
        const matchedLine = lines.find(l => l.toLowerCase().includes(vWord)) || title;
        findings.push({
          timestamp: 'Mid-roll segment',
          category: 'Community Guidelines',
          ruleId: 'cg-violence-01',
          ruleTitle: 'Violent or Shocking Content',
          severity: 'CRITICAL',
          monetizationRisk: 'STRIKE & AGE-GATE RISK',
          flaggedText: matchedLine.slice(0, 100) + '...',
          recommendation: `Ensure this depiction has educational commentary. Blur explicit scenes and avoid glorifying physical harm.`,
          officialUrl: 'https://support.google.com/youtube/answer/2802008'
        });
        totalDeductions += 35;
        break;
      }
    }

    // 3. Audit Copyright & Audio Tracks
    const audioQuery = (audioTracks || []).join(' ').toLowerCase();
    for (const cTerm of this.copyrightKeywords) {
      if (audioQuery.includes(cTerm) || fullText.includes(cTerm)) {
        findings.push({
          timestamp: 'Audio Track / Segment',
          category: 'Copyright & Content ID',
          ruleId: 'copy-contentid-01',
          ruleTitle: 'Commercial Music / Content ID Risk',
          severity: 'HIGH',
          monetizationRisk: '100% REVENUE CLAIM TO OWNER',
          flaggedText: `Potential unlicensed commercial sound or visual snippet '${cTerm}'.`,
          recommendation: `Switch to YouTube Audio Library, royalty-free audio (e.g. Epidemic Sound, Uppbeat), or ensure a valid synchronization license.`,
          officialUrl: 'https://support.google.com/youtube/answer/2797370'
        });
        totalDeductions += 30;
        break;
      }
    }

    // 4. Audit Metadata (Sensationalism & Tag Stuffing)
    if (description.includes('#') && (description.match(/#/g) || []).length > 15) {
      findings.push({
        timestamp: 'Video Description',
        category: 'Spam & Deceptive Practices',
        ruleId: 'adsense-clickbait-02',
        ruleTitle: 'Excessive Hashtags (>15 tags)',
        severity: 'MEDIUM',
        monetizationRisk: 'TAG SUPPRESSION & ALGO DEMOTION',
        flaggedText: `Over 15 hashtags detected in description. YouTube ignores all hashtags if more than 60 are present and flags excessive spam.`,
        recommendation: `Keep hashtags between 3 and 5 relevant tags for optimal YouTube SEO reach.`,
        officialUrl: 'https://support.google.com/youtube/answer/6390658'
      });
      totalDeductions += 15;
    }

    // 5. Query RAG knowledge base for context-relevant policy insights
    const relevantPolicies = this.searchPolicies(`${title} ${script.slice(0, 200)}`, 2);

    // Calculate overall safety compliance score (0-100)
    const safetyScore = Math.max(10, 100 - totalDeductions);
    const monetizationStatus = safetyScore >= 85 ? 'GREEN_DOLLAR' : safetyScore >= 60 ? 'YELLOW_DOLLAR' : 'RED_RESTRICTED';

    return {
      safetyScore,
      monetizationStatus,
      statusLabel: monetizationStatus === 'GREEN_DOLLAR' ? 'Safe for Full Monetization' : monetizationStatus === 'YELLOW_DOLLAR' ? 'Limited Monetization (Review Flags)' : 'High Risk of Restriction/Strike',
      totalViolations: findings.length,
      findings,
      relevantPolicies,
      checkedAt: new Date().toISOString()
    };
  }
}

module.exports = new PolicyRAGService();
