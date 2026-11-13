// ---------- Logo ----------
function loadImg(src) { return new Promise((ok, ko) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ko(new Error("Image illisible")); im.src = src; }); }
async function buildLogo(src, width, thr, mode) {
  const im = await loadImg(src), w = width, h = Math.max(1, Math.round(im.height * w / im.width));
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, w, h); x.imageSmoothingQuality = "high"; x.drawImage(im, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h).data, bw = Math.ceil(w / 8), out = new Array(bw * h).fill(0);
  const lum = new Float32Array(w * h), bias = thr - 160;
  for (let i = 0; i < w * h; i++) lum[i] = Math.max(0, Math.min(255, 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2] - (mode === "dither" ? bias : 0)));
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
    const i = yy * w + xx, old = lum[i];
    const black = mode === "dither" ? old < 128 : old < thr;
    if (black) out[yy * bw + (xx >> 3)] |= 0x80 >> (xx & 7);
    if (mode === "dither") {                      // Floyd-Steinberg
      const e = old - (black ? 0 : 255);
      if (xx + 1 < w) lum[i + 1] += e * 7 / 16;
      if (yy + 1 < h) { if (xx > 0) lum[i + w - 1] += e * 3 / 16; lum[i + w] += e * 5 / 16; if (xx + 1 < w) lum[i + w + 1] += e / 16; }
    }
  }
  let bin = ""; out.forEach(v => bin += String.fromCharCode(v));
  return { src, w, h, b64: btoa(bin) };
}
async function ensureLogo() {
  if (logo || prefs.noDefault) return;
  try { logo = await buildLogo(DEFAULT_LOGO_SRC, prefs.logoW, prefs.logoT, prefs.logoM); store.set(KEY_LOGO, JSON.stringify(logo)); } catch (e) {}
}
async function logoFile(inp) {
  const f = inp.files[0]; if (!f) return;
  try {
    const raw = await new Promise((ok, ko) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = ko; r.readAsDataURL(f); });
    const im = await loadImg(raw), sw = Math.min(576, im.width), sh = Math.round(im.height * sw / im.width);
    const c = document.createElement("canvas"); c.width = sw; c.height = sh;
    const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, sw, sh); x.drawImage(im, 0, 0, sw, sh);
    logo = await buildLogo(c.toDataURL("image/png"), prefs.logoW, prefs.logoT, prefs.logoM); prefs.noDefault = false;
    store.set(KEY_LOGO, JSON.stringify(logo)); prefs.logoOn = true; savePrefs(); viewSettings("Logo enregistre. Faites un test d'impression.");
  } catch (e) { viewSettings(null, ["Logo : " + e.message]); }
}
async function logoTune() {
  prefs.logoOn = $("lon").checked; prefs.logoW = parseInt($("lw").value, 10); prefs.logoT = parseInt($("lt").value, 10); prefs.logoM = $("lm").value; savePrefs();
  if (logo) { try { logo = await buildLogo(logo.src, prefs.logoW, prefs.logoT, prefs.logoM); store.set(KEY_LOGO, JSON.stringify(logo)); } catch (e) {} }
  viewSettings("Logo mis a jour.");
}
function logoDelete() { logo = null; prefs.noDefault = true; savePrefs(); store.set(KEY_LOGO, ""); viewSettings("Logo supprime."); }
async function logoDefault() { logo = null; prefs.noDefault = false; prefs.logoOn = true; savePrefs(); await ensureLogo(); viewSettings("Logo de la commune d'Assa remis."); }
function logoCard() {
  return '<div class="card"><h3>Logo de la commune</h3>' +
    (logo ? '<div style="text-align:center;background:#fff;padding:6px"><img src="' + logo.src + '" style="max-width:100%;max-height:140px"></div>' : '<p class="muted">Aucun logo.</p>') +
    '<label>Choisir une image (PNG / JPG)<input type="file" id="lfile" accept="image/*" onchange="logoFile(this)"></label>' +
    '<label>Rendu<select id="lm"><option value="dither"' + (prefs.logoM === "dither" ? " selected" : "") + '>Trame (details fidèles)</option><option value="bw"' + (prefs.logoM === "bw" ? " selected" : "") + '>Noir et blanc simple</option></select></label>' +
    '<label>Largeur sur le ticket<select id="lw">' + [200, 260, 320, 384, 450].map(v => '<option value="' + v + '"' + (prefs.logoW === v ? " selected" : "") + ">" + v + " points</option>").join("") + "</select></label>" +
    '<label>Contraste (noir/blanc) : plus haut = plus noir<input type="range" id="lt" min="70" max="230" value="' + prefs.logoT + '"></label>' +
    '<label class="inl"><input type="checkbox" id="lon"' + (prefs.logoOn ? " checked" : "") + '> Imprimer le logo en haut du ticket</label>' +
    '<button class="blue" onclick="logoTune()">Appliquer</button>' +
    '<button class="blue" onclick="logoDefault()">Remettre le logo de la commune d\'Assa</button>' +
    (logo ? '<button class="del" onclick="logoDelete()">Supprimer le logo</button>' : "") + "</div>";
}

