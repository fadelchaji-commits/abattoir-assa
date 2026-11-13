// ===== UI =====
const KEY_LOGO = "abattoir_logo", KEY_CFG = "abattoir_cfg", KEY_TK = "abattoir_tickets", KEY_PREF = "abattoir_prefs";
const mem = {}; let storageOK = true;
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { storageOK = false; return mem[k] === undefined ? null : mem[k]; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { storageOK = false; mem[k] = v; } }
};
function loadJSON(k, d) { try { const v = store.get(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
let cfg, tickets, prefs;
try { cfg = normalizeConfig(loadJSON(KEY_CFG, DEFAULT_CONFIG)); } catch (e) { cfg = normalizeConfig(DEFAULT_CONFIG); }
tickets = loadJSON(KEY_TK, []);
prefs = Object.assign({ mode: "rawbt", autoprint: true, chars: 48, cut: "gs66", feed: 5, logoOn: true, logoW: 200, logoT: 160, logoM: "dither", noDefault: false }, loadJSON(KEY_PREF, {}));
let logo = loadJSON(KEY_LOGO, null); if (logo && !logo.b64) logo = null;
const saveCfg = () => store.set(KEY_CFG, JSON.stringify(cfg));
const saveTk = () => store.set(KEY_TK, JSON.stringify(tickets));
const savePrefs = () => store.set(KEY_PREF, JSON.stringify(prefs));

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
let view = "ticket", draft = null, lastNo = null, flash = null;

function setHeadLogo() { const i = $("hlogo"); if (!i) return; if (logo && prefs.logoOn) { i.src = logo.src; i.style.display = "block"; } else i.style.display = "none"; }
function show(v, no) {
  setHeadLogo();
  view = v; if (no) lastNo = no;
  document.querySelectorAll("nav a").forEach(a => a.classList.toggle("on", a.dataset.v === (v === "result" ? "ticket" : v)));
  ({ ticket: viewTicket, result: viewResult, report: viewReport, prices: viewPrices, settings: viewSettings })[v]();
  window.scrollTo(0, 0);
}
function msg(type, text) { return text ? '<div class="' + type + '">' + esc(text) + "</div>" : ""; }

// ---------- impression ----------
function bytesFor(t) { return encodeEscPos(renderTicket(t, prefs.chars), prefs.cut, prefs.feed, prefs.logoOn ? logo : null); }
let usb = null;
async function usbConnect() {
  if (!navigator.usb) throw new Error("WebUSB indisponible : utilisez Chrome, ou choisissez RawBT.");
  const d = await navigator.usb.requestDevice({ filters: [] });
  await d.open(); if (!d.configuration) await d.selectConfiguration(1);
  let found = null;
  for (const i of d.configuration.interfaces) for (const a of i.alternates) {
    const ep = a.endpoints.find(e => e.direction === "out" && e.type === "bulk");
    if (ep && (a.interfaceClass === 7 || !found)) found = { n: i.interfaceNumber, ep: ep.endpointNumber };
  }
  if (!found) throw new Error("Aucune sortie USB trouvee sur cet appareil.");
  await d.claimInterface(found.n);
  usb = { d, ep: found.ep };
}
async function usbSend(bytes) {
  if (!usb) await usbConnect();
  await usb.d.transferOut(usb.ep, new Uint8Array(bytes));
}
function sendBytes(bytes) {
  if (prefs.mode === "usb") { usbSend(bytes).catch(e => { usb = null; alert("Impression USB : " + e.message); }); }
  else window.location.href = rawbtUrl(bytes);
}
function printTicket(no) { const t = tickets.find(x => x.no === no); if (t) sendBytes(bytesFor(t)); }
function testPrint() {
  const W = prefs.chars, seg = [];
  const L = (t, o) => seg.push(Object.assign({ t, a: "l", b: false, s: 0 }, o || {}));
  L("TEST IMPRESSION", { a: "c", b: true, s: 1 }); L("=".repeat(W)); L("Concord CP-500 - " + W + " colonnes");
  L("0123456789".repeat(5).slice(0, W)); L("Ligne normale"); L("Ligne grasse", { b: true });
  sendBytes(encodeEscPos(seg, prefs.cut, prefs.feed, prefs.logoOn ? logo : null));
}

