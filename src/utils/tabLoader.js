// Simple tab loader: animates document.title (frames) and favicon (canvas) while active.
let _titleInterval = null;
let _faviconInterval = null;
let _originalTitle = null;
let _originalFaviconHref = null;
let _faviconEl = null;

function _getFaviconEl() {
  if (_faviconEl) return _faviconEl;
  const rels = ["icon", "shortcut icon", "apple-touch-icon"];
  for (const r of rels) {
    const el = document.querySelector(`link[rel='${r}']`);
    if (el) {
      _faviconEl = el;
      return el;
    }
  }
  // create one
  const link = document.createElement("link");
  link.rel = "icon";
  document.head.appendChild(link);
  _faviconEl = link;
  return link;
}

export function startTabLoader({ titlePrefix = "", interval = 180 } = {}) {
  if (typeof document === "undefined") return;
  if (!_originalTitle) _originalTitle = document.title;
  if (!_originalFaviconHref) {
    const el = _getFaviconEl();
    _originalFaviconHref = el.getAttribute("href") || null;
  }

  const frames = ["◐", "◓", "◑", "◒"];

  // title animation
  if (!_titleInterval) {
    let ti = 0;
    _titleInterval = setInterval(() => {
      const prefix = titlePrefix ? `${titlePrefix} ` : "";
      document.title = `${frames[ti % frames.length]} ${prefix}${_originalTitle}`;
      ti += 1;
    }, interval);
  }

  // favicon animation: rotating arc drawn to canvas
  if (!_faviconInterval) {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    let fa = 0;
    _faviconInterval = setInterval(() => {
      // clear
      ctx.clearRect(0, 0, size, size);
      // background (transparent)
      // draw circle base
      ctx.beginPath();
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = 0.0;
      ctx.fillRect(0, 0, size, size);
      ctx.globalAlpha = 1.0;

      // draw ring background
      const cx = size / 2;
      const cy = size / 2;
      const r = size * 0.32;
      ctx.lineWidth = size * 0.12;
      ctx.strokeStyle = "#e5e7eb"; // gray-200
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // draw rotating arc
      ctx.strokeStyle = "#fb923c"; // orange-400
      ctx.beginPath();
      const start = fa;
      const end = fa + Math.PI * 1.2;
      ctx.arc(cx, cy, r, start, end);
      ctx.stroke();

      // optional small center dot
      ctx.fillStyle = "#fb923c";
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.06, 0, Math.PI * 2);
      ctx.fill();

      const url = canvas.toDataURL("image/png");
      const el = _getFaviconEl();
      el.setAttribute("href", url);
      fa += Math.PI * 0.12;
    }, Math.max(80, Math.floor(interval / 2)));
  }
}

export function stopTabLoader() {
  if (typeof document === "undefined") return;
  if (_titleInterval) {
    clearInterval(_titleInterval);
    _titleInterval = null;
  }
  if (_faviconInterval) {
    clearInterval(_faviconInterval);
    _faviconInterval = null;
  }
  if (_originalTitle) {
    document.title = _originalTitle;
    _originalTitle = null;
  }
  if (_originalFaviconHref) {
    const el = _getFaviconEl();
    el.setAttribute("href", _originalFaviconHref);
    _originalFaviconHref = null;
  }
}
