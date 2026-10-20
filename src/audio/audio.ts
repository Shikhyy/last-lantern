type Sfx = 'click' | 'seal' | 'bell' | 'vote' | 'reveal';

interface Volumes {
  master: number;
  ambience: number;
  sfx: number;
  muted: boolean;
}

/**
 * A small, original WebAudio ambience: filtered air, a low drone, and a few
 * struck-brass cues. It is generated in the browser, uses no licensed audio,
 * and only starts after a real user gesture.
 */
class PalaceAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambienceGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private drone: OscillatorNode | null = null;
  private volumes: Volumes = { master: 0.42, ambience: 0.5, sfx: 0.4, muted: false };

  start(): void {
    if (this.context || typeof window === 'undefined') return;
    const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) return;
    const context = new Context();
    this.context = context;

    const master = context.createGain();
    master.gain.value = 0;
    master.connect(context.destination);
    this.master = master;

    const ambience = context.createGain();
    ambience.gain.value = 0;
    ambience.connect(master);
    this.ambienceGain = ambience;

    const sfx = context.createGain();
    sfx.gain.value = 0;
    sfx.connect(master);
    this.sfxGain = sfx;

    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 520;
    filter.Q.value = 0.4;
    filter.connect(ambience);
    this.filter = filter;

    const noise = context.createBufferSource();
    noise.buffer = this.noiseBuffer(context, 4);
    noise.loop = true;
    noise.connect(filter);
    noise.start();

    const drone = context.createOscillator();
    drone.type = 'sine';
    drone.frequency.value = 54;
    const droneGain = context.createGain();
    droneGain.gain.value = 0.18;
    drone.connect(droneGain);
    droneGain.connect(ambience);
    drone.start();
    this.drone = drone;

    this.applyVolumes(0.8);
  }

  setVolumes(volumes: Volumes): void {
    this.volumes = volumes;
    if (!this.context) return;
    this.applyVolumes(0.4);
  }

  setNight(night: boolean): void {
    if (!this.context || !this.filter || !this.drone) return;
    const now = this.context.currentTime;
    this.filter.frequency.setTargetAtTime(night ? 280 : 540, now, 1.8);
    this.drone.frequency.setTargetAtTime(night ? 45 : 54, now, 2.2);
  }

  sfx(kind: Sfx): void {
    if (!this.context || !this.sfxGain) return;
    const context = this.context;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const profiles: Record<Sfx, { frequency: number; type: OscillatorType; length: number; gain: number }> = {
      click: { frequency: 420, type: 'sine', length: 0.055, gain: 0.12 },
      seal: { frequency: 196, type: 'triangle', length: 0.4, gain: 0.15 },
      bell: { frequency: 146.8, type: 'sine', length: 2.4, gain: 0.16 },
      vote: { frequency: 261.6, type: 'triangle', length: 0.28, gain: 0.12 },
      reveal: { frequency: 329.6, type: 'sine', length: 0.9, gain: 0.14 },
    };
    const profile = profiles[kind];
    oscillator.type = profile.type;
    oscillator.frequency.value = profile.frequency;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(profile.gain, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + profile.length);
    oscillator.connect(gain);
    gain.connect(this.sfxGain);
    oscillator.start(now);
    oscillator.stop(now + profile.length + 0.05);
  }

  private applyVolumes(seconds: number): void {
    if (!this.context || !this.master || !this.ambienceGain || !this.sfxGain) return;
    const now = this.context.currentTime;
    const master = this.volumes.muted ? 0 : this.volumes.master;
    this.master.gain.setTargetAtTime(master, now, seconds);
    this.ambienceGain.gain.setTargetAtTime(0.16 * this.volumes.ambience, now, seconds);
    this.sfxGain.gain.setTargetAtTime(0.7 * this.volumes.sfx, now, seconds);
  }

  private noiseBuffer(context: AudioContext, seconds: number): AudioBuffer {
    const length = Math.floor(context.sampleRate * seconds);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let index = 0; index < length; index += 1) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.018 * white) / 1.018;
      data[index] = last * 3.2;
    }
    return buffer;
  }
}

export const audio = new PalaceAudio();
