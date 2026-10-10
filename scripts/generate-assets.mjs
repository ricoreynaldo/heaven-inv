/**
 * Generator aset placeholder Heaven Inv.
 *
 * Membuat cover & tampilan undangan untuk setiap template seed, foto "flat lay"
 * untuk hero/about, gambar kategori, OG image, dan favicon. Semua teks diubah
 * menjadi path (opentype.js) sehingga hasilnya identik di mesin mana pun, lalu
 * dirasterisasi oleh sharp ke WebP/PNG.
 *
 * Jalankan ulang hanya bila ingin mengganti aset seed:
 *   npm run assets:generate
 *
 * Output: public/seed/** dan public/brand/**. Admin tetap bisa mengganti semua
 * gambar ini lewat panel admin.
 */
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_SEED = path.join(ROOT, "public", "seed");
const OUT_BRAND = path.join(ROOT, "public", "brand");
const W = 1200;
const H = 1500;

/* ---------- fonts ---------- */

async function loadFont(rel) {
  const buf = await readFile(path.join(ROOT, "node_modules", "@fontsource", rel));
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

const fonts = {
  script: await loadFont("pinyon-script/files/pinyon-script-latin-400-normal.woff"),
  serif: await loadFont("cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff"),
  serifSemi: await loadFont("cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff"),
  serifItalic: await loadFont("cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff"),
  sans: await loadFont("jost/files/jost-latin-400-normal.woff"),
  sansMedium: await loadFont("jost/files/jost-latin-500-normal.woff"),
};

function measure(font, text, size, tracking = 0) {
  if (!tracking) return font.getAdvanceWidth(text, size, { kerning: true });
  let w = 0;
  for (const ch of text) w += font.getAdvanceWidth(ch, size);
  return w + tracking * size * (Array.from(text).length - 1);
}

/**
 * Serializer path sendiri: `Path.toPathData(2)` di opentype.js 2.0 kadang
 * menghasilkan "NaN" untuk koordinat tertentu, yang membuat librsvg berhenti
 * menggambar di tengah teks.
 */
function pathToD(p) {
  const f = (n) => String(Math.round(n * 100) / 100);
  let d = "";
  for (const c of p.commands) {
    if (c.type === "M" || c.type === "L") d += `${c.type}${f(c.x)} ${f(c.y)}`;
    else if (c.type === "Q") d += `Q${f(c.x1)} ${f(c.y1)} ${f(c.x)} ${f(c.y)}`;
    else if (c.type === "C") d += `C${f(c.x1)} ${f(c.y1)} ${f(c.x2)} ${f(c.y2)} ${f(c.x)} ${f(c.y)}`;
    else if (c.type === "Z") d += "Z";
  }
  return d;
}

/** Teks → <path>. anchor: start | middle | end. tracking dalam em. */
function T(fontKey, text, { x, y, size, anchor = "middle", tracking = 0, fill, opacity = 1 }) {
  const font = fonts[fontKey];
  const width = measure(font, text, size, tracking);
  let cx = anchor === "middle" ? x - width / 2 : anchor === "end" ? x - width : x;
  let d = "";
  if (!tracking) {
    d = pathToD(font.getPath(text, cx, y, size, { kerning: true }));
  } else {
    for (const ch of text) {
      d += pathToD(font.getPath(ch, cx, y, size));
      cx += font.getAdvanceWidth(ch, size) + tracking * size;
    }
  }
  return `<path d="${d}" fill="${fill}" opacity="${opacity}"/>`;
}

/* ---------- utils ---------- */

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const grainFilter = (id = "grain", alpha = 0.07) => `
  <filter id="${id}" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer><feFuncA type="table" tableValues="0 ${alpha}"/></feComponentTransfer>
  </filter>`;

function svgDoc(w, h, defs, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${defs}</defs>${body}</svg>`;
}

function background(p, w = W, h = H) {
  return {
    defs: `
      <radialGradient id="glow" cx="50%" cy="38%" r="75%">
        <stop offset="0" stop-color="${p.bgLight}"/>
        <stop offset="1" stop-color="${p.bg}"/>
      </radialGradient>
      ${grainFilter("grain", p.dark ? 0.1 : 0.07)}`,
    body: `<rect width="${w}" height="${h}" fill="url(#glow)"/><rect width="${w}" height="${h}" filter="url(#grain)"/>`,
  };
}

/* ---------- motifs ---------- */

function flower(cx, cy, r, petal, center, rot = 0) {
  let s = `<g transform="translate(${cx} ${cy}) rotate(${rot})">`;
  for (let i = 0; i < 5; i++) {
    s += `<ellipse cx="0" cy="${-r * 0.55}" rx="${r * 0.36}" ry="${r * 0.55}" fill="${petal}" transform="rotate(${i * 72})" opacity="0.92"/>`;
  }
  s += `<circle r="${r * 0.2}" fill="${center}"/></g>`;
  return s;
}

function leaf(cx, cy, len, w, rot, fill, opacity = 0.9) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${w}" ry="${len}" fill="${fill}" opacity="${opacity}" transform="rotate(${rot} ${cx} ${cy})"/>`;
}

function sprig(x, y, length, angle, p, flip = 1) {
  let s = `<g transform="translate(${x} ${y}) rotate(${angle})">`;
  s += `<path d="M0 0 Q ${length * 0.15 * flip} ${-length * 0.5} 0 ${-length}" stroke="${p.leaf}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  for (let i = 1; i <= 6; i++) {
    const t = i / 7;
    const ly = -length * t;
    const lx = Math.sin(t * Math.PI) * length * 0.07 * flip;
    const size = 34 * (1 - t * 0.45);
    s += leaf(lx + size * 0.75, ly, size, size * 0.42, 50, p.leaf, 0.85);
    s += leaf(lx - size * 0.75, ly - 10, size, size * 0.42, -50, p.leaf, 0.85);
  }
  s += leaf(0, -length - 18, 26, 12, 0, p.leaf, 0.9);
  return s + "</g>";
}

function kawungUnit(cx, cy, r, fill, stroke) {
  let s = `<g transform="translate(${cx} ${cy}) rotate(45)">`;
  for (let i = 0; i < 4; i++) {
    s += `<ellipse cx="0" cy="${-r * 0.55}" rx="${r * 0.3}" ry="${r * 0.48}" fill="${fill}" stroke="${stroke}" stroke-width="2" transform="rotate(${i * 90})"/>`;
  }
  s += `<circle r="${r * 0.08}" fill="${stroke}"/></g>`;
  return s;
}

function star8(cx, cy, r, stroke, fill = "none", sw = 2) {
  const sq = (rot) =>
    `<rect x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" transform="rotate(${rot} ${cx} ${cy})" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  return sq(0) + sq(45);
}

function mihrab(x, y, w, h, stroke, sw = 2.5) {
  const r = w / 2;
  return `<path d="M${x} ${y + h} V${y + r * 1.1} Q${x} ${y + r * 0.2} ${x + r} ${y} Q${x + w} ${y + r * 0.2} ${x + w} ${y + r * 1.1} V${y + h}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`;
}

function rings(cx, cy, r, stroke) {
  return `<circle cx="${cx - r * 0.42}" cy="${cy}" r="${r}" fill="none" stroke="${stroke}" stroke-width="5"/>
    <circle cx="${cx + r * 0.42}" cy="${cy}" r="${r}" fill="none" stroke="${stroke}" stroke-width="5"/>
    <path d="M${cx + r * 0.42} ${cy - r - 26} l14 -14 l14 14 l-14 18 z" fill="${stroke}" opacity="0.9"/>`;
}

function sunrise(cx, cy, r, stroke, fill) {
  let s = `<path d="M${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} Z" fill="${fill}" opacity="0.55"/>`;
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI + (i / 12) * Math.PI;
    const x1 = cx + Math.cos(a) * (r + 18);
    const y1 = cy + Math.sin(a) * (r + 18);
    const x2 = cx + Math.cos(a) * (r + 58);
    const y2 = cy + Math.sin(a) * (r + 58);
    s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round"/>`;
  }
  s += `<line x1="${cx - r - 120}" y1="${cy}" x2="${cx + r + 120}" y2="${cy}" stroke="${stroke}" stroke-width="2.5"/>`;
  return s;
}

