// ===== LOGIC (pure, testable) =====
const DEFAULT_CONFIG = {
  commune_title: "COMMUNE D'ASSA - ABATTOIR",
  tax_parts: [0.3, 0.7, 0.35],
  tax_labels: ["Transport de viandes", "Taxe principale d'abattage", "Surtaxe d'abattage (bienfaisance)"],
  qarjouta_label: "Retour sur recettes realisees pour le compte des tiers (Qarjouta)",
  qarjouta_after: 2,
  extra_head_fee: 0,
  admin_pin: "",
  butchers: ["Houssa Hammad","Houssa Abdelnaser","Bouhouch Hassan","Addi Hicham","Addi Abdelwahab","Houssa Khalid","Houssa Hamid","Houssa Choiaib","Oubihi Lahoucine","Hamati Mourad","Taleb Hani","Ihchach Aomar","Bachia Elbachir","Bouhouch Abdessamad","Yassin Ahmed","Houssa Abdelatif","Nessi Yahya","Bouhouch Sliman"],
  animals: [
    {name:"Camelin (Chameau)", normal_head_price:50, special_head_price:50},
    {name:"Bovin (Boeuf)", normal_head_price:40, special_head_price:40},
    {name:"Ovin (Mouton)", normal_head_price:7, special_head_price:20},
    {name:"Caprin (Chevre)", normal_head_price:6, special_head_price:20}
  ]
};

const r2 = x => Math.round((x + 1e-9) * 100) / 100;
const f2 = x => Number(x).toFixed(2);
const g = x => String(parseFloat(Number(x).toPrecision(6)));       // comme {:g} de Python
const num = s => parseFloat(String(s).replace(",", "."));
const sum = (a, f) => a.reduce((t, x) => t + f(x), 0);

function normalizeConfig(c) {
  const butchers = (c.butchers || []).map(s => String(s).trim()).filter(Boolean);
  if (!butchers.length) throw new Error("liste des bouchers vide");
  const animals = (c.animals || []).map(a => ({
    name: String(a.name).trim(),
    normal_head_price: Number(a.normal_head_price),
    special_head_price: Number(a.special_head_price)
  }));
  if (!animals.length) throw new Error("liste des animaux vide");
  animals.forEach(a => {
    if (!a.name || !(a.normal_head_price >= 0) || !(a.special_head_price >= 0))
      throw new Error("prix invalide pour : " + (a.name || "(sans nom)"));
  });
  const tax_parts = (c.tax_parts || []).map(Number);
  if (!tax_parts.length || tax_parts.some(t => !(t >= 0))) throw new Error("taxes invalides");
  let labels = (c.tax_labels || []).map(s => String(s).trim());
  while (labels.length < tax_parts.length) labels.push("Taxe " + (labels.length + 1));
  labels = labels.slice(0, tax_parts.length);
  const extra = Number(c.extra_head_fee || 0);
  if (!(extra >= 0)) throw new Error("supplement invalide");
  const qa = parseInt(c.qarjouta_after === undefined ? 2 : c.qarjouta_after, 10);
  return {
    commune_title: String(c.commune_title || DEFAULT_CONFIG.commune_title).trim(),
    butchers, animals, tax_parts, tax_labels: labels,
    qarjouta_label: String(c.qarjouta_label || DEFAULT_CONFIG.qarjouta_label).trim(),
    qarjouta_after: isNaN(qa) ? 2 : qa,
    extra_head_fee: extra,
    admin_pin: String(c.admin_pin || "").trim()
  };
}

const taxPerKg = cfg => sum(cfg.tax_parts, x => x);

function calcFee(cfg, animal, heads, weight, special) {
  if (special) return r2(animal.special_head_price * heads);
  return r2(weight * taxPerKg(cfg) + (animal.normal_head_price + cfg.extra_head_fee) * heads);
}

function computeBreakdown(cfg, items, special) {
  if (special) {
    const heads = sum(items, i => i.heads);
    const amt = r2(sum(items, i => i.fee));
    return { lines: [["Droit d'abattage special", heads + " tete(s)", amt]], total: amt };
  }
  const weight = sum(items, i => i.weight);
  const taxes = cfg.tax_parts.map((rate, i) =>
    [cfg.tax_labels[i], f2(rate) + " DH x " + g(weight) + " kg", r2(rate * weight)]);
  const headsAmt = r2(sum(items, i => i.heads * (i.head_price + cfg.extra_head_fee)));
  const q = [cfg.qarjouta_label,
    items.map(i => i.heads + " x " + g(i.head_price + cfg.extra_head_fee)).join(" + "), headsAmt];
  const k = Math.max(0, Math.min(cfg.qarjouta_after, taxes.length));
  const lines = taxes.slice(0, k).concat([q], taxes.slice(k));
  return { lines, total: r2(sum(lines, l => l[2])) };
}

function pad2(n) { return String(n).padStart(2, "0"); }
function stamp(d) {
  return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()) + " " +
    pad2(d.getHours()) + ":" + pad2(d.getMinutes()) + ":" + pad2(d.getSeconds());
}
function nextTicketNo(tickets, d) {
  const day = stamp(d).slice(0, 10);
  const n = tickets.filter(t => t.ts.startsWith(day)).length + 1;
  return day.replace(/-/g, "") + "-" + String(n).padStart(3, "0");
}

// form = {category:"1"|"2", butcher:"idx", custom:"", rows:[{animal:"idx",heads:"1",weight:""}]}
function makeTicket(cfg, form, tickets, now) {
  const errors = [], special = form.category === "2";
  const butcher = special ? (form.redevable || "").trim() : cfg.butchers[parseInt(form.butcher, 10)];
  if (!butcher) errors.push(special ? "Entrez le nom du redevable." : "Boucher invalide.");
  const items = [];
  form.rows.forEach((r, i) => {
    const n = i + 1, animal = cfg.animals[parseInt(r.animal, 10)];
    if (!animal) { errors.push("Ligne " + n + " : animal invalide."); return; }
    const heads = parseInt(r.heads, 10);
    if (!(heads >= 1) || String(heads) !== String(r.heads).trim()) { errors.push("Ligne " + n + " : nombre de tetes invalide (>= 1)."); return; }
    let weight = 0;
    if (!special) {
      weight = num(r.weight);
      if (!(weight >= 0)) { errors.push("Ligne " + n + " : poids invalide."); return; }
    }
    items.push({ name: animal.name, heads, weight, fee: calcFee(cfg, animal, heads, weight, special),
                 head_price: animal.normal_head_price });
  });
  if (!items.length && !errors.length) errors.push("Ajoutez au moins un animal.");
  if (errors.length) return { errors };
  const bd = computeBreakdown(cfg, items, special);
  const diff = r2(bd.total - sum(items, i => i.fee));
  if (diff) items[items.length - 1].fee = r2(items[items.length - 1].fee + diff);
  return { ticket: {
    no: nextTicketNo(tickets, now), ts: stamp(now), butcher, special, redevable: special,
    custom: (form.custom || "").trim(), title: cfg.commune_title,
    items, lines: bd.lines, total: bd.total } };
}

