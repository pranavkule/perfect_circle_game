import { dx, SIZE } from './canvas.js';
import { state } from './state.js';

function resetPanel() {
  document.getElementById('scoreNum').textContent = '?';
  document.getElementById('scoreRing').style.background = 'conic-gradient(#ffd93d 0%, #f0e6ff 0%)';
  document.getElementById('gradeBadge').style.display = 'none';
  document.getElementById('gradeMsg').textContent = 'Draw a circle to see your score!';
  document.getElementById('stIter').textContent = '—';
  document.getElementById('stErr').textContent = '—';
  document.getElementById('stR').textContent = '—';
}

function burst(score) {
  if (score < 50) return;

  const wrap = document.getElementById('confetti');
  const colors = ['#ffd93d', '#ff6b35', '#ff6b9d', '#4ecdc4', '#a855f7', '#6bcb77'];

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

function animateRing(score) {
  const ring = document.getElementById('scoreRing');
  let cur = 0;

  const colors = score >= 80 ? ['#6bcb77', '#4ecdc4']
    : score >= 50 ? ['#ff6b35', '#ffd93d']
      : ['#ff4757', '#ff6b9d'];

  const step = () => {
    cur = Math.min(cur + 2, score);
    const deg = (cur / 100) * 360;
    ring.style.background =
      `conic-gradient(${colors[0]} 0deg, ${colors[1]} ${deg}deg, #f0e6ff ${deg}deg)`;
    if (cur < score) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}

function drawResult(result) {
  let angle = 0;

  const frame = () => {
    dx.clearRect(0, 0, SIZE, SIZE);

    if (state.pts.length > 1) {
      dx.beginPath();
      dx.moveTo(state.pts[0].x, state.pts[0].y);
      for (let i = 1; i < state.pts.length; i++) {
        dx.lineTo(state.pts[i].x, state.pts[i].y);
      }
      dx.strokeStyle = 'rgba(255,107,157,0.25)';
      dx.lineWidth = 2.5;
      dx.lineCap = 'round';
      dx.lineJoin = 'round';
      dx.stroke();
    }

    dx.beginPath();
    dx.arc(result.cx, result.cy, result.r, -Math.PI / 2, -Math.PI / 2 + angle);
    dx.strokeStyle = '#ff6b35';
    dx.lineWidth = 3.5;
    dx.lineCap = 'round';
    dx.stroke();

    dx.beginPath();
    dx.arc(result.cx, result.cy, 7, 0, Math.PI * 2);
    dx.fillStyle = '#ffd93d';
    dx.fill();
    dx.strokeStyle = '#ff6b35';
    dx.lineWidth = 2;
    dx.stroke();

    if (angle < Math.PI * 2) {
      angle += 0.1;
      requestAnimationFrame(frame);
    }
  };

  frame();
}

export { resetPanel, burst, animateRing, drawResult };