function confetti(seed, p, w = W, h = H, count = 70, avoid = null) {
  const rnd = mulberry32(seed);
  const colors = [p.accent, p.soft, p.ink, p.leaf];
  let s = "";
  for (let i = 0; i < count; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    if (avoid && x > avoid.x && x < avoid.x + avoid.w && y > avoid.y && y < avoid.y + avoid.h) continue;
    const c = colors[Math.floor(rnd() * colors.length)];
    const rot = rnd() * 180;
    const o = 0.35 + rnd() * 0.5;
    if (rnd() > 0.5) s += `<circle cx="${x}" cy="${y}" r="${4 + rnd() * 7}" fill="${c}" opacity="${o}"/>`;
    else s += `<rect x="${x}" y="${y}" width="${6 + rnd() * 8}" height="${14 + rnd() * 14}" rx="2" fill="${c}" opacity="${o}" transform="rotate(${rot} ${x} ${y})"/>`;
  }
  return s;
}

function balloon(cx, cy, r, fill, string) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${r * 0.82}" ry="${r}" fill="${fill}" opacity="0.88"/>
    <path d="M${cx} ${cy + r} q -6 10 0 14 q 10 40 -6 90 q -14 46 4 96" stroke="${string}" stroke-width="2" fill="none" opacity="0.7"/>
    <ellipse cx="${cx - r * 0.3}" cy="${cy - r * 0.35}" rx="${r * 0.14}" ry="${r * 0.24}" fill="#ffffff" opacity="0.35" transform="rotate(-25 ${cx - r * 0.3} ${cy - r * 0.35})"/>`;
}

function decoFan(cx, cy, r, stroke, dir = 1) {
  let s = "";
  for (let k = 0; k < 4; k++) {
    const rr = r - k * 26;
    s += `<path d="M${cx - rr} ${cy} A ${rr} ${rr} 0 0 ${dir > 0 ? 1 : 0} ${cx + rr} ${cy}" fill="none" stroke="${stroke}" stroke-width="${k === 0 ? 3 : 1.6}" opacity="${1 - k * 0.15}"/>`;
  }
  for (let i = 1; i < 12; i++) {
    const a = Math.PI + (i / 12) * Math.PI;
    const ys = dir > 0 ? 1 : -1;
    s += `<line x1="${cx + Math.cos(a) * 20}" y1="${cy + Math.sin(a) * 20 * ys}" x2="${cx + Math.cos(a) * (r - 80)}" y2="${cy + Math.sin(a) * (r - 80) * ys}" stroke="${stroke}" stroke-width="1.4" opacity="0.7"/>`;
  }
  return s;
}

function divider(cx, cy, w, stroke) {
  return `<line x1="${cx - w / 2}" y1="${cy}" x2="${cx - 18}" y2="${cy}" stroke="${stroke}" stroke-width="1.6"/>
    <path d="M${cx} ${cy - 9} l9 9 l-9 9 l-9 -9 z" fill="${stroke}"/>
    <line x1="${cx + 18}" y1="${cy}" x2="${cx + w / 2}" y2="${cy}" stroke="${stroke}" stroke-width="1.6"/>`;
}

function frame(p, inset = 56) {
  return `<rect x="${inset}" y="${inset}" width="${W - inset * 2}" height="${H - inset * 2}" fill="none" stroke="${p.accent}" stroke-width="2" opacity="0.75"/>
    <rect x="${inset + 16}" y="${inset + 16}" width="${W - (inset + 16) * 2}" height="${H - (inset + 16) * 2}" fill="none" stroke="${p.accent}" stroke-width="1" opacity="0.4"/>`;
}

/** Ornamen atas & bawah per motif. */
function ornaments(t) {
  const p = t.palette;
  switch (t.motif) {
    case "floral": {
      let s = "";
      const top = [
        [600, 205, 64, 0],
        [495, 232, 46, 20],
        [705, 232, 46, -15],
        [405, 262, 32, 40],
        [795, 262, 32, 10],
      ];
      for (const [x, y] of [[540, 210], [660, 210], [450, 245], [750, 245], [360, 275], [840, 275]]) {
        s += leaf(x, y, 40, 15, x < 600 ? -60 : 60, p.leaf, 0.75);
      }
      for (const [x, y, r, rot] of top) s += flower(x, y, r, p.soft, p.accent, rot);
      for (const [x, y, r, rot] of top) s += flower(x, H - y + 20, r * 0.85, p.soft, p.accent, rot + 30);
      return s;
    }
    case "botanical":
      return (
        sprig(560, 330, 210, -38, p, 1) +
        sprig(640, 330, 210, 38, p, -1) +
        sprig(530, H - 170, 170, -70, p, 1) +
        sprig(670, H - 170, 170, 70, p, -1)
      );
    case "kawung": {
      let s = "";
      for (let i = 0; i < 9; i++) {
        s += kawungUnit(160 + i * 110, 170, 64, "none", p.accent);
        s += kawungUnit(160 + i * 110, H - 170, 64, "none", p.accent);
      }
      return s;
    }
    case "arch":
      return (
        mihrab(170, 300, 860, 1060, p.accent, 3) +
        mihrab(196, 330, 808, 1030, p.accent, 1.2) +
        star8(600, 190, 34, p.accent) +
        star8(600, 190, 14, p.accent, p.accent) +
        star8(220, 200, 20, p.accent) +
        star8(980, 200, 20, p.accent)
      );
    case "rings":
      return rings(600, 290, 72, p.accent) + divider(600, H - 230, 360, p.accent);
    case "sun":
      return sunrise(600, 380, 120, p.accent, p.soft) + divider(600, H - 220, 360, p.accent);
    case "confetti":
      return (
        confetti(t.seed, p, W, H, 90, { x: 180, y: 420, w: 840, h: 760 }) +
        balloon(230, 300, 92, p.soft, p.ink) +
        balloon(980, 260, 80, p.accent, p.ink)
      );
    case "deco":
      return decoFan(600, 360, 300, p.accent, 1) + decoFan(600, H - 260, 240, p.accent, -1);
    default:
      return divider(600, 300, 420, p.accent) + divider(600, H - 260, 420, p.accent);
  }
}

/* ---------- invitation screens ---------- */

function coverSvg(t) {
  const p = t.palette;
  const bg = background(p);
  const c = t.copy;
  let body = bg.body + frame(p) + ornaments(t);

  if (t.kind === "corporate") {
    body += T("sansMedium", c.eyebrow, { x: 600, y: 600, size: 26, tracking: 0.36, fill: p.accent });
    body += T("serifSemi", c.title, { x: 600, y: 760, size: 120, fill: p.ink });
    body += T("serifItalic", c.subtitle, { x: 600, y: 860, size: 60, fill: p.ink, opacity: 0.85 });
    body += divider(600, 950, 300, p.accent);
  } else if (t.kind === "birthday") {
    body += T("sansMedium", c.eyebrow, { x: 600, y: 560, size: 26, tracking: 0.36, fill: p.accent });
    body += T("script", c.title, { x: 600, y: 790, size: 210, fill: p.ink });
    body += T("serifItalic", c.subtitle, { x: 600, y: 890, size: 64, fill: p.ink, opacity: 0.85 });
  } else {
    const yOff = 0;
    body += T("sansMedium", c.eyebrow, { x: 600, y: 560 + yOff, size: 26, tracking: 0.36, fill: p.accent });
    body += T("script", c.names[0], { x: 600, y: 745 + yOff, size: 170, fill: p.ink });
    body += T("serifItalic", "&", { x: 600, y: 830 + yOff, size: 76, fill: p.accent });
    body += T("script", c.names[1], { x: 600, y: 975 + yOff, size: 170, fill: p.ink });
  }
  body += T("serif", c.date, { x: 600, y: 1105, size: 46, tracking: 0.12, fill: p.ink });
  body += T("sans", c.place, { x: 600, y: 1162, size: 22, tracking: 0.4, fill: p.ink, opacity: 0.72 });
  return svgDoc(W, H, bg.defs, body);
}

function archPortrait(x, y, w, h, p, initial) {
  const r = w / 2;
  const d = `M${x} ${y + h} V${y + r} A ${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h} Z`;
  return `<path d="${d}" fill="${p.soft}" opacity="0.55"/>
    <path d="${d}" fill="none" stroke="${p.accent}" stroke-width="2"/>
    ${T("serifItalic", initial, { x: x + w / 2, y: y + h * 0.66, size: w * 0.62, fill: p.ink, opacity: 0.55 })}`;
}

function profileSvg(t) {
  const p = t.palette;
  const bg = background(p);
  const c = t.copy;
  let body = bg.body + frame(p, 40);
  body += T("sansMedium", c.profileLabel, { x: 600, y: 200, size: 24, tracking: 0.36, fill: p.accent });
  body += T("serifItalic", c.profileTitle, { x: 600, y: 290, size: 64, fill: p.ink });
  body += divider(600, 340, 240, p.accent);

  if (t.kind === "birthday" || t.kind === "corporate") {
    body += archPortrait(400, 420, 400, 520, p, c.initials[0]);
    body += T(t.kind === "corporate" ? "serifSemi" : "script", c.title, {
      x: 600, y: 1070, size: t.kind === "corporate" ? 72 : 110, fill: p.ink,
    });
    body += T("sans", c.profileLines[0], { x: 600, y: 1150, size: 26, fill: p.ink, opacity: 0.75 });
    body += T("sans", c.profileLines[1], { x: 600, y: 1192, size: 26, fill: p.ink, opacity: 0.75 });
  } else {
    body += archPortrait(170, 430, 380, 500, p, c.names[0][0]);
    body += archPortrait(650, 430, 380, 500, p, c.names[1][0]);
    body += T("script", c.names[0], { x: 360, y: 1050, size: 92, fill: p.ink });
    body += T("script", c.names[1], { x: 840, y: 1050, size: 92, fill: p.ink });
    body += T("sans", c.parents[0][0], { x: 360, y: 1120, size: 22, fill: p.ink, opacity: 0.72 });
    body += T("sans", c.parents[0][1], { x: 360, y: 1154, size: 22, fill: p.ink, opacity: 0.72 });
    body += T("sans", c.parents[1][0], { x: 840, y: 1120, size: 22, fill: p.ink, opacity: 0.72 });
    body += T("sans", c.parents[1][1], { x: 840, y: 1154, size: 22, fill: p.ink, opacity: 0.72 });
  }
  body += `<rect x="440" y="1260" width="320" height="64" rx="32" fill="none" stroke="${p.accent}" stroke-width="2"/>`;
  body += T("sansMedium", c.profileButton, { x: 600, y: 1300, size: 20, tracking: 0.3, fill: p.ink });
  return svgDoc(W, H, bg.defs, body);
}

function eventSvg(t) {
  const p = t.palette;
  const bg = background(p);
  const c = t.copy;
  let body = bg.body + frame(p, 40);
  body += T("sansMedium", c.eventLabel, { x: 600, y: 200, size: 24, tracking: 0.36, fill: p.accent });
  body += T("serifItalic", c.eventTitle, { x: 600, y: 290, size: 64, fill: p.ink });
  body += divider(600, 340, 240, p.accent);

  c.events.forEach((ev, i) => {
    const y = 420 + i * 330;
    body += `<rect x="200" y="${y}" width="800" height="290" rx="28" fill="${p.card}" opacity="${p.dark ? 0.22 : 0.6}" stroke="${p.accent}" stroke-opacity="0.45" stroke-width="1.5"/>`;
    body += T("sansMedium", ev.name, { x: 600, y: y + 70, size: 24, tracking: 0.34, fill: p.accent });
    body += T("serif", ev.date, { x: 600, y: y + 140, size: 46, fill: p.ink });
    body += T("sans", ev.time, { x: 600, y: y + 190, size: 26, fill: p.ink, opacity: 0.8 });
    body += T("sans", ev.venue, { x: 600, y: y + 238, size: 24, fill: p.ink, opacity: 0.68 });
  });

  const units = [["124", "HARI"], ["08", "JAM"], ["45", "MENIT"], ["20", "DETIK"]];
  units.forEach(([n, l], i) => {
    const x = 270 + i * 220;
    body += `<rect x="${x - 80}" y="1110" width="160" height="150" rx="24" fill="none" stroke="${p.accent}" stroke-width="1.6"/>`;
    body += T("serifSemi", n, { x, y: 1196, size: 64, fill: p.ink });
    body += T("sans", l, { x, y: 1236, size: 18, tracking: 0.3, fill: p.ink, opacity: 0.7 });
  });
  body += `<rect x="420" y="1310" width="360" height="66" rx="33" fill="${p.accent}"/>`;
  body += T("sansMedium", "LIHAT LOKASI", { x: 600, y: 1352, size: 21, tracking: 0.3, fill: p.onAccent });
  return svgDoc(W, H, bg.defs, body);
}

function gallerySvg(t) {
  const p = t.palette;
  const bg = background(p);
  const c = t.copy;
  let defs = bg.defs;
  let body = bg.body + frame(p, 40);
  body += T("sansMedium", "MOMEN BAHAGIA", { x: 600, y: 200, size: 24, tracking: 0.36, fill: p.accent });
  body += T("serifItalic", "Galeri & Ucapan", { x: 600, y: 290, size: 64, fill: p.ink });
  body += divider(600, 340, 240, p.accent);

  const tiles = [
    [170, 400, 420, 360],
    [610, 400, 420, 170],
    [610, 590, 200, 170],
    [830, 590, 200, 170],
  ];
  tiles.forEach(([x, y, w, h], i) => {
    defs += `<linearGradient id="tile${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.soft}"/><stop offset="1" stop-color="${p.bgLight}"/></linearGradient>`;
    body += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="url(#tile${i})" opacity="0.85"/>`;
    body += star8(x + w / 2, y + h / 2, Math.min(w, h) * 0.12, p.accent, "none", 1.4);
  });

  body += `<rect x="170" y="820" width="860" height="330" rx="28" fill="${p.card}" opacity="${p.dark ? 0.22 : 0.6}" stroke="${p.accent}" stroke-opacity="0.45" stroke-width="1.5"/>`;
  body += T("serifSemi", c.wishName, { x: 230, y: 900, size: 38, anchor: "start", fill: p.ink });
  body += T("sans", c.wish[0], { x: 230, y: 960, size: 26, anchor: "start", fill: p.ink, opacity: 0.78 });
  body += T("sans", c.wish[1], { x: 230, y: 1002, size: 26, anchor: "start", fill: p.ink, opacity: 0.78 });
  body += `<line x1="230" y1="1050" x2="970" y2="1050" stroke="${p.accent}" stroke-opacity="0.4"/>`;
  body += T("sans", "Kirim ucapan & konfirmasi kehadiran", { x: 230, y: 1104, size: 24, anchor: "start", fill: p.ink, opacity: 0.6 });

  body += T("script", "Terima kasih", { x: 600, y: 1300, size: 110, fill: p.ink });
  return svgDoc(W, H, defs, body);
}

