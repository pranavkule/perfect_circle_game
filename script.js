/* ═══════════════════════════════════════════════════
   script.js — Perfect Circle Game (Kids Theme)
   AI Mini Project | Hill Climbing Optimization
   Unit 3.1 — Local Search & Optimization
═══════════════════════════════════════════════════ */


/* ══════════════════════════════════════════════════
   1. CANVAS SETUP
══════════════════════════════════════════════════ */
const bgC   = document.getElementById('bgC');
const drawC = document.getElementById('drawC');
const bx    = bgC.getContext('2d');
const dx    = drawC.getContext('2d');

// Fit canvas to available space responsively
const SIZE = Math.min(
  window.innerWidth > 860
    ? window.innerWidth - 310 - 72
    : window.innerWidth - 40,
  520
);

bgC.width = drawC.width = bgC.height = drawC.height = SIZE;


/* ══════════════════════════════════════════════════
   2. DRAW BACKGROUND
   Soft grid + target guide rings + center dot
══════════════════════════════════════════════════ */
function drawBackground() {
  bx.clearRect(0, 0, SIZE, SIZE);

  // White base
  bx.fillStyle = '#ffffff';
  bx.fillRect(0, 0, SIZE, SIZE);

  // Soft purple grid lines
  bx.strokeStyle = 'rgba(240,230,255,0.8)';
  bx.lineWidth = 1;
  for (let x = 0; x < SIZE; x += 30) {
    bx.beginPath(); bx.moveTo(x, 0); bx.lineTo(x, SIZE); bx.stroke();
  }
  for (let y = 0; y < SIZE; y += 30) {
    bx.beginPath(); bx.moveTo(0, y); bx.lineTo(SIZE, y); bx.stroke();
  }

  // Yellow guide rings (help user aim)
  const cx = SIZE / 2, cy = SIZE / 2;
  [80, 120, 160, 200].forEach(r => {
    bx.beginPath();
    bx.arc(cx, cy, r, 0, Math.PI * 2);
    bx.strokeStyle = `rgba(255,217,61,${0.08 + (200 - r) * 0.001})`;
    bx.lineWidth = 1.5;
    bx.setLineDash([4, 5]);
    bx.stroke();
    bx.setLineDash([]);
  });

  // Center crosshair
  bx.strokeStyle = 'rgba(200,200,230,0.5)';
  bx.lineWidth = 1;
  bx.setLineDash([5, 5]);
  bx.beginPath(); bx.moveTo(cx, 10); bx.lineTo(cx, SIZE - 10); bx.stroke();
  bx.beginPath(); bx.moveTo(10, cy); bx.lineTo(SIZE - 10, cy); bx.stroke();
  bx.setLineDash([]);

  // Center dot
  bx.beginPath();
  bx.arc(cx, cy, 6, 0, Math.PI * 2);
  bx.fillStyle = 'rgba(255,107,53,.2)';
  bx.fill();
}

drawBackground();


/* ══════════════════════════════════════════════════
   3. DRAWING STATE
══════════════════════════════════════════════════ */
let drawing = false;   // Is user currently drawing?
let pts     = [];      // Array of {x, y} points from mouse
let drawn   = false;   // Has user completed a valid drawing?


/* ══════════════════════════════════════════════════
   4. MOUSE / TOUCH POSITION HELPER
══════════════════════════════════════════════════ */
function getPos(e) {
  const rect = drawC.getBoundingClientRect();
  if (e.touches) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  }
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}


/* ══════════════════════════════════════════════════
   5. DRAWING EVENT LISTENERS
══════════════════════════════════════════════════ */
drawC.addEventListener('mousedown',  onStart);
drawC.addEventListener('mousemove',  onMove);
drawC.addEventListener('mouseup',    onEnd);
drawC.addEventListener('mouseleave', onEnd);

// Touch support for mobile
drawC.addEventListener('touchstart', e => { e.preventDefault(); onStart(e); }, { passive: false });
drawC.addEventListener('touchmove',  e => { e.preventDefault(); onMove(e);  }, { passive: false });
drawC.addEventListener('touchend',   onEnd);


