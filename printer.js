// ===== ESC/POS =====
function ascii(s) {
  return String(s).replace(/[\u2018\u2019]/g, "'").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00b0/g, "o").replace(/[^\x20-\x7e]/g, "?");
}
function wrapText(text, w) {
  const out = []; let line = "";
  ascii(text).split(" ").forEach(word => {
    while (word.length > w) { if (line) { out.push(line); line = ""; } out.push(word.slice(0, w)); word = word.slice(w); }
    if (!line) line = word;
    else if ((line + " " + word).length <= w) line += " " + word;
    else { out.push(line); line = word; }
  });
  if (line || !out.length) out.push(line);
  return out;
}
// segment = {t, a:'l'|'c'|'r', b:bool, s:0|1(double)}
function renderTicket(t, W) {
  const seg = [], L = (text, o) => seg.push(Object.assign({ t: ascii(text), a: "l", b: false, s: 0 }, o || {}));
  const rule = c => L(c.repeat(W));
  L("ROYAUME DU MAROC", { a: "c", b: true });
  wrapText(t.custom ? "[ " + t.custom.toUpperCase() + " ]" : t.title, W).forEach(x => L(x, { a: "c", b: true }));
  rule("=");
  L("Ticket No : " + t.no);
  L("Date/Heure : " + t.ts);
  wrapText((t.special ? "Redevable : " : "Boucher : ") + t.butcher, W).forEach(x => L(x));
  L("Categorie : " + (t.special ? "Abattage Special (Fete)" : "Abattage Normal"));
  rule("-");
  t.items.forEach(it => {
    let txt = it.name + " : " + it.heads + " tete(s)";
    if (!t.special) txt += ", " + g(it.weight) + " kg";
    wrapText(txt, W).forEach(x => L(x, { b: true }));
  });
  rule("-");
  t.lines.forEach(([label, detail, amt]) => {
    wrapText(label, W).forEach(x => L(x, { b: true }));
    const a = f2(amt) + " DH";
    const d = detail ? "  " + ascii(detail) : "";
    if (d && d.length + a.length + 1 <= W) L(d + " ".repeat(W - d.length - a.length) + a);
    else {
      if (d) wrapText(detail, W - 2).forEach(x => L("  " + x));
      L(" ".repeat(Math.max(0, W - a.length)) + a);
    }
  });
  rule("=");
  L("TOTAL A PAYER", { a: "c", b: true });
  L(f2(t.total) + " DH", { a: "c", b: true, s: 1 });
  rule("=");
  return seg;
}
function previewText(seg, W) {
  return seg.map(s => {
    const w = s.s ? Math.floor(W / 2) : W, t = s.t;
    if (s.a === "c") return " ".repeat(Math.max(0, Math.floor((w - t.length) / 2))) + t;
    if (s.a === "r") return " ".repeat(Math.max(0, w - t.length)) + t;
    return t;
  }).join("\n");
}
function rasterEscPos(logo) {            // image 1 bit -> GS v 0, par bandes de 128 lignes
  const raw = atob(logo.b64), bw = Math.ceil(logo.w / 8), o = [0x1b, 0x61, 1];
  for (let y = 0; y < logo.h; y += 128) {
    const n = Math.min(128, logo.h - y);
    o.push(0x1d, 0x76, 0x30, 0x00, bw & 255, bw >> 8, n & 255, n >> 8);
    for (let i = y * bw; i < (y + n) * bw; i++) o.push(raw.charCodeAt(i));
  }
  o.push(0x0a, 0x1b, 0x61, 0);
  return o;
}
function encodeEscPos(seg, cut, feed, logo) {
  const b = [0x1b, 0x40];                       // ESC @ : initialisation
  if (logo && logo.b64) rasterEscPos(logo).forEach(x => b.push(x));
  seg.forEach(s => {
    b.push(0x1b, 0x61, s.a === "c" ? 1 : s.a === "r" ? 2 : 0);   // alignement
    b.push(0x1b, 0x45, s.b ? 1 : 0);                             // gras
    b.push(0x1d, 0x21, s.s ? 0x11 : 0);                          // double taille
    for (const ch of s.t) b.push(ch.charCodeAt(0));
    b.push(0x0a);
  });
  b.push(0x1b, 0x45, 0, 0x1d, 0x21, 0, 0x1b, 0x61, 0);
  b.push(0x1b, 0x64, feed === undefined ? 5 : feed);   // avance du papier jusqu'au couteau
  const C = { gs66: [0x1d, 0x56, 0x42, 0x00], gs65: [0x1d, 0x56, 0x41, 0x00], gs0: [0x1d, 0x56, 0x00],
              gs1: [0x1d, 0x56, 0x01], esci: [0x1b, 0x69], escm: [0x1b, 0x6d], none: [] };
  (C[cut || "gs66"] || C.gs66).forEach(x => b.push(x));     // commande de coupe
  return b;
}
function toBase64(bytes) { let s = ""; bytes.forEach(x => s += String.fromCharCode(x)); return btoa(s); }
function rawbtUrl(bytes) {
  return "intent:base64," + toBase64(bytes) + "#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;";
}
function csvOf(tickets) {
  const q = v => '"' + String(v).replace(/"/g, '""') + '"';
  const rows = [["N°","Date","Boucher","Animal","Tetes","Poids_kg","Categorie","Total_DH"]];
  tickets.forEach(t => t.items.forEach(it =>
    rows.push([t.no, t.ts, t.butcher, it.name, it.heads, it.weight, t.special ? "Special" : "Normal", f2(it.fee)])));
  return "\ufeff" + rows.map(r => r.map(q).join(",")).join("\r\n") + "\r\n";
}