/* ---------- template catalogue ---------- */

const wedding = (names, parents, date, place) => ({
  eyebrow: "THE WEDDING OF",
  names,
  date,
  place,
  parents,
  profileLabel: "BRIDE & GROOM",
  profileTitle: "Kedua Mempelai",
  profileButton: "SIMPAN TANGGAL",
  eventLabel: "SAVE THE DATE",
  eventTitle: "Akad & Resepsi",
  wishName: "Nadia & keluarga",
  wish: ["Selamat menempuh hidup baru, semoga menjadi", "keluarga yang sakinah, mawaddah, warahmah."],
});

const TEMPLATES = [
  {
    slug: "elegant-rose",
    kind: "wedding",
    motif: "floral",
    seed: 11,
    palette: { bg: "#EFDCD5", bgLight: "#F8EEEA", ink: "#4E3436", accent: "#A86B6F", soft: "#D9A8A6", leaf: "#8E9C83", card: "#FFFFFF", onAccent: "#FFF8F5", dark: false },
    copy: {
      ...wedding(["Raka", "Ayudia"], [["Putra dari Bpk. Hendra", "& Ibu Sari"], ["Putri dari Bpk. Wahyu", "& Ibu Ratna"]], "14 . 02 . 2027", "YOGYAKARTA"),
      events: [
        { name: "AKAD NIKAH", date: "Minggu, 14 Februari 2027", time: "08.00 - 10.00 WIB", venue: "Pendopo Agung Kusuma, Yogyakarta" },
        { name: "RESEPSI", date: "Minggu, 14 Februari 2027", time: "11.00 - 14.00 WIB", venue: "Pendopo Agung Kusuma, Yogyakarta" },
      ],
    },
  },
  {
    slug: "sage-botanica",
    kind: "wedding",
    motif: "botanical",
    seed: 22,
    palette: { bg: "#D9E0D2", bgLight: "#EEF2E9", ink: "#2F3E33", accent: "#5E7461", soft: "#B7C6AF", leaf: "#6F8A6C", card: "#FFFFFF", onAccent: "#F7FAF4", dark: false },
    copy: {
      ...wedding(["Dimas", "Kirana"], [["Putra dari Bpk. Arif", "& Ibu Lestari"], ["Putri dari Bpk. Bayu", "& Ibu Wulan"]], "22 . 05 . 2027", "BANDUNG"),
      events: [
        { name: "AKAD NIKAH", date: "Sabtu, 22 Mei 2027", time: "09.00 - 10.30 WIB", venue: "Kebun Raya Hall, Bandung" },
        { name: "RESEPSI", date: "Sabtu, 22 Mei 2027", time: "18.30 - 21.00 WIB", venue: "Kebun Raya Hall, Bandung" },
      ],
    },
  },
  {
    slug: "kawung-heritage",
    kind: "wedding",
    motif: "kawung",
    seed: 33,
    palette: { bg: "#33241B", bgLight: "#4A3427", ink: "#F3E6D0", accent: "#C9A25E", soft: "#7A5A3F", leaf: "#C9A25E", card: "#000000", onAccent: "#2A1D15", dark: true },
    copy: {
      ...wedding(["Bagas", "Sekar"], [["Putra dari Bpk. Wiryo", "& Ibu Tutik"], ["Putri dari Bpk. Harjo", "& Ibu Darmi"]], "09 . 09 . 2027", "SURAKARTA"),
      eyebrow: "PAWIWAHAN AGENG",
      events: [
        { name: "IJAB KABUL", date: "Kamis, 9 September 2027", time: "08.00 - 10.00 WIB", venue: "Ndalem Wiradipuran, Surakarta" },
        { name: "PANGGIH & RESEPSI", date: "Kamis, 9 September 2027", time: "19.00 - 21.30 WIB", venue: "Ndalem Wiradipuran, Surakarta" },
      ],
    },
  },
  {
    slug: "noor-sakinah",
    kind: "wedding",
    motif: "arch",
    seed: 44,
    palette: { bg: "#1F3A32", bgLight: "#2B4C42", ink: "#F2EBDC", accent: "#C8A96A", soft: "#3E6658", leaf: "#C8A96A", card: "#000000", onAccent: "#1B2F29", dark: true },
    copy: {
      ...wedding(["Fikri", "Aisyah"], [["Putra dari Bpk. H. Zainal", "& Ibu Hj. Maryam"], ["Putri dari Bpk. H. Ridwan", "& Ibu Hj. Fatimah"]], "18 . 03 . 2027", "MAKASSAR"),
      eyebrow: "WALIMATUL 'URSY",
      profileTitle: "Mempelai",
      events: [
        { name: "AKAD NIKAH", date: "Kamis, 18 Maret 2027", time: "08.00 - 09.30 WITA", venue: "Masjid Raya Al-Firdaus, Makassar" },
        { name: "WALIMAH", date: "Kamis, 18 Maret 2027", time: "11.00 - 14.00 WITA", venue: "Graha Sakinah, Makassar" },
      ],
    },
  },
  {
    slug: "ivory-promise",
    kind: "engagement",
    motif: "rings",
    seed: 55,
    palette: { bg: "#EFE7DA", bgLight: "#F8F3EB", ink: "#4A3F36", accent: "#A68A5B", soft: "#DCCDB5", leaf: "#A68A5B", card: "#FFFFFF", onAccent: "#FFFBF4", dark: false },
    copy: {
      ...wedding(["Arya", "Nabila"], [["Putra dari Bpk. Gunawan", "& Ibu Melati"], ["Putri dari Bpk. Rahmat", "& Ibu Indah"]], "07 . 11 . 2026", "JAKARTA"),
      eyebrow: "THE ENGAGEMENT OF",
      profileLabel: "THE COUPLE",
      profileTitle: "Kami Bertunangan",
      eventLabel: "SAVE THE DATE",
      eventTitle: "Acara Lamaran",
      events: [
        { name: "LAMARAN", date: "Sabtu, 7 November 2026", time: "10.00 - 12.00 WIB", venue: "Kediaman Keluarga Rahmat, Jakarta" },
        { name: "RAMAH TAMAH", date: "Sabtu, 7 November 2026", time: "12.00 - 14.00 WIB", venue: "Kediaman Keluarga Rahmat, Jakarta" },
      ],
      wish: ["Selamat atas pertunangannya, semoga lancar", "sampai hari pernikahan nanti."],
    },
  },
  {
    slug: "golden-hour",
    kind: "engagement",
    motif: "sun",
    seed: 66,
    palette: { bg: "#E7D3B8", bgLight: "#F4E7D6", ink: "#4B3326", accent: "#9C6B4A", soft: "#E3B98F", leaf: "#9C6B4A", card: "#FFFFFF", onAccent: "#FFF6EC", dark: false },
    copy: {
      ...wedding(["Reza", "Calista"], [["Putra dari Bpk. Anton", "& Ibu Dewi"], ["Putri dari Bpk. Surya", "& Ibu Rani"]], "16 . 01 . 2027", "BALI"),
      eyebrow: "WE ARE ENGAGED",
      profileLabel: "THE COUPLE",
      profileTitle: "Reza & Calista",
      eventTitle: "Engagement Dinner",
      events: [
        { name: "ENGAGEMENT", date: "Sabtu, 16 Januari 2027", time: "16.30 - 18.00 WITA", venue: "Tebing Senja, Uluwatu" },
        { name: "DINNER", date: "Sabtu, 16 Januari 2027", time: "18.30 - 21.00 WITA", venue: "Tebing Senja, Uluwatu" },
      ],
      wish: ["Ikut berbahagia untuk kalian berdua,", "semoga dimudahkan sampai hari H."],
    },
  },
  {
    slug: "petite-soiree",
    kind: "birthday",
    motif: "confetti",
    seed: 77,
    palette: { bg: "#F0DCD2", bgLight: "#F9EEE8", ink: "#5A3B4B", accent: "#B4787F", soft: "#E8B9A6", leaf: "#C9A25E", card: "#FFFFFF", onAccent: "#FFF7F3", dark: false },
    copy: {
      eyebrow: "YOU ARE INVITED TO",
      title: "Alya",
      subtitle: "turns seven",
      initials: ["A"],
      date: "20 . 06 . 2027",
      place: "SURABAYA",
      profileLabel: "BIRTHDAY GIRL",
      profileTitle: "Pesta Ulang Tahun",
      profileLines: ["Putri dari Bpk. Kevin & Ibu Clara", "yang ke-7 tahun"],
      profileButton: "IKUT MERAYAKAN",
      eventLabel: "JOIN THE PARTY",
      eventTitle: "Detail Acara",
      events: [
        { name: "TIUP LILIN", date: "Minggu, 20 Juni 2027", time: "15.00 - 16.00 WIB", venue: "Taman Kecil Cafe, Surabaya" },
        { name: "GAMES & DINNER", date: "Minggu, 20 Juni 2027", time: "16.00 - 18.00 WIB", venue: "Taman Kecil Cafe, Surabaya" },
      ],
      wishName: "Tante Mira",
      wish: ["Selamat ulang tahun Alya, semoga sehat", "selalu dan makin pintar."],
    },
  },
  {
    slug: "monogram-gala",
    kind: "corporate",
    motif: "deco",
    seed: 88,
    palette: { bg: "#23211E", bgLight: "#33302B", ink: "#F1E9DA", accent: "#CDB386", soft: "#4A443B", leaf: "#CDB386", card: "#000000", onAccent: "#221F1B", dark: true },
    copy: {
      eyebrow: "ANNUAL GALA DINNER",
      title: "Arunika Group",
      subtitle: "Malam Apresiasi 2027",
      initials: ["A"],
      date: "12 . 12 . 2027",
      place: "JAKARTA",
      profileLabel: "TENTANG ACARA",
      profileTitle: "Satu Dekade Bersama",
      profileLines: ["Merayakan sepuluh tahun perjalanan", "bersama mitra dan rekan kerja"],
      profileButton: "KONFIRMASI HADIR",
      eventLabel: "RUNDOWN",
      eventTitle: "Susunan Acara",
      events: [
        { name: "REGISTRASI & COCKTAIL", date: "Minggu, 12 Desember 2027", time: "18.00 - 19.00 WIB", venue: "Grand Ballroom Arunika, Jakarta" },
        { name: "GALA DINNER", date: "Minggu, 12 Desember 2027", time: "19.00 - 22.00 WIB", venue: "Grand Ballroom Arunika, Jakarta" },
      ],
      wishName: "Divisi Pemasaran",
      wish: ["Terima kasih atas sepuluh tahun yang", "luar biasa. Sampai jumpa di malam gala."],
    },
  },
  {
    slug: "lumiere-classic",
    kind: "wedding",
    motif: "classic",
    seed: 99,
    palette: { bg: "#F4EFE6", bgLight: "#FBF8F2", ink: "#2E2A26", accent: "#8C7A5B", soft: "#E2D8C6", leaf: "#8C7A5B", card: "#FFFFFF", onAccent: "#FFFCF6", dark: false },
    copy: {
      ...wedding(["Galih", "Ratna"], [["Putra dari Bpk. Sutrisno", "& Ibu Endang"], ["Putri dari Bpk. Mulyadi", "& Ibu Sri"]], "30 . 10 . 2027", "SEMARANG"),
      events: [
        { name: "AKAD NIKAH", date: "Sabtu, 30 Oktober 2027", time: "08.00 - 10.00 WIB", venue: "Gedung Lumiere, Semarang" },
        { name: "RESEPSI", date: "Sabtu, 30 Oktober 2027", time: "11.00 - 13.00 WIB", venue: "Gedung Lumiere, Semarang" },
      ],
    },
  },
];

