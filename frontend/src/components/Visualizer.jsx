import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import './Visualizer.css';

/* ---------- read-only code snippets ---------- */
const defaultCode = {
  'Bubble Sort': `function bubbleSort(arr) {
  let a = [...arr];
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a.length - i - 1; j++) {
      if (a[j] > a[j + 1]) [a[j], a[j + 1]] = [a[j + 1], a[j]];
    }
  }
  return a;
}`,
  'Selection Sort': `function selectionSort(arr) {
  let a = [...arr];
  for (let i = 0; i < a.length - 1; i++) {
    let m = i;
    for (let j = i + 1; j < a.length; j++) if (a[j] < a[m]) m = j;
    if (m !== i) [a[i], a[m]] = [a[m], a[i]];
  }
  return a;
}`,
  'Insertion Sort': `function insertionSort(arr) {
  let a = [...arr];
  for (let i = 1; i < a.length; i++) {
    let key = a[i], j = i - 1;
    while (j >= 0 && a[j] > key) { a[j + 1] = a[j]; j--; }
    a[j + 1] = key;
  }
  return a;
}`,
  'Merge Sort': `function mergeSort(arr) {
  if (arr.length < 2) return arr;
  const m = Math.floor(arr.length / 2);
  return merge(mergeSort(arr.slice(0, m)), mergeSort(arr.slice(m)));
}
function merge(l, r) {
  const out = [];
  while (l.length && r.length) out.push(l[0] <= r[0] ? l.shift() : r.shift());
  return out.concat(l, r);
}`,
  'Quick Sort': `function quickSort(arr) {
  if (arr.length < 2) return arr;
  const pivot = arr[arr.length - 1];
  const left = arr.filter(x => x < pivot);
  const mid  = arr.filter(x => x === pivot);
  const right= arr.filter(x => x > pivot);
  return quickSort(left).concat(mid, quickSort(right));
}`
};

/* ---------- colour palette ---------- */
const colour = {
  'Bubble Sort': '#4e8ef7',
  'Selection Sort': '#ff4fa2',
  'Insertion Sort': '#ff9c3f',
  'Merge Sort': '#34c77b',
  'Quick Sort': '#ffd83f'
};

/* ---------- state generators ---------- */
const gen = {
  'Bubble Sort': a => { const s = [], b = [...a]; for (let i = 0; i < b.length; i++)for (let j = 0; j < b.length - i - 1; j++) { if (b[j] > b[j + 1]) { [b[j], b[j + 1]] = [b[j + 1], b[j]]; s.push([...b]); } } return s; },
  'Selection Sort': a => { const s = [], b = [...a]; for (let i = 0; i < b.length - 1; i++) { let m = i; for (let j = i + 1; j < b.length; j++)if (b[j] < b[m]) m = j; if (m !== i) { [b[i], b[m]] = [b[m], b[i]]; s.push([...b]); } } return s; },
  'Insertion Sort': a => { const s = [], b = [...a]; for (let i = 1; i < b.length; i++) { let k = b[i], j = i - 1; while (j >= 0 && b[j] > k) { b[j + 1] = b[j]; j--; s.push([...b]); } b[j + 1] = k; s.push([...b]); } return s; },
  'Merge Sort': a => { const s = []; const rec = x => { if (x.length < 2) return x; const m = Math.floor(x.length / 2); const l = rec(x.slice(0, m)), r = rec(x.slice(m)); const out = []; while (l.length && r.length) { out.push(l[0] <= r[0] ? l.shift() : r.shift()); s.push(out.concat(l, r)); } return out.concat(l, r); }; rec([...a]); return s; },
  'Quick Sort': a => {
    const s = [], b = [...a];
    const swap = (i, j) => { [b[i], b[j]] = [b[j], b[i]]; s.push([...b]); };
    const qs = (l, r) => { if (l < r) { let p = b[r], i = l; for (let j = l; j < r; j++) { if (b[j] < p) { swap(i, j); i++; } } swap(i, r); qs(l, i - 1); qs(i + 1, r); } };
    qs(0, b.length - 1); return s;
  }
};

/* ---------- Audio tick ---------- */
const ctx = new (window.AudioContext || window.webkitAudioContext)();
const beep = () => {
  try {
    if (ctx.state === 'suspended') ctx.resume();
    const o = ctx.createOscillator(); o.frequency.value = 880; o.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + .04);
  } catch { }
};

/* ---------- SVG icon helper ---------- */
const I = p => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d={p.d} /></svg>;
const icon = {
  play: 'M5 3v18l15-9-15-9z', pause: 'M6 4h4v16H6zm8 0h4v16h-4z', stop: 'M6 6h12v12H6z',
  reset: 'M12 5v4l3-3-3-3v4a7 7 0 1 0 7 7h-2a5 5 0 1 1-5-5z',
  stepF: 'M5 4l8 8-8 8V4zm9 0h2v16h-2z', stepB: 'M19 4l-8 8 8 8V4zm-9 0h-2v16h2z', code: 'M9.4 16.6l-4-4 4-4 1.4 1.4L8.8 12l2 2-1.4 1.4zm5.2 0L13.2 14l2-2-2-2 1.4-1.4 4 4-4 4z'
};

