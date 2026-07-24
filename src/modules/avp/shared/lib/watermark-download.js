/** Arizona Voter Project — watermarked graphic export. */

export const AVP_WATERMARK = "Arizona Voter Project";

/**
 * Draw a bottom-right watermark onto a canvas (mutates in place).
 * @param {HTMLCanvasElement} canvas
 * @param {string} [text]
 */
export function stampWatermark(canvas, text = AVP_WATERMARK) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const w = canvas.width;
  const h = canvas.height;
  const fontSize = Math.max(12, Math.round(Math.min(w, h) * 0.028));
  const pad = Math.max(10, Math.round(fontSize * 0.8));

  ctx.save();
  ctx.font = `600 ${fontSize}px "IBM Plex Mono", "Space Grotesk", system-ui, sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";

  const metrics = ctx.measureText(text);
  const tw = metrics.width;
  const th = fontSize * 1.35;
  const bx = w - pad - tw - pad * 0.6;
  const by = h - pad - th;
  const bw = tw + pad * 1.2;
  const bh = th + pad * 0.35;

  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = "rgba(12, 35, 75, 0.88)";
  ctx.fillText(text, w - pad - pad * 0.3, h - pad);
  ctx.restore();
  return canvas;
}

/** @param {HTMLCanvasElement} source */
export function cloneCanvas(source) {
  const out = document.createElement("canvas");
  out.width = source.width;
  out.height = source.height;
  const ctx = out.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(source, 0, 0);
  }
  return out;
}

/**
 * Rasterize an SVG element to a canvas (white background).
 * @param {SVGElement} svg
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function svgToCanvas(svg) {
  const clone = svg.cloneNode(true);
  if (!clone.getAttribute("xmlns")) {
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }
  const box = svg.getBoundingClientRect();
  const vb = svg.viewBox?.baseVal;
  const w = Math.max(1, Math.round(vb?.width || box.width || svg.clientWidth || 800));
  const h = Math.max(1, Math.round(vb?.height || box.height || svg.clientHeight || 500));
  clone.setAttribute("width", String(w));
  clone.setAttribute("height", String(h));

  const xml = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));

  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
    }
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** @param {string} url */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to rasterize graphic"));
    img.src = url;
  });
}

/**
 * Capture the primary graphic inside a container (canvas, map canvas, or SVG).
 * @param {HTMLElement} root
 * @returns {Promise<HTMLCanvasElement>}
 */
export async function captureGraphic(root) {
  if (!root) throw new Error("Nothing to capture");

  const mapCanvas = root.querySelector?.(".maplibregl-canvas");
  if (mapCanvas instanceof HTMLCanvasElement && mapCanvas.width > 0) {
    return stampWatermark(cloneCanvas(mapCanvas));
  }

  const canvases = [...(root.querySelectorAll?.("canvas") ?? [])].filter(
    (c) => c instanceof HTMLCanvasElement && c.width > 0 && c.height > 0,
  );
  if (canvases.length) {
    // Prefer the largest chart canvas (skip tiny UI canvases).
    canvases.sort((a, b) => b.width * b.height - a.width * a.height);
    return stampWatermark(cloneCanvas(canvases[0]));
  }

  const svg = root.querySelector?.("svg");
  if (svg) {
    return stampWatermark(await svgToCanvas(svg));
  }

  if (root instanceof HTMLCanvasElement) {
    return stampWatermark(cloneCanvas(root));
  }

  throw new Error("No downloadable graphic found");
}

/**
 * Trigger a PNG download of a canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {string} filename
 */
export function downloadCanvasPng(canvas, filename) {
  const name = filename.endsWith(".png") ? filename : `${filename}.png`;
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = name;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Capture a container and download as a watermarked PNG.
 * @param {HTMLElement} root
 * @param {string} filename
 */
export async function downloadWatermarkedGraphic(root, filename) {
  const canvas = await captureGraphic(root);
  downloadCanvasPng(canvas, filename);
}

/**
 * Stamp a watermark onto an image data URL and download.
 * @param {string} dataUrl
 * @param {string} filename
 */
export async function downloadWatermarkedDataUrl(dataUrl, filename) {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  }
  stampWatermark(canvas);
  downloadCanvasPng(canvas, filename);
}