/* ---------- composites ---------- */

async function render(svg, file, { width, quality = 84 } = {}) {
  let img = sharp(Buffer.from(svg));
  if (width) img = img.resize({ width });
  await img.webp({ quality }).toFile(file);
}

async function png(svg, width) {
  let img = sharp(Buffer.from(svg));
  if (width) img = img.resize({ width });
  return img.png().toBuffer();
}

/** Kartu cetak + bayangan lembut, diputar. */
async function cardLayer(coverSvgText, width, angle) {
  const height = Math.round(width * 1.25);
  const pad = 70;
  const card = await png(coverSvgText, width);
  const shadowSvg = svgDoc(width + pad * 2, height + pad * 2,
    `<filter id="s" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="22"/></filter>`,
    `<rect x="${pad + 6}" y="${pad + 26}" width="${width - 12}" height="${height - 10}" fill="#4A3527" opacity="0.32" filter="url(#s)"/>`);
  const layer = await sharp(Buffer.from(shadowSvg))
    .composite([{ input: card, left: pad, top: pad }])
    .png()
    .toBuffer();
  return sharp(layer).rotate(angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
}

/** Mockup ponsel berisi layar undangan. */
async function phoneLayer(screenSvgText, width, angle = 0) {
  const height = Math.round(width * 2.05);
  const bezel = Math.round(width * 0.045);
  const radius = Math.round(width * 0.14);
  const pad = 80;
  const screenW = width - bezel * 2;
  const screenH = height - bezel * 2;
  const screen = await sharp(Buffer.from(screenSvgText))
    .resize({ width: screenW, height: screenH, fit: "cover", position: "centre" })
    .png()
    .toBuffer();
  const mask = Buffer.from(svgDoc(screenW, screenH, "", `<rect width="${screenW}" height="${screenH}" rx="${radius - bezel}" fill="#fff"/>`));
  const roundedScreen = await sharp(screen).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  const frameSvg = svgDoc(width + pad * 2, height + pad * 2,
    `<filter id="s" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="26"/></filter>
     <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3A332E"/><stop offset="1" stop-color="#1F1B18"/></linearGradient>`,
    `<rect x="${pad + 10}" y="${pad + 36}" width="${width - 20}" height="${height - 16}" rx="${radius}" fill="#3B2A20" opacity="0.38" filter="url(#s)"/>
     <rect x="${pad}" y="${pad}" width="${width}" height="${height}" rx="${radius}" fill="url(#metal)"/>
     <rect x="${pad + 2}" y="${pad + 2}" width="${width - 4}" height="${height - 4}" rx="${radius - 2}" fill="none" stroke="#6B5E54" stroke-width="2" opacity="0.6"/>`);
  const island = Buffer.from(svgDoc(width, 60, "", `<rect x="${width / 2 - width * 0.14}" y="0" width="${width * 0.28}" height="${Math.round(width * 0.075)}" rx="${width * 0.0375}" fill="#141110"/>`));
  const layer = await sharp(Buffer.from(frameSvg))
    .composite([
      { input: roundedScreen, left: pad + bezel, top: pad + bezel },
      { input: island, left: pad, top: pad + bezel + Math.round(width * 0.03) },
    ])
    .png()
    .toBuffer();
  if (!angle) return layer;
  return sharp(layer).rotate(angle, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
}

function linenBackground(w, h, from = "#EADFD0", to = "#F6F0E7") {
  return svgDoc(w, h,
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${to}"/><stop offset="1" stop-color="${from}"/></linearGradient>
     <radialGradient id="light" cx="30%" cy="20%" r="70%"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.55"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
     ${grainFilter("grain", 0.09)}`,
    `<rect width="${w}" height="${h}" fill="url(#bg)"/><rect width="${w}" height="${h}" fill="url(#light)"/><rect width="${w}" height="${h}" filter="url(#grain)"/>`);
}

async function meta(buf) {
  const m = await sharp(buf).metadata();
  return { w: m.width ?? 0, h: m.height ?? 0 };
}

async function placeCentered(buf, cx, cy) {
  const { w, h } = await meta(buf);
  return { input: buf, left: Math.round(cx - w / 2), top: Math.round(cy - h / 2) };
}

async function heroComposite(byslug) {
  const w = 1200;
  const h = 1500;
  const back = await cardLayer(coverSvg(byslug["kawung-heritage"]), 470, -10);
  const right = await cardLayer(coverSvg(byslug["sage-botanica"]), 440, 8);
  const phone = await phoneLayer(coverSvg(byslug["elegant-rose"]), 430, -3);
  const layers = [
    await placeCentered(back, 360, 600),
    await placeCentered(right, 860, 1010),
    await placeCentered(phone, 610, 780),
  ];
  // Sprig kecil sebagai aksen.
  const sprigSvg = svgDoc(w, h, "", sprig(980, 420, 260, 28, { leaf: "#8E9C83" }, -1) + sprig(230, 1290, 220, -40, { leaf: "#8E9C83" }, 1));
  layers.unshift({ input: await png(sprigSvg), left: 0, top: 0 });
  await sharp(Buffer.from(linenBackground(w, h)))
    .composite(layers)
    .webp({ quality: 84 })
    .toFile(path.join(OUT_SEED, "hero", "hero.webp"));
}

async function aboutComposite(byslug) {
  const w = 1200;
  const h = 1500;
  const envelope = svgDoc(w, h,
    `<filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="20"/></filter>`,
    `<g transform="rotate(-6 600 900)">
       <rect x="200" y="640" width="820" height="560" rx="10" fill="#4A3527" opacity="0.25" filter="url(#s)"/>
       <rect x="190" y="610" width="820" height="560" rx="10" fill="#E9DCC8"/>
       <path d="M190 610 L600 900 L1010 610" fill="none" stroke="#CDB99C" stroke-width="3"/>
       <circle cx="600" cy="900" r="46" fill="#9C6B4A"/>
       <circle cx="600" cy="900" r="34" fill="none" stroke="#C99A73" stroke-width="2"/>
     </g>`);
  const card = await cardLayer(coverSvg(byslug["noor-sakinah"]), 470, 5);
  const small = await cardLayer(coverSvg(byslug["ivory-promise"]), 330, -14);
  await sharp(Buffer.from(linenBackground(w, h, "#E4D7C5", "#F3ECE1")))
    .composite([
      { input: await png(envelope), left: 0, top: 0 },
      await placeCentered(small, 330, 520),
      await placeCentered(card, 700, 690),
    ])
    .webp({ quality: 84 })
    .toFile(path.join(OUT_SEED, "about", "about.webp"));
}

async function categoryImages(byslug) {
  const size = 1200;
  const make = async (slug, motifSvg, palette) => {
    const p = palette;
    const svg = svgDoc(size, size,
      `<radialGradient id="g" cx="62%" cy="38%" r="80%"><stop offset="0" stop-color="${p.bgLight}"/><stop offset="1" stop-color="${p.bg}"/></radialGradient>${grainFilter("grain", p.dark ? 0.1 : 0.07)}`,
      `<rect width="${size}" height="${size}" fill="url(#g)"/>${motifSvg}<rect width="${size}" height="${size}" filter="url(#grain)"/>`);
    await render(svg, path.join(OUT_SEED, "categories", `${slug}.webp`));
  };

  const rose = byslug["elegant-rose"].palette;
  let floral = "";
  const spots = [[760, 330, 120, 0], [930, 470, 90, 30], [620, 470, 80, 50], [840, 640, 70, 10], [1040, 280, 60, 20]];
  for (const [x, y, r] of spots) floral += leaf(x - r, y + r * 0.4, r * 0.7, r * 0.26, -55, rose.leaf, 0.7) + leaf(x + r, y + r * 0.5, r * 0.7, r * 0.26, 55, rose.leaf, 0.7);
  for (const [x, y, r, rot] of spots) floral += flower(x, y, r, rose.soft, rose.accent, rot);
  await make("wedding", floral, rose);

  const ivory = byslug["ivory-promise"].palette;
  await make("engagement", `<g transform="translate(220 -40) scale(2.1)">${rings(300, 250, 80, ivory.accent)}</g>`, ivory);

  const petite = byslug["petite-soiree"].palette;
  await make("birthday", confetti(5, petite, size, size, 120) + balloon(760, 360, 150, petite.soft, petite.ink) + balloon(980, 470, 120, petite.accent, petite.ink), petite);

  const noor = byslug["noor-sakinah"].palette;
  let stars = "";
  for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) stars += star8(150 + x * 240 + (y % 2) * 120, 150 + y * 240, 52, noor.accent, "none", 2);
  await make("islamic", `<g opacity="0.85">${stars}</g>${mihrab(520, 260, 520, 940, noor.accent, 4)}`, noor);

  const gala = byslug["monogram-gala"].palette;
  await make("corporate", `<g transform="translate(160 260)">${decoFan(600, 520, 460, gala.accent, 1)}</g>${decoFan(780, 1180, 320, gala.accent, -1)}`, gala);
}

async function ogImage(byslug) {
  const w = 1200;
  const h = 630;
  const ink = "#2B2522";
  const gold = "#9A7A45";
  const text = svgDoc(w, h, "",
    T("serifSemi", "Heaven Inv", { x: 90, y: 300, size: 104, anchor: "start", fill: ink }) +
      T("serifItalic", "Your story, beautifully invited.", { x: 92, y: 370, size: 42, anchor: "start", fill: ink, opacity: 0.8 }) +
      `<line x1="92" y1="420" x2="252" y2="420" stroke="${gold}" stroke-width="2"/>` +
      T("sansMedium", "KATALOG UNDANGAN DIGITAL PREMIUM", { x: 92, y: 470, size: 20, anchor: "start", tracking: 0.28, fill: gold }));
  const a = await cardLayer(coverSvg(byslug["elegant-rose"]), 250, -7);
  const b = await cardLayer(coverSvg(byslug["noor-sakinah"]), 250, 6);
  await sharp(Buffer.from(linenBackground(w, h, "#EADFD0", "#FAF7F2")))
    .composite([await placeCentered(a, 860, 320), await placeCentered(b, 1040, 330), { input: await png(text), left: 0, top: 0 }])
    .jpeg({ quality: 86 })
    .toFile(path.join(OUT_BRAND, "og-default.jpg"));
}

async function favicon() {
  const s = 512;
  const svg = svgDoc(s, s, "",
    `<rect width="${s}" height="${s}" rx="112" fill="#6B4F3A"/>
     <circle cx="256" cy="256" r="196" fill="none" stroke="#D8BE8C" stroke-width="6" opacity="0.8"/>
     ${T("serifSemi", "H", { x: 238, y: 340, size: 260, fill: "#FAF7F2" })}
     ${T("serifItalic", "i", { x: 352, y: 340, size: 170, fill: "#D8BE8C" })}`);
  await sharp(Buffer.from(svg)).png().toFile(path.join(OUT_BRAND, "favicon.png"));
  await sharp(Buffer.from(svg)).resize(180).png().toFile(path.join(OUT_BRAND, "apple-touch-icon.png"));
}

/* ---------- main ---------- */

async function main() {
  for (const dir of ["templates", "hero", "about", "categories"]) {
    await mkdir(path.join(OUT_SEED, dir), { recursive: true });
  }
  await mkdir(OUT_BRAND, { recursive: true });

  const byslug = Object.fromEntries(TEMPLATES.map((t) => [t.slug, t]));
  for (const t of TEMPLATES) {
    const dir = path.join(OUT_SEED, "templates", t.slug);
    await mkdir(dir, { recursive: true });
    await render(coverSvg(t), path.join(dir, "cover.webp"));
    await render(profileSvg(t), path.join(dir, "profile.webp"));
    await render(eventSvg(t), path.join(dir, "event.webp"));
    await render(gallerySvg(t), path.join(dir, "gallery.webp"));
    console.log("template", t.slug);
  }
  await heroComposite(byslug);
  await aboutComposite(byslug);
  await categoryImages(byslug);
  await ogImage(byslug);
  await favicon();
  console.log("done");
}

export { coverSvg, profileSvg, eventSvg, gallerySvg, TEMPLATES };

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
