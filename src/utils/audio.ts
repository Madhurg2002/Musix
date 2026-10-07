// Web Audio API Synthesizer for realistic Instrument Sounds

export type InstrumentType = 'acoustic-guitar' | 'electric-guitar' | 'piano' | 'bass' | 'ukulele' | 'synth';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private activeInstrument: InstrumentType | 'auto' = 'auto';

  public setInstrument(inst: InstrumentType | 'auto') {
    this.activeInstrument = inst;
  }

  public getInstrument(): InstrumentType | 'auto' {
    return this.activeInstrument;
  }

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Generate white noise buffer for pick/pluck attack transients
  private createNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 0.03; // 30ms burst
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // Distortion curve generator for Electric Guitar
  private makeDistortionCurve(amount: number = 20) {
    const k = typeof amount === 'number' ? amount : 20;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  // Play a note with explicit or selected instrument type
  playNote(freq: number, duration: number = 1.6, overrideInstrument?: InstrumentType) {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      let targetInstrument: InstrumentType = 'acoustic-guitar';

      // If user manually selected a specific global instrument (not 'auto'), respect user's global choice!
      if (this.activeInstrument !== 'auto') {
        targetInstrument = this.activeInstrument;
      } else if (overrideInstrument) {
        targetInstrument = overrideInstrument;
      }

      switch (targetInstrument) {
        case 'acoustic-guitar': {
          // Acoustic Plucked Steel/Nylon Guitar Synthesis
          // 1. Pick Attack Transient Noise Burst
          const noiseBuffer = this.createNoiseBuffer();
          if (noiseBuffer) {
            const noiseSource = this.ctx.createBufferSource();
            noiseSource.buffer = noiseBuffer;

            const noiseFilter = this.ctx.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.setValueAtTime(Math.min(freq * 3, 3500), now);
            noiseFilter.Q.setValueAtTime(3.0, now);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.25, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

            noiseSource.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);

            noiseSource.start(now);
            noiseSource.stop(now + 0.03);
          }

          // 2. Harmonic Oscillators (Plucked String Tension Release + Decay)
          const harmonics = [1, 2, 3, 4, 6];
          const weights = [0.65, 0.35, 0.18, 0.08, 0.03];

          const pluckFilter = this.ctx.createBiquadFilter();
          pluckFilter.type = 'lowpass';
          pluckFilter.frequency.setValueAtTime(Math.min(freq * 6, 8000), now);
          pluckFilter.frequency.exponentialRampToValueAtTime(Math.min(freq * 1.8, 1200), now + 0.15);
          pluckFilter.frequency.exponentialRampToValueAtTime(Math.min(freq * 1.2, 400), now + duration);

          // Wood Body Acoustic Resonance Box (hollow body peak ~220Hz)
          const bodyFilter = this.ctx.createBiquadFilter();
          bodyFilter.type = 'peaking';
          bodyFilter.frequency.setValueAtTime(220, now);
          bodyFilter.Q.setValueAtTime(2.0, now);
          bodyFilter.gain.setValueAtTime(6.0, now);

          const mainGain = this.ctx.createGain();
          mainGain.gain.setValueAtTime(0.001, now);
          mainGain.gain.linearRampToValueAtTime(0.7, now + 0.008); // Sharp pluck attack
          mainGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

          harmonics.forEach((harmonic, idx) => {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const oscGain = this.ctx.createGain();

            // Plucked string initial tension pitch-drop (+12 cents down to nominal pitch in 15ms)
            osc.type = idx === 0 ? 'triangle' : 'sawtooth';
            osc.frequency.setValueAtTime(freq * harmonic * 1.008, now);
            osc.frequency.exponentialRampToValueAtTime(freq * harmonic, now + 0.015);

            oscGain.gain.setValueAtTime(weights[idx] ?? 0, now);

            osc.connect(oscGain);
            oscGain.connect(pluckFilter);

            osc.start(now);
            osc.stop(now + duration);
          });

          pluckFilter.connect(bodyFilter);
          bodyFilter.connect(mainGain);
          mainGain.connect(this.ctx.destination);
          break;
        }

        case 'electric-guitar': {
          // Electric Guitar (Warm tube overdrive + cabinet filter)
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const distortion = this.ctx.createWaveShaper();
          const cabFilter = this.ctx.createBiquadFilter();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now);

          distortion.curve = this.makeDistortionCurve(18);
          distortion.oversample = '4x';

          cabFilter.type = 'bandpass';
          cabFilter.frequency.setValueAtTime(1400, now);
          cabFilter.Q.setValueAtTime(1.4, now);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.45, now + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 1.2);

          osc.connect(distortion);
          distortion.connect(cabFilter);
          cabFilter.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + duration * 1.2);
          break;
        }

        case 'piano': {
          // Acoustic Grand Piano (Harmonic overtones + weighted decay)
          const harmonics = [1, 2, 3, 4, 5];
          const weights = [0.7, 0.35, 0.18, 0.08, 0.03];

          harmonics.forEach((harmonic, idx) => {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = idx === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq * harmonic, now);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(weights[idx] ?? 0, now + 0.008);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + duration * (1.5 - idx * 0.2));

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + duration * 1.5);
          });
          break;
        }

        case 'bass': {
          // Punchy Bass Guitar (Deep sub fundamental + punchy transient)
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const filter = this.ctx.createBiquadFilter();

          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(freq, now);

          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(freq, now);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(450, now);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.85, now + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 1.4);

          osc1.connect(filter);
          osc2.connect(filter);
          filter.connect(gain);
          gain.connect(this.ctx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + duration * 1.4);
          osc2.stop(now + duration * 1.4);
          break;
        }

        case 'ukulele': {
          // Bright Ukulele (Light nylon string in higher register)
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.5, now + 0.008);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.8);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now);
          osc.stop(now + duration * 0.8);
          break;
        }

        case 'synth': {
          // Warm Polyphonic Synth Pad
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc1.type = 'sawtooth';
          osc1.frequency.setValueAtTime(freq, now);

          osc2.type = 'square';
          osc2.frequency.setValueAtTime(freq * 1.005, now);

          gain.gain.setValueAtTime(0.001, now);
          gain.gain.linearRampToValueAtTime(0.4, now + 0.08);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 1.6);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(this.ctx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + duration * 1.6);
          osc2.stop(now + duration * 1.6);
          break;
        }
      }
    } catch {
      // Audio fallback silent fail
    }
  }

  // Strum a chord with arpeggio delay
  strumChord(frequencies: number[], arpeggioDelay: number = 0.05, overrideInstrument?: InstrumentType) {
    frequencies.forEach((freq, idx) => {
      setTimeout(() => {
        this.playNote(freq, 1.6, overrideInstrument);
      }, idx * arpeggioDelay * 1000);
    });
  }

  // Metronome click track sound
  playClick(isHighBeat: boolean = false) {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(isHighBeat ? 1200 : 800, now);

      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {
      // ignore
    }
  }
}

export const soundEngine = new SoundEngine();