/* ══════════════════════════════════════════════════
   6. DRAW EVENT HANDLERS
══════════════════════════════════════════════════ */

// User starts drawing
function onStart(e) {
  drawing = true;
  pts     = [];
  drawn   = false;

  dx.clearRect(0, 0, SIZE, SIZE);
  document.getElementById('hint').classList.add('gone');
  document.getElementById('rec').classList.add('show');
  document.getElementById('cw').classList.add('drawing');
  document.getElementById('cw').classList.remove('done');
  document.getElementById('confetti').classList.remove('show');
  resetPanel();
}

// User is drawing — collect points and render live path
function onMove(e) {
  if (!drawing) return;

  const p = getPos(e);
  pts.push(p);
  if (pts.length < 2) return;

  dx.clearRect(0, 0, SIZE, SIZE);
  dx.beginPath();
  dx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    dx.lineTo(pts[i].x, pts[i].y);
  }
  dx.strokeStyle = '#ff6b9d';   // pink drawing color
  dx.lineWidth   = 3.5;
  dx.lineCap     = 'round';
  dx.lineJoin    = 'round';
  dx.stroke();
}

// User releases mouse — start AI analysis
function onEnd() {
  if (!drawing) return;

  drawing = false;
  drawn   = pts.length > 20;   // need minimum points

  document.getElementById('rec').classList.remove('show');
  document.getElementById('cw').classList.remove('drawing');
  document.getElementById('stPts').textContent = pts.length;

  if (drawn) setTimeout(analyze, 350);
}


/* ══════════════════════════════════════════════════
   7. ERROR FUNCTION
   ─────────────────────────────────────────────────
   Measures how far drawn points are from ideal circle.
   Formula: error = (1/n) × Σ | dist(point, center) − r |
   Lower error = better fit.
══════════════════════════════════════════════════ */
function calcError(cx, cy, r, points) {
  if (!points.length) return Infinity;

  let sum = 0;
  for (const p of points) {
    const distToCenter = Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2);
    sum += Math.abs(distToCenter - r);
  }

  return sum / points.length;
}


/* ══════════════════════════════════════════════════
   8. HILL CLIMBING ALGORITHM
   ─────────────────────────────────────────────────
   Goal     : Find best cx, cy, r to minimize error
   Strategy : Greedy local search
   Data Str : Implicit — tries 6 neighbor moves each step
   Accept   : ONLY if new error < current error
   Shrink   : Step size halved when stuck
   Stop     : When step < 0.1 (local optimum reached)
══════════════════════════════════════════════════ */
function hillClimbing(points) {
  const logs = [];

  /* STEP 1 — Initial guess using centroid */
  let cx  = points.reduce((s, p) => s + p.x, 0) / points.length;
  let cy  = points.reduce((s, p) => s + p.y, 0) / points.length;
  let r   = points.reduce((s, p) =>
    s + Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2), 0
  ) / points.length;

  let err  = calcError(cx, cy, r, points);
  let step = 12;
  let iter = 0;

  logs.push(`[INIT] cx:${cx.toFixed(1)} cy:${cy.toFixed(1)} r:${r.toFixed(1)}`);
  logs.push(`[INIT] Starting error: ${err.toFixed(3)}`);

  /* STEP 2–6 — Climb iteratively */
  while (step > 0.1 && iter < 4000) {

    // 6 possible neighbor moves
    const neighbors = [
      [cx + step, cy,       r      ],   // right
      [cx - step, cy,       r      ],   // left
      [cx,        cy + step, r     ],   // down
      [cx,        cy - step, r     ],   // up
      [cx,        cy,        r + step], // bigger radius
      [cx,        cy,        r - step], // smaller radius
    ];

    let improved = false;

    for (const [ncx, ncy, nr] of neighbors) {
      if (nr < 5) continue;   // radius must stay positive

      const newErr = calcError(ncx, ncy, nr, points);

      if (newErr < err) {     // GREEDY: only accept improvement
        cx  = ncx;
        cy  = ncy;
        r   = nr;
        err = newErr;
        improved = true;
        break;
      }
    }

    if (!improved) step *= 0.5;   // shrink step when stuck
    iter++;

    if (iter % 400 === 0) {
      logs.push(`[iter ${iter}] err:${err.toFixed(3)} step:${step.toFixed(2)}`);
    }
  }

  logs.push(`[DONE] Converged at iteration ${iter}`);
  logs.push(`[DONE] Final error: ${err.toFixed(3)} px`);
  logs.push(`[DONE] Best radius: ${r.toFixed(1)} px`);

  return { cx, cy, r, err, iter, logs };
}


