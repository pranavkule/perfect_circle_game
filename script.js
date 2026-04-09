import { drawBackground } from './js/canvas.js';
import { analyze, clearAll, setupDrawingEvents } from './js/controller.js';

drawBackground();
setupDrawingEvents();

window.analyze = analyze;
window.clearAll = clearAll;