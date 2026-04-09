import { drawC, dx, SIZE } from './canvas.js';
import { state } from './state.js';
import { hillClimbing, calcScore, getGrade } from './algorithm.js';
import { resetPanel, burst, animateRing, drawResult } from './ui.js';

function getPos(e) {
  const rect = drawC.getBoundingClientRect();
  if (e.touches) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top,
    };
  }
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

function onStart(e) {
  state.drawing = true;
  state.pts = [];
  state.drawn = false;

  dx.clearRect(0, 0, SIZE, SIZE);
  document.getElementById('hint').classList.add('gone');
  document.getElementById('rec').classList.add('show');
  document.getElementById('cw').classList.add('drawing');
  document.getElementById('cw').classList.remove('done');
  document.getElementById('confetti').classList.remove('show');
  resetPanel();
}

function onMove(e) {
  if (!state.drawing) return;

  const p = getPos(e);
  state.pts.push(p);
  if (state.pts.length < 2) return;

  dx.clearRect(0, 0, SIZE, SIZE);
  dx.beginPath();
  dx.moveTo(state.pts[0].x, state.pts[0].y);
  for (let i = 1; i < state.pts.length; i++) {
    dx.lineTo(state.pts[i].x, state.pts[i].y);
  }
  dx.strokeStyle = '#ff6b9d';
  dx.lineWidth = 3.5;
  dx.lineCap = 'round';
  dx.lineJoin = 'round';
  dx.stroke();
}

function onEnd() {
  if (!state.drawing) return;

  state.drawing = false;
  state.drawn = state.pts.length > 20;

  document.getElementById('rec').classList.remove('show');
  document.getElementById('cw').classList.remove('drawing');
  document.getElementById('stPts').textContent = state.pts.length;

  if (state.drawn) setTimeout(analyze, 350);
}

function getAngularCoverage(points, cx, cy) {
  const angles = points
    .map(p => Math.atan2(p.y - cy, p.x - cx))
    .sort((a, b) => a - b);

  if (!angles.length) return 0;

  let maxGap = 0;
  for (let i = 1; i < angles.length; i++) {
    maxGap = Math.max(maxGap, angles[i] - angles[i - 1]);
  }

  const wrapGap = (angles[0] + Math.PI * 2) - angles[angles.length - 1];
  maxGap = Math.max(maxGap, wrapGap);

  return (Math.PI * 2) - maxGap;
}

function isClosedCircleStroke(points, result) {
  if (points.length < 15) return false;

  const coverage = getAngularCoverage(points, result.cx, result.cy);
  const first = points[0];
  const last = points[points.length - 1];
  const closureDist = Math.hypot(last.x - first.x, last.y - first.y);

  const minCoverage = 5.4;
  const maxClosureDist = result.r * 1.1;

  return coverage >= minCoverage && closureDist <= maxClosureDist;
}

function analyze() {
  if (!state.drawn || state.pts.length < 15) {
    alert('Draw a circle first! 🖊️');
    return;
  }

  const result = hillClimbing(state.pts);

  if (!isClosedCircleStroke(state.pts, result)) {
    alert('Draw a full circle (not an arc)! ⭕');
    return;
  }

  const score = calcScore(result.err, result.r);
  const gd = getGrade(score);

  animateRing(score);

  let n = 0;
  const numEl = document.getElementById('scoreNum');
  const tick = () => {
    n = Math.min(n + 2, score);
    numEl.textContent = n.toFixed(0);
    if (n < score) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  const gb = document.getElementById('gradeBadge');
  gb.style.display = 'inline-flex';
  gb.className = `grade-box ${gd.cls} pop`;
  gb.textContent = `GRADE  ${gd.g}`;
  document.getElementById('gradeMsg').textContent = gd.msg;

  document.getElementById('stIter').textContent = result.iter;
  document.getElementById('stErr').textContent = result.err.toFixed(2);
  document.getElementById('stR').textContent = result.r.toFixed(0) + 'px';

  drawResult(result);

  document.getElementById('cw').classList.add('done');

  burst(score);
}

function clearAll() {
  dx.clearRect(0, 0, SIZE, SIZE);
  state.pts = [];
  state.drawn = false;

  document.getElementById('hint').classList.remove('gone');
  document.getElementById('stPts').textContent = '0';
  document.getElementById('cw').classList.remove('done', 'drawing');
  document.getElementById('confetti').classList.remove('show');

  resetPanel();
}

function setupDrawingEvents() {
  drawC.addEventListener('mousedown', onStart);
  drawC.addEventListener('mousemove', onMove);
  drawC.addEventListener('mouseup', onEnd);
  drawC.addEventListener('mouseleave', onEnd);

  drawC.addEventListener('touchstart', e => {
    e.preventDefault();
    onStart(e);
  }, { passive: false });

  drawC.addEventListener('touchmove', e => {
    e.preventDefault();
    onMove(e);
  }, { passive: false });

  drawC.addEventListener('touchend', onEnd);
}

export { analyze, clearAll, setupDrawingEvents };