/* ══════════════════════════════════════════════════
   9. SCORE + GRADE
══════════════════════════════════════════════════ */

// Score = 100 × e^(−normalized_error × 4)
function calcScore(err, r) {
  const normalized = err / Math.max(r, 1);
  return Math.round(
    Math.max(0, Math.min(100, 100 * Math.exp(-normalized * 4))) * 10
  ) / 10;
}

// Returns grade label, CSS class, and fun message
function getGrade(score) {
  if (score >= 93) return { g: 'S 🏆', cls: 'gS', msg: "🏆 LEGENDARY!! You're a circle master!" };
  if (score >= 80) return { g: 'A 🎯', cls: 'gA', msg: "🎯 Amazing! That's nearly perfect!" };
  if (score >= 65) return { g: 'B 😄', cls: 'gB', msg: "😄 Great job! Keep practicing!" };
  if (score >= 45) return { g: 'C 💪', cls: 'gC', msg: "💪 Good try! You can do better!" };
  return                  { g: 'D 🔄', cls: 'gD', msg: "🔄 Keep trying, you'll get there!" };
}


/* ══════════════════════════════════════════════════
   10. CONFETTI BURST
   Triggers when score >= 50
══════════════════════════════════════════════════ */
function burst(score) {
  if (score < 50) return;

  const wrap   = document.getElementById('confetti');
  const colors = ['#ffd93d','#ff6b35','#ff6b9d','#4ecdc4','#a855f7','#6bcb77'];

  wrap.innerHTML = '';

  for (let i = 0; i < 28; i++) {
    const el = document.createElement('div');
    el.className = 'conf';
    el.style.cssText = `
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 20}%;
      background: ${colors[i % colors.length]};
      animation-delay: ${Math.random() * 0.6}s;
      animation-duration: ${1.2 + Math.random() * 0.8}s;
      transform: rotate(${Math.random() * 360}deg);
      width: ${6 + Math.random() * 10}px;
      height: ${6 + Math.random() * 10}px;
      border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
    `;
    wrap.appendChild(el);
  }

  wrap.classList.add('show');
  setTimeout(() => wrap.classList.remove('show'), 2000);
}


