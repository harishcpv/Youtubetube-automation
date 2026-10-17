const fs = require('fs');
const path = require('path');

class SoundService {
  constructor() {
    this.sfxDir = path.join(__dirname, '../../outputs/sfx');
    if (!fs.existsSync(this.sfxDir)) {
      fs.mkdirSync(this.sfxDir, { recursive: true });
    }
    this.initializeDefaultSFX();
  }

  // Create a clean PCM 16-bit Mono WAV buffer
  createWavBuffer(sampleRate, duration, sampleGenerator) {
    const numSamples = Math.floor(sampleRate * duration);
    const dataSize = numSamples * 2;
    const buffer = Buffer.alloc(44 + dataSize);

    // RIFF chunk
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);

    // fmt subchunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // subchunk1size
    buffer.writeUInt16LE(1, 20);  // audio format 1 = PCM
    buffer.writeUInt16LE(1, 22);  // mono
    buffer.writeUInt32LE(sampleRate, 24); // sample rate
    buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate (sampleRate * 1 channel * 2 bytes)
    buffer.writeUInt16LE(2, 32);  // block align
    buffer.writeUInt16LE(16, 34); // bits per sample

    // data subchunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const sample = Math.max(-1, Math.min(1, sampleGenerator(t, duration, i, numSamples)));
      const intSample = Math.floor(sample < 0 ? sample * 32768 : sample * 32767);
      buffer.writeInt16LE(intSample, 44 + i * 2);
    }

    return buffer;
  }

  initializeDefaultSFX() {
    const sampleRate = 44100;

    // 1. Whoosh SFX (Swishing noise sweep for transitions)
    const whooshPath = path.join(this.sfxDir, 'whoosh.wav');
    if (!fs.existsSync(whooshPath)) {
      const whooshWav = this.createWavBuffer(sampleRate, 0.45, (t, dur) => {
        const env = Math.sin((t / dur) * Math.PI);
        const noise = (Math.random() * 2 - 1);
        const freq = 300 + 1200 * Math.sin((t / dur) * Math.PI);
        const mod = Math.sin(2 * Math.PI * freq * t);
        return (noise * 0.4 + mod * 0.6) * env * 0.8;
      });
      fs.writeFileSync(whooshPath, whooshWav);
    }

    // 2. Ding / Notification Bell (for key takeaway or highlight)
    const dingPath = path.join(this.sfxDir, 'ding.wav');
    if (!fs.existsSync(dingPath)) {
      const dingWav = this.createWavBuffer(sampleRate, 0.7, (t) => {
        const env = Math.exp(-6 * t);
        const f1 = Math.sin(2 * Math.PI * 1568 * t); // G6
        const f2 = Math.sin(2 * Math.PI * 2349 * t) * 0.3; // D7
        const f3 = Math.sin(2 * Math.PI * 3136 * t) * 0.15; // G7
        return (f1 + f2 + f3) * env * 0.6;
      });
      fs.writeFileSync(dingPath, dingWav);
    }

    // 3. Pop / Click (for subtitle word pop or button hit)
    const popPath = path.join(this.sfxDir, 'pop.wav');
    if (!fs.existsSync(popPath)) {
      const popWav = this.createWavBuffer(sampleRate, 0.08, (t, dur) => {
        const env = Math.exp(-40 * t);
        const freq = 600 - 400 * (t / dur);
        return Math.sin(2 * Math.PI * freq * t) * env * 0.9;
      });
      fs.writeFileSync(popPath, popWav);
    }

    // 4. Cinematic Boom / Sub Drop (for dramatic hook impact)
    const boomPath = path.join(this.sfxDir, 'boom.wav');
    if (!fs.existsSync(boomPath)) {
      const boomWav = this.createWavBuffer(sampleRate, 1.2, (t, dur) => {
        const env = Math.exp(-3 * t);
        const freq = 120 * Math.exp(-2.5 * t); // sweeps from 120Hz down to 25Hz sub bass
        return Math.sin(2 * Math.PI * freq * t) * env * 0.95;
      });
      fs.writeFileSync(boomPath, boomWav);
    }

    // 5. Tension Riser (build up before hook reveal)
    const riserPath = path.join(this.sfxDir, 'riser.wav');
    if (!fs.existsSync(riserPath)) {
      const riserWav = this.createWavBuffer(sampleRate, 1.5, (t, dur) => {
        const norm = t / dur;
        const env = Math.pow(norm, 1.8);
        const freq = 150 + 800 * Math.pow(norm, 2);
        const noise = (Math.random() * 2 - 1) * 0.2 * norm;
        return (Math.sin(2 * Math.PI * freq * t) * 0.8 + noise) * env * 0.7;
      });
      fs.writeFileSync(riserPath, riserWav);
    }
  }

  getAvailableSFX() {
    return [
      { id: 'whoosh', name: '💨 Fast Transition Whoosh', file: 'whoosh.wav', duration: '0.45s', category: 'Transition' },
      { id: 'ding', name: '🔔 Insight Ding / Bell', file: 'ding.wav', duration: '0.70s', category: 'Highlight' },
      { id: 'pop', name: '💥 Dynamic Subtitle Pop', file: 'pop.wav', duration: '0.08s', category: 'Text/UI' },
      { id: 'boom', name: '💣 Cinematic Bass Drop / Boom', file: 'boom.wav', duration: '1.20s', category: 'Hook/Impact' },
      { id: 'riser', name: '📈 Tension Riser Sweep', file: 'riser.wav', duration: '1.50s', category: 'Build-Up' },
    ];
  }
}

module.exports = new SoundService();
