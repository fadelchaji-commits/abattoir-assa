// ---------- Prix ----------
function pinField() { return cfg.admin_pin ? '<label>Code<input type="password" id="pin" inputmode="numeric"></label>' : ""; }
function pinOK() { return !cfg.admin_pin || ($("pin") && $("pin").value.trim() === cfg.admin_pin); }
function viewPrices(m, errs) {
  $("app").innerHTML = '<div class="card"><h3>Modifier les prix</h3>' + msg("ok", m) + (errs || []).map(e => msg("err", e)).join("") +
    cfg.animals.map(a => '<div class="arow pa"><label>Animal<input type="text" name="name" value="' + esc(a.name) + '"></label><div class="two"><label>Qarjouta / tete normal (DH)<input type="text" inputmode="decimal" name="normal" value="' + g(a.normal_head_price) + '"></label><label>Prix/tete special (DH)<input type="text" inputmode="decimal" name="special" value="' + g(a.special_head_price) + '"></label></div><label class="inl"><input type="checkbox" name="delete"> Supprimer cet animal</label></div>').join("") +
    '<div class="arow pa"><label>Nouvel animal (optionnel)<input type="text" name="name" placeholder="ex: Ane"></label><div class="two"><label>Prix normal<input type="text" inputmode="decimal" name="normal" value="0"></label><label>Prix special<input type="text" inputmode="decimal" name="special" value="0"></label></div></div>' +
    "<h4>Taxes par kg net</h4>" +
    cfg.tax_parts.map((r, i) => '<div class="arow two tx"><label>Nom<input type="text" name="tl" value="' + esc(cfg.tax_labels[i]) + '"></label><label>DH / kg<input type="text" inputmode="decimal" name="tr" value="' + g(r) + '"></label></div>').join("") +
    '<div class="arow two tx"><label>Nouvelle taxe (optionnel)<input type="text" name="tl"></label><label>DH / kg<input type="text" inputmode="decimal" name="tr"></label></div>' +
    '<p class="muted">Total actuel : ' + f2(taxPerKg(cfg)) + " DH / kg</p>" +
    '<label>Supplement par tete (normal) - laisser 0<input type="text" inputmode="decimal" id="extra" value="' + g(cfg.extra_head_fee) + '"></label>' +
    pinField() + '<button onclick="savePrices()">Enregistrer les prix</button></div>';
}
function savePrices() {
  if (!pinOK()) return viewPrices(null, ["Code incorrect."]);
  const errs = [], animals = [];
  document.querySelectorAll(".pa").forEach(r => {
    const name = r.querySelector("[name=name]").value.trim(), del = r.querySelector("[name=delete]");
    if (!name || (del && del.checked)) return;
    const n = num(r.querySelector("[name=normal]").value), s = num(r.querySelector("[name=special]").value);
    if (!(n >= 0) || !(s >= 0)) { errs.push("Prix invalide pour : " + name); return; }
    animals.push({ name, normal_head_price: n, special_head_price: s });
  });
  const tp = [], tl = [];
  document.querySelectorAll(".tx").forEach(r => {
    const l = r.querySelector("[name=tl]").value.trim(), v = r.querySelector("[name=tr]").value.trim();
    if (!l && !v) return; const x = num(v);
    if (!l || !(x >= 0)) { errs.push("Taxe invalide : " + (l || "(sans nom)")); return; }
    tp.push(x); tl.push(l);
  });
  const extra = num($("extra").value || "0");
  if (!(extra >= 0)) errs.push("Supplement invalide.");
  if (errs.length) return viewPrices(null, errs);
  try { cfg = normalizeConfig(Object.assign({}, cfg, { animals, tax_parts: tp, tax_labels: tl, extra_head_fee: extra })); }
  catch (e) { return viewPrices(null, [e.message]); }
  saveCfg(); draft = null; viewPrices("Prix enregistres. Ils s'appliquent aux prochains tickets.");
}