/* ══════════════════════════════════════════════════
   11. ANIMATE SCORE RING
   Conic gradient fills up as score animates
══════════════════════════════════════════════════ */
function animateRing(score) {
  const ring = document.getElementById('scoreRing');
  let cur = 0;

  // Color based on performance
  const colors = score >= 80 ? ['#6bcb77', '#4ecdc4']
               : score >= 50 ? ['#ff6b35', '#ffd93d']
               :               ['#ff4757', '#ff6b9d'];

  const step = () => {
    cur = Math.min(cur + 2, score);
    const deg = (cur / 100) * 360;
    ring.style.background =
      `conic-gradient(${colors[0]} 0deg, ${colors[1]} ${deg}deg, #f0e6ff ${deg}deg)`;
    if (cur < score) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}


/* ══════════════════════════════════════════════════
   12. ANALYZE — Main entry point
   Called automatically when drawing ends.
══════════════════════════════════════════════════ */
function analyze() {
  if (!drawn || pts.length < 15) {
    alert('Draw a circle first! 🖊️');
    return;
  }

  // Run Hill Climbing
  const result = hillClimbing(pts);
  const score  = calcScore(result.err, result.r);
  const gd     = getGrade(score);

  // Animate score ring
  animateRing(score);

  // Animate score number count-up
  let n = 0;
  const numEl = document.getElementById('scoreNum');
  const tick  = () => {
    n = Math.min(n + 2, score);
    numEl.textContent = n.toFixed(0);
    if (n < score) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  // Show grade badge with pop animation
  const gb = document.getElementById('gradeBadge');
  gb.style.display = 'inline-flex';
  gb.className     = `grade-box ${gd.cls} pop`;
  gb.textContent   = `GRADE  ${gd.g}`;
  document.getElementById('gradeMsg').textContent = gd.msg;

  // Update stats
  document.getElementById('stIter').textContent = result.iter;
  document.getElementById('stErr').textContent  = result.err.toFixed(2);
  document.getElementById('stR').textContent    = result.r.toFixed(0) + 'px';

  // Populate AI log
  const lb = document.getElementById('logBox');
  lb.innerHTML = result.logs.map(line => {
    const cls = line.startsWith('[DONE]') ? 'll-g'
              : line.startsWith('[INIT]') ? 'll-h'
              : 'll';
    return `<div class="${cls}">${line}</div>`;
  }).join('');
  lb.scrollTop = lb.scrollHeight;

  // Draw optimized circle on canvas
  drawResult(result);

  // Update canvas border to green
  document.getElementById('cw').classList.add('done');

  // Confetti if good score
  burst(score);
}


/* ══════════════════════════════════════════════════
   13. DRAW OPTIMIZED CIRCLE
   Animates the AI best-fit circle on the canvas
══════════════════════════════════════════════════ */
function drawResult(result) {
  let angle = 0;

  const frame = () => {
    dx.clearRect(0, 0, SIZE, SIZE);

    // Faded user drawing underneath
    if (pts.length > 1) {
      dx.beginPath();
      dx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        dx.lineTo(pts[i].x, pts[i].y);
      }
      dx.strokeStyle = 'rgba(255,107,157,0.25)';
      dx.lineWidth   = 2.5;
      dx.lineCap     = 'round';
      dx.lineJoin    = 'round';
      dx.stroke();
    }

    // Animated orange optimized circle
    dx.beginPath();
    dx.arc(result.cx, result.cy, result.r, -Math.PI / 2, -Math.PI / 2 + angle);
    dx.strokeStyle = '#ff6b35';
    dx.lineWidth   = 3.5;
    dx.lineCap     = 'round';
    dx.stroke();

    // Yellow center dot with orange border
    dx.beginPath();
    dx.arc(result.cx, result.cy, 7, 0, Math.PI * 2);
    dx.fillStyle   = '#ffd93d';
    dx.fill();
    dx.strokeStyle = '#ff6b35';
    dx.lineWidth   = 2;
    dx.stroke();

    // Continue animation until full circle drawn
    if (angle < Math.PI * 2) {
      angle += 0.1;
      requestAnimationFrame(frame);
    }
  };

  frame();
}


/* ══════════════════════════════════════════════════
   14. RESET & CLEAR
══════════════════════════════════════════════════ */

// Reset panel to default state
function resetPanel() {
  document.getElementById('scoreNum').textContent      = '?';
  document.getElementById('scoreRing').style.background = 'conic-gradient(#ffd93d 0%, #f0e6ff 0%)';
  document.getElementById('gradeBadge').style.display  = 'none';
  document.getElementById('gradeMsg').textContent      = 'Draw a circle to see your score!';
  document.getElementById('stIter').textContent        = '—';
  document.getElementById('stErr').textContent         = '—';
  document.getElementById('stR').textContent           = '—';
  document.getElementById('logBox').innerHTML =
    '<div class="ll">Waiting for your drawing...</div>' +
    '<div class="ll">Draw a circle to start the AI!</div>';
}

// Clear canvas and reset everything
function clearAll() {
  dx.clearRect(0, 0, SIZE, SIZE);
  pts   = [];
  drawn = false;

  document.getElementById('hint').classList.remove('gone');
  document.getElementById('stPts').textContent = '0';
  document.getElementById('cw').classList.remove('done', 'drawing');
  document.getElementById('confetti').classList.remove('show');

  resetPanel();
}