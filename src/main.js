// Tab Navigation
const tabs = document.querySelectorAll('.nav-btn');
const tabPanes = document.querySelectorAll('.tab-pane');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.remove('active'));
    tabPanes.forEach((p) => p.classList.remove('active'));

    tab.classList.add('active');
    const targetId = `tab-${tab.getAttribute('data-tab')}`;
    const targetPane = document.getElementById(targetId);
    if (targetPane) targetPane.classList.add('active');
  });
});

// Audio Context for Web Audio Synthesizer
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Frequency Player
const playToneBtn = document.getElementById('play-tone-btn');
const noteSelect = document.getElementById('note-select');

if (playToneBtn && noteSelect) {
  playToneBtn.addEventListener('click', () => {
    const freq = parseFloat(noteSelect.value);
    const ctx = getAudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.2);
  });
}

// Scale & Notes Generator
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const SCALE_PATTERNS = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  'pentatonic-major': [0, 2, 4, 7, 9],
  'pentatonic-minor': [0, 3, 5, 7, 10],
  blues: [0, 3, 5, 6, 7, 10],
};

const rootSelect = document.getElementById('root-select');
const scaleTypeSelect = document.getElementById('scale-type');
const scaleNotesContainer = document.getElementById('scale-notes-container');

function updateScaleDisplay() {
  if (!rootSelect || !scaleTypeSelect || !scaleNotesContainer) return;

  const rootIndex = NOTES.indexOf(rootSelect.value.replace(/ .*/, ''));
  const pattern = SCALE_PATTERNS[scaleTypeSelect.value] || SCALE_PATTERNS.major;

  const scaleNotes = pattern.map((interval) => NOTES[(rootIndex + interval) % 12]);

  scaleNotesContainer.innerHTML = scaleNotes
    .map((note) => `<div class="note-badge">${note}</div>`)
    .join('');
}

if (rootSelect && scaleTypeSelect) {
  rootSelect.addEventListener('change', updateScaleDisplay);
  scaleTypeSelect.addEventListener('change', updateScaleDisplay);
  updateScaleDisplay();
}

// Fretboard Visualizer
const fretboardEl = document.getElementById('fretboard');
const STRINGS = ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'];
const STRING_ROOTS = [4, 11, 7, 2, 9, 4]; // Note indices in NOTES array

function renderFretboard() {
  if (!fretboardEl) return;
  let html = '';
  const numFrets = 12;

  STRINGS.forEach((strName, strIdx) => {
    html += `<div class="fret-string"><div class="string-name">${strName}</div>`;
    const rootIdx = STRING_ROOTS[strIdx];

    for (let fret = 0; fret <= numFrets; fret++) {
      const noteName = NOTES[(rootIdx + fret) % 12];
      html += `<div class="fret-cell">${noteName}</div>`;
    }
    html += `</div>`;
  });

  fretboardEl.innerHTML = html;
}

renderFretboard();

// Metronome Studio
const rhythmPlayBtn = document.getElementById('rhythm-play-btn');
const bpmSlider = document.getElementById('bpm-slider');
const bpmValue = document.getElementById('bpm-value');
const beatBoxes = document.querySelectorAll('.beat-box');

let metronomeInterval = null;
let currentBeat = 0;
let isPlaying = false;

if (bpmSlider && bpmValue) {
  bpmSlider.addEventListener('input', (e) => {
    bpmValue.textContent = e.target.value;
    if (isPlaying) {
      restartMetronome();
    }
  });
}

function tickMetronome() {
  beatBoxes.forEach((box, i) => {
    box.classList.toggle('active', i === currentBeat);
  });

  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(currentBeat === 0 ? 880 : 440, ctx.currentTime);

  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.08);

  currentBeat = (currentBeat + 1) % 4;
}

function startMetronome() {
  currentBeat = 0;
  isPlaying = true;
  rhythmPlayBtn.textContent = '⏹ Stop Metronome';
  rhythmPlayBtn.classList.remove('btn-accent');
  rhythmPlayBtn.classList.add('btn-primary');

  const bpm = parseInt(bpmSlider.value, 10);
  const intervalMs = (60 / bpm) * 1000;

  tickMetronome();
  metronomeInterval = setInterval(tickMetronome, intervalMs);
}

function stopMetronome() {
  isPlaying = false;
  rhythmPlayBtn.textContent = '▶ Start Metronome';
  rhythmPlayBtn.classList.remove('btn-primary');
  rhythmPlayBtn.classList.add('btn-accent');

  if (metronomeInterval) {
    clearInterval(metronomeInterval);
    metronomeInterval = null;
  }
  beatBoxes.forEach((box, i) => box.classList.toggle('active', i === 0));
}

function restartMetronome() {
  if (metronomeInterval) clearInterval(metronomeInterval);
  const bpm = parseInt(bpmSlider.value, 10);
  const intervalMs = (60 / bpm) * 1000;
  metronomeInterval = setInterval(tickMetronome, intervalMs);
}

if (rhythmPlayBtn) {
  rhythmPlayBtn.addEventListener('click', () => {
    if (isPlaying) {
      stopMetronome();
    } else {
      startMetronome();
    }
  });
}
