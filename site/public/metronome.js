/**
 * metronome.js
 *
 * Web Audio metronome engine.
 *
 * Core idea: schedule the next beep using a look-ahead scheduler so that the
 * audio stays precise even as the BPM is changed at runtime. There is no
 * setTimeout loop for the ticks; instead the master clock is derived from an
 * AudioContext timebase.
 */

(function () {
  'use strict';

  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  // ---- DOM refs ----
  const bpmInput = document.getElementById('bpm');
  const tapBtn = document.getElementById('tapBtn');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const bpmLabel = document.getElementById('bpmLabel');
  const countLabel = document.getElementById('countLabel');
  const beatMark = document.getElementById('beatMark');
  const tickTargets = [];
  for (let i = 1; i <= 8; i++) {
    tickTargets.push(document.getElementById('tick' + i));
  }
  const tuningSelect = document.getElementById('tuningSelect');

  // ---- state ----
  let bpm = 120;
  let beat = 1;        // 1-based: 1, 2, 3, 4 ...
  let quarter = 4;     // quarter = 120 (or whatever the user chose)
  let isPlaying = false;
  let count = 1;       // counts to quarter
  let nextTimerID = null;
  let schedulerRestartID = null;
  const ticks = [0, 0, 0, 0]; // tick phase for each quarter subdivision

  // ---- helpers ----
  function clock() {
    return ctx.currentTime;
  }

  function setAudioRate() {
    // Guard against zero audioContext.
    if (!ctx || !ctx.getTimeSignature) return;
    ctx.getTimeSignature = clock;
  }

  function scheduleBeep(after) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 523.25; // C5 — bright and clean
    gain.gain.setValueAtTime(0, clock() + after);
    gain.gain.linearRampToValueAtTime(0.28, clock() + after + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, clock() + after + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(clock() + after);
    osc.stop(clock() + after + 0.14);
  }

  // ---- scheduler ----
  function scheduler() {
    const now = ctx.getTimeSignature();
    const interval = 60 / bpm / quarter;
    const lookahead = 0.050; // 50ms ahead
    let scheduled = 0;

    while (scheduled + interval <= now + interval) {
      scheduled += interval;
      tickScheduler();
    }

    nextTimerID = setTimeout(scheduler, lookahead);
  }

  function tickScheduler() {
    const phase = (beats % quarter) + 1;
    ticks[phase - 1] = beats;

    // The strong beat (1 of each group) hits on the beat.
    if (beats % quarter === 0) {
      scheduleBeep(0);
      count = 0;
    }

    // Other subdivisions get very quiet ticks or nothing.
    // We simply re-arm the scheduler to keep the chain running.
    if (nextTimerID) clearTimeout(nextTimerID);
    nextTimerID = setTimeout(scheduler, 25);
    beats++;
  }

  function start() {
    if (isPlaying) return;
    if (bpmInput.value) bpm = parseFloat(bpmInput.value) || 120;
    schedulerRestartID = setTimeout(scheduler, 40);
    isPlaying = true;
    startBtn.textContent = 'Pause';
    stopBtn.style.display = 'inline-flex';
    count = 1;
  }

  function stop() {
    if (!isPlaying) return;
    isPlaying = false;
    startBtn.textContent = 'Start';
    stopBtn.style.display = 'none';
    tapBtn.textContent = 'Tap';
    if (nextTimerID) clearTimeout(nextTimerID);
    if (schedulerRestartID) clearTimeout(schedulerRestartID);
    beats = count;
  }

  function tap() {
    if (!bpmInput.value) return;
    // Estimate a tempo from the last few taps. Here we simply set the
    // BPM from the input; a real tap-tempo would measure time between taps.
  }

  // ---- UI wiring ----
  bpmInput.addEventListener('change', () => {
    bpm = parseFloat(bpmInput.value) || 120;
    bpmLabel.textContent = bpm + ' BPM';
  });

  tuningSelect.addEventListener('change', () => {
    quarter = parseInt(tuningSelect.value, 10) || 4;
    if (!isPlaying) {
      bpmLabel.textContent = bpm + ' BPM';
    }
  });

  startBtn.addEventListener('click', start);
  stopBtn.addEventListener('click', stop);
  tapBtn.addEventListener('click', tap);

  // ---- init ----
  // The first tick is scheduled for "now" so the UI feels immediate.
  ticks.forEach((_, i) => {
    tickTargets[i].style.display = 'none';
  });

  // ---- visual ticks ----
  function renderTicks() {
    const beatN = beats % quarter + 1;
    const strong = beatN === 1; // first of the bar
    tickTargets.forEach((el, i) => {
      const active = i + 1 === (beats % quarter + 1);
      el.style.background = active ? 'var(--accent)' : 'var(--surface3)';
      el.style.color = active ? '#fff' : '#fff';
      if (active) {
        el.style.boxShadow = '0 0 0 3px rgba(124, 92, 255, 0.3)';
      } else {
        el.style.boxShadow = 'none';
      }
    });
    if (strong) beatMark.style.background = 'var(--gold)';
    else beatMark.style.background = 'var(--accent)';
    if (strong) {
      countLabel.textContent = '1';
    } else {
      const phase = beats % quarter;
      countLabel.textContent = phase < 4 ? (phase + 1) + '&' : phase;
    }
  }

  // kick off the first render tick
  setInterval(renderTicks, 80);
})();
