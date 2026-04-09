const bgC   = document.getElementById('bgC');
const drawC = document.getElementById('drawC');
const bx    = bgC.getContext('2d');
const dx    = drawC.getContext('2d');

const SIZE = Math.min(
  window.innerWidth > 860
    ? window.innerWidth - 310 - 72
    : window.innerWidth - 40,
  620
);

bgC.width = drawC.width = bgC.height = drawC.height = SIZE;

function drawBackground() {
  bx.clearRect(0, 0, SIZE, SIZE);

  bx.fillStyle = '#ffffff';
  bx.fillRect(0, 0, SIZE, SIZE);

  bx.strokeStyle = 'rgba(240,230,255,0.8)';
  bx.lineWidth = 1;
  for (let x = 0; x < SIZE; x += 30) {
    bx.beginPath();
    bx.moveTo(x, 0);
    bx.lineTo(x, SIZE);
    bx.stroke();
  }
  for (let y = 0; y < SIZE; y += 30) {
    bx.beginPath();
    bx.moveTo(0, y);
    bx.lineTo(SIZE, y);
    bx.stroke();
  }

  const cx = SIZE / 2;
  const cy = SIZE / 2;
  [80, 120, 160, 200].forEach(r => {
    bx.beginPath();
    bx.arc(cx, cy, r, 0, Math.PI * 2);
    bx.strokeStyle = `rgba(255,217,61,${0.08 + (200 - r) * 0.001})`;
    bx.lineWidth = 1.5;
    bx.setLineDash([4, 5]);
    bx.stroke();
    bx.setLineDash([]);
  });

  bx.strokeStyle = 'rgba(200,200,230,0.5)';
  bx.lineWidth = 1;
  bx.setLineDash([5, 5]);
  bx.beginPath();
  bx.moveTo(cx, 10);
  bx.lineTo(cx, SIZE - 10);
  bx.stroke();
  bx.beginPath();
  bx.moveTo(10, cy);
  bx.lineTo(SIZE - 10, cy);
  bx.stroke();
  bx.setLineDash([]);

  bx.beginPath();
  bx.arc(cx, cy, 6, 0, Math.PI * 2);
  bx.fillStyle = 'rgba(255,107,53,.2)';
  bx.fill();
}

export { bgC, drawC, bx, dx, SIZE, drawBackground };
