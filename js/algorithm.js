function calcError(cx, cy, r, points) {
  if (!points.length) return Infinity;

  let sum = 0;
  for (const p of points) {
    const distToCenter = Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2);
    sum += Math.abs(distToCenter - r);
  }

  return sum / points.length;
}

function hillClimbing(points) {
  const logs = [];

  let cx = points.reduce((s, p) => s + p.x, 0) / points.length;
  let cy = points.reduce((s, p) => s + p.y, 0) / points.length;
  let r = points.reduce((s, p) =>
    s + Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2), 0
  ) / points.length;

  let err = calcError(cx, cy, r, points);
  let step = 12;
  let iter = 0;

  logs.push(`[INIT] cx:${cx.toFixed(1)} cy:${cy.toFixed(1)} r:${r.toFixed(1)}`);
  logs.push(`[INIT] Starting error: ${err.toFixed(3)}`);

  while (step > 0.1 && iter < 4000) {
    const neighbors = [
      [cx + step, cy, r],
      [cx - step, cy, r],
      [cx, cy + step, r],
      [cx, cy - step, r],
      [cx, cy, r + step],
      [cx, cy, r - step],
    ];

    let improved = false;

    for (const [ncx, ncy, nr] of neighbors) {
      if (nr < 5) continue;

      const newErr = calcError(ncx, ncy, nr, points);

      if (newErr < err) {
        cx = ncx;
        cy = ncy;
        r = nr;
        err = newErr;
        improved = true;
        break;
      }
    }

    if (!improved) step *= 0.5;
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

function calcScore(err, r) {
  const normalized = err / Math.max(r, 1);
  return Math.round(
    Math.max(0, Math.min(100, 100 * Math.exp(-normalized * 4))) * 10
  ) / 10;
}

function getGrade(score) {
  if (score >= 93) return { g: 'S 🏆', cls: 'gS', msg: "🏆 LEGENDARY!! You're a circle master!" };
  if (score >= 80) return { g: 'A 🎯', cls: 'gA', msg: "🎯 Amazing! That's nearly perfect!" };
  if (score >= 65) return { g: 'B 😄', cls: 'gB', msg: "😄 Great job! Keep practicing!" };
  if (score >= 45) return { g: 'C 💪', cls: 'gC', msg: "💪 Good try! You can do better!" };
  return { g: 'D 🔄', cls: 'gD', msg: "🔄 Keep trying, you'll get there!" };
}

export { calcError, hillClimbing, calcScore, getGrade };
