// Rhythm studio fallback: beat driver used by public/metronome.js.
// Kept as a tiny standalone file so old browser builds still work.

/**
 * How to use in a host app:
 *  - Keep this file next to your HTML entry (for example public/metronome.js).
 *  - Reference it from your HTML as a classic script:
 *      <script src="/metronome.js"></script>
 *  - Next to the button:
 *      <button id="play-rhythm-btn">Start</button>
 *      <input id="bpm" type="range" min="30" max="240" value="120" />
 */
