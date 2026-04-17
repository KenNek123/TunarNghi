let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  return audioContext;
};

export const playShutterSound = async () => {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  if (context.state === 'suspended') {
    await context.resume();
  }

  const now = context.currentTime;
  const master = context.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.2, now + 0.012);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
  master.connect(context.destination);

  const click = context.createBufferSource();
  const clickBuffer = context.createBuffer(1, context.sampleRate * 0.06, context.sampleRate);
  const clickData = clickBuffer.getChannelData(0);
  for (let index = 0; index < clickData.length; index += 1) {
    const envelope = 1 - index / clickData.length;
    clickData[index] = (Math.random() * 2 - 1) * envelope * 0.65;
  }
  click.buffer = clickBuffer;

  const clickFilter = context.createBiquadFilter();
  clickFilter.type = 'highpass';
  clickFilter.frequency.setValueAtTime(1200, now);
  click.connect(clickFilter);
  clickFilter.connect(master);
  click.start(now);

  const shutterTone = context.createOscillator();
  shutterTone.type = 'triangle';
  shutterTone.frequency.setValueAtTime(920, now);
  shutterTone.frequency.exponentialRampToValueAtTime(420, now + 0.1);

  const toneGain = context.createGain();
  toneGain.gain.setValueAtTime(0.0001, now);
  toneGain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
  toneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

  shutterTone.connect(toneGain);
  toneGain.connect(master);
  shutterTone.start(now);
  shutterTone.stop(now + 0.2);
};