/* ---------- main component ---------- */
export default function Visualizer() {
  const [rows, setRows] = useState(() => Object.keys(defaultCode).map((alg, i) => ({
    id: i + 1, alg, code: defaultCode[alg], steps: [], idx: 0, arr: Array.from({ length: 100 }, () => Math.random() * 90 + 10 | 0),
    running: false, paused: false, show: false, start: 0, elapsed: 0
  })));
  const rowsRef = useRef(rows); rowsRef.current = rows;

  const [delay, setDelay] = useState(1);
  const [barCount, setBarCount] = useState(100);

  /* util */
  const mut = (id, f) => setRows(rs => rs.map(r => r.id === id ? f(r) : r));
  const startTimer = id => mut(id, r => ({ ...r, start: performance.now(), elapsed: 0 }));
  const stopTimer = id => mut(id, r => ({ ...r, elapsed: performance.now() - r.start, start: 0 }));
  const fmt = t => `${(t / 1000).toFixed(3)}s`;

  /* animation */
  const advance = id => {
    const r = rowsRef.current.find(x => x.id === id);
    if (!r || !r.running || r.paused) return;
    if (r.idx < r.steps.length) {
      beep();
      mut(id, row => ({ ...row, arr: row.steps[row.idx], idx: row.idx + 1 }));
      setTimeout(() => advance(id), delay);
    } else {
      stopTimer(id);
      mut(id, row => ({ ...row, running: false }));
    }
  };

  const run = id => {
    mut(id, r => {
      const steps = gen[r.alg](r.arr);
      return { ...r, steps, idx: 0, running: true, paused: false };
    });
    startTimer(id);
    setTimeout(() => advance(id), 0);
  };
  const pause = id => mut(id, r => ({ ...r, paused: true }));
  const resume = id => { mut(id, r => ({ ...r, paused: false })); setTimeout(() => advance(id), 0) };
  const stop = id => { mut(id, r => ({ ...r, running: false, paused: false, idx: 0 })); stopTimer(id); };
  const reset = id => mut(id, r => ({
    ...r, running: false, paused: false, idx: 0,
    arr: Array.from({ length: barCount }, () => Math.random() * 90 + 10 | 0),
    steps: [], elapsed: 0
  }));
  const stepF = id => mut(id, r => {
    if (r.paused && r.idx < r.steps.length) { beep(); return { ...r, arr: r.steps[r.idx], idx: r.idx + 1 }; } return r;
  });
  const stepB = id => mut(id, r => {
    if (r.paused && r.idx > 1) { beep(); return { ...r, idx: r.idx - 1, arr: r.steps[r.idx - 2] }; } return r;
  });

  const all = a => rowsRef.current.forEach(r => {
    if (a === 'run') run(r.id);
    if (a === 'pause') pause(r.id);
    if (a === 'resume') resume(r.id);
    if (a === 'stop') stop(r.id);
    if (a === 'reset') reset(r.id);
  });

  /* slider change -> shrink arrays */
  useEffect(() => { setRows(rs => rs.map(r => ({ ...r, arr: r.arr.slice(0, barCount) }))); }, [barCount]);

  return (
    <div className="wrap">
      <header>
        <h1>Sort Wars</h1>
        <button onClick={() => all('run')} title="Run All"><I d={icon.play} /></button>
        <button onClick={() => all('pause')} title="Pause All"><I d={icon.pause} /></button>
        <button onClick={() => all('resume')} title="Resume All"><I d={icon.play} /></button>
        <button onClick={() => all('stop')} title="Stop All"><I d={icon.stop} /></button>
        <button onClick={() => all('reset')} title="Reset All"><I d={icon.reset} /></button>
        <label className="slider">Bars {barCount}
          <input type="range" min="0" max="100" value={barCount}
            onChange={e => setBarCount(+e.target.value)} />
        </label>
        <label className="slider">Delay {delay} ms
          <input type="range" min="0" max="1000" value={delay}
            onChange={e => setDelay(+e.target.value)} />
        </label>
      </header>

      {rows.map(r => (
        <section key={r.id} className="card">
          <div className="ctrl">
            <select value={r.alg} disabled={r.running || r.paused}
              onChange={e => mut(r.id, row => ({ ...row, alg: e.target.value, code: defaultCode[e.target.value] }))}>
              {Object.keys(defaultCode).map(k => <option key={k}>{k}</option>)}
            </select>

            {!r.running && <button onClick={() => run(r.id)}><I d={icon.play} /></button>}
            {r.running && !r.paused && <button onClick={() => pause(r.id)}><I d={icon.pause} /></button>}
            {r.running && r.paused && <button onClick={() => resume(r.id)}><I d={icon.play} /></button>}
            <button disabled={!r.running} onClick={() => stop(r.id)}><I d={icon.stop} /></button>
            <button disabled={r.running} onClick={() => reset(r.id)}><I d={icon.reset} /></button>
            <button disabled={!r.paused} onClick={() => stepB(r.id)}><I d={icon.stepB} /></button>
            <button disabled={!r.paused} onClick={() => stepF(r.id)}><I d={icon.stepF} /></button>
            <button onClick={() => mut(r.id, row => ({ ...row, show: !row.show }))}><I d={icon.code} /></button>
          </div>

          <div className="info">
            Steps: {r.steps.length} &nbsp;|&nbsp;
            {r.elapsed ? `Time: ${fmt(r.elapsed)}` : r.running ? 'Running…' : ''}
          </div>

          <div className="bars">
            {r.arr.map((h, i) =>
              <div key={i} className="bar" style={{
                height: h,
                background: colour[r.alg],
                transition: `height ${delay - 1}ms ease`
              }} />)}
          </div>

          {r.show && <Editor height="220px" defaultLanguage="javascript"
            value={r.code} options={{ readOnly: true, minimap: { enabled: false } }} />}
        </section>
      ))}
    </div>);
}
