// Web Audio API Synthesizer for realistic Piano & Guitar sounds

class SoundEngine {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a single note by frequency or MIDI
  playNote(freq: number, duration: number = 1.2, type: 'piano' | 'guitar' = 'guitar') {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      if (type === 'guitar') {
        // Acoustic Guitar Synthesis using Karplus-Strong / Plucked String Harmonics
        const osc = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Fundamental + Sub/Overtones
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(freq * 2, now);

        // Filter for acoustic warm pluck body
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 4, now);
        filter.frequency.exponentialRampToValueAtTime(150, now + duration);

        const gain2 = this.ctx.createGain();
        gain2.gain.setValueAtTime(0.3, now);

        osc2.connect(gain2);
        gain2.connect(filter);

        // Envelope: Instant attack, logarithmic decay
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.7, now + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc2.start(now);
        osc.stop(now + duration);
        osc2.stop(now + duration);
      } else {
        // Piano Synthesis (Harmonic Overtones + Warm Decay)
        const harmonics = [1, 2, 3, 4];
        const weights = [0.6, 0.3, 0.15, 0.05];

        harmonics.forEach((harmonic, idx) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = idx === 0 ? 'sine' : 'triangle';
          osc.frequency.setValueAtTime(freq * harmonic, now);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(weights[idx], now + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + duration);
        });
      }
    } catch {
      // Audio fallback silent fail if browser blocks autoplay
    }
  }

  // Strum a chord (delay between string hits)
  strumChord(frequencies: number[], arpeggioDelay: number = 0.05, type: 'piano' | 'guitar' = 'guitar') {
    frequencies.forEach((freq, idx) => {
      setTimeout(() => {
        this.playNote(freq, 1.5, type);
      }, idx * arpeggioDelay * 1000);
    });
  }

  // Beep for metronome
  playClick(isHighBeat: boolean = false) {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isHighBeat ? 1000 : 700, now);

      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // ignore
    }
  }
}

export const soundEngine = new SoundEngine();
