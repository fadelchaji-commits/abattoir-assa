// ---------- Reglages ----------
function viewSettings(m, errs) {
  $("app").innerHTML = '<div class="card"><h3>Impression</h3>' + msg("ok", m) + (errs || []).map(e => msg("err", e)).join("") +
    '<label>Mode<select id="pmode"><option value="rawbt"' + (prefs.mode === "rawbt" ? " selected" : "") + '>RawBT (recommande)</option><option value="usb"' + (prefs.mode === "usb" ? " selected" : "") + '>USB direct (essai)</option></select></label>' +
    '<label>Largeur du ticket<select id="pchars"><option value="48"' + (prefs.chars === 48 ? " selected" : "") + '>80 mm - 48 colonnes</option><option value="42"' + (prefs.chars === 42 ? " selected" : "") + '>80 mm - 42 colonnes</option><option value="32"' + (prefs.chars === 32 ? " selected" : "") + '>58 mm - 32 colonnes</option></select></label>' +
    '<label>Coupe du ticket<select id="pcut">' + [["gs66","Coupe partielle (GS V 66) - defaut"],["gs0","Coupe totale (GS V 0)"],["gs1","Coupe partielle (GS V 1)"],["gs65","Coupe totale + avance (GS V 65)"],["esci","ESC i"],["escm","ESC m"],["none","Aucune coupe"]].map(c => '<option value="' + c[0] + '"' + (prefs.cut === c[0] ? " selected" : "") + ">" + c[1] + "</option>").join("") + '</select></label>' +
    '<label>Lignes avant la coupe (avance du papier)<input type="number" id="pfeed" min="0" max="20" value="' + prefs.feed + '"></label>' +
    '<label class="inl"><input type="checkbox" id="pauto"' + (prefs.autoprint ? " checked" : "") + '> Imprimer automatiquement a la creation</label>' +
    '<button onclick="savePref()">Enregistrer</button><button class="blue" onclick="savePref(true)">Enregistrer et imprimer un test avec coupe</button>' +
    '<button class="blue" onclick="usbConnect().then(()=>alert(\'Imprimante USB connectee\')).catch(e=>alert(e.message))">Connecter l\'imprimante USB (mode USB direct)</button></div>' +
    logoCard() + '<div class="card"><h3>Commune et bouchers</h3><label>Titre du ticket<input type="text" id="stitle" value="' + esc(cfg.commune_title) + '"></label>' +
    '<label>Libelle de la Qarjouta<input type="text" id="sql" value="' + esc(cfg.qarjouta_label) + '"></label>' +
    '<label>Qarjouta apres N lignes de taxes<input type="number" id="sqa" min="0" value="' + cfg.qarjouta_after + '"></label>' +
    '<label>Bouchers (un par ligne)<textarea id="sbut" rows="8">' + esc(cfg.butchers.join("\n")) + "</textarea></label>" +
    '<label>Nouveau code pour modifier les prix (vide = inchange)<input type="password" id="snp" inputmode="numeric"></label>' +
    pinField().replace('id="pin"', 'id="pin"') + '<button onclick="saveSettings()">Enregistrer</button></div>' +
    '<div class="card"><h3>Donnees</h3><p class="muted">' + tickets.length + " ticket(s) enregistre(s) sur ce telephone." + (storageOK ? "" : " ATTENTION : stockage indisponible, exportez souvent.") + "</p>" +
    '<button onclick="download(\'registre.csv\', csvOf(tickets), \'text/csv\')">Exporter tout le registre (CSV)</button>' +
    '<button class="blue" onclick="download(\'sauvegarde_abattoir.json\', JSON.stringify({cfg, tickets}), \'application/json\')">Sauvegarde complete (JSON)</button>' +
    '<label>Restaurer une sauvegarde ou importer config.json<input type="file" id="sfile" accept=".json,application/json" onchange="importFile(this)"></label></div>';
}
function savePref(test) {
  prefs.mode = $("pmode").value; prefs.chars = parseInt($("pchars").value, 10); prefs.autoprint = $("pauto").checked; prefs.cut = $("pcut").value; prefs.feed = Math.max(0, Math.min(20, parseInt($("pfeed").value, 10) || 0)); savePrefs();
  if (test) testPrint(); else viewSettings("Reglages d'impression enregistres.");
}
function saveSettings() {
  if (!pinOK()) return viewSettings(null, ["Code incorrect."]);
  try {
    const np = $("snp").value.trim();
    cfg = normalizeConfig(Object.assign({}, cfg, {
      commune_title: $("stitle").value, qarjouta_label: $("sql").value, qarjouta_after: $("sqa").value,
      butchers: $("sbut").value.split("\n"), admin_pin: np || cfg.admin_pin }));
  } catch (e) { return viewSettings(null, [e.message]); }
  saveCfg(); draft = null; viewSettings("Reglages enregistres.");
}
function importFile(inp) {
  const f = inp.files[0]; if (!f) return; const rd = new FileReader();
  rd.onload = () => {
    try {
      const j = JSON.parse(String(rd.result).replace(/^\ufeff/, ""));
      if (j.cfg && Array.isArray(j.tickets)) {
        if (!confirm("Remplacer les donnees actuelles par cette sauvegarde ?")) return;
        cfg = normalizeConfig(j.cfg); tickets = j.tickets; saveCfg(); saveTk();
      } else {
        if (!confirm("Remplacer la configuration (prix, bouchers) par ce fichier ?")) return;
        cfg = normalizeConfig(Object.assign({}, j, { admin_pin: cfg.admin_pin })); saveCfg();
      }
      draft = null; viewSettings("Import reussi.");
    } catch (e) { viewSettings(null, ["Fichier invalide : " + e.message]); }
  };
  rd.readAsText(f);
}

