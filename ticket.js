// ---------- Ticket ----------
function newDraft() { return { category: "1", butcher: "0", custom: "", redevable: "", rows: [{ animal: "0", heads: "1", weight: "" }] }; }
function collectForm() {
  const rows = [...document.querySelectorAll(".arow")].map(r => ({
    animal: r.querySelector("select").value, heads: r.querySelector("[name=heads]").value,
    weight: r.querySelector("[name=weight]").value }));
  return { category: $("cat").value, butcher: $("butcher").value, redevable: $("redevable").value, custom: $("custom").value, rows };
}
function rowHtml(r) {
  return '<div class="arow"><label>Animal<select>' +
    cfg.animals.map((a, i) => '<option value="' + i + '"' + (String(i) === String(r.animal) ? " selected" : "") + ">" + esc(a.name) + "</option>").join("") +
    '</select></label><div class="two"><label>Nombre de tetes<input type="number" name="heads" min="1" inputmode="numeric" value="' + esc(r.heads) + '"></label>' +
    '<label class="wbox">Poids net (kg)<input type="text" name="weight" inputmode="decimal" value="' + esc(r.weight) + '"></label></div>' +
    '<button type="button" class="del" onclick="delRow(this)">Supprimer cette ligne</button></div>';
}
function viewTicket(errors) {
  draft = draft || newDraft();
  $("app").innerHTML = '<div class="card">' + msg("err", flash) +
    (errors || []).map(e => msg("err", e)).join("") +
    '<label>Categorie<select id="cat" onchange="toggleW()"><option value="1"' + (draft.category === "1" ? " selected" : "") + '>Abattage Normal</option><option value="2"' + (draft.category === "2" ? " selected" : "") + ">Abattage Special (Fetes / Mariages)</option></select></label>" +
    '<label id="butchbox">Boucher<select id="butcher">' + cfg.butchers.map((b, i) => '<option value="' + i + '"' + (String(i) === String(draft.butcher) ? " selected" : "") + ">" + esc(b) + "</option>").join("") + "</select></label>" +
    '<label id="redbox">Redevable (nom)<input type="text" id="redevable" placeholder="Nom du redevable" value="' + esc(draft.redevable || "") + '"></label>' +
    '<div id="rows">' + draft.rows.map(rowHtml).join("") + "</div>" +
    '<button type="button" class="add" onclick="addRow()">+ Ajouter un autre animal</button>' +
    '<label>Nom personnalise (optionnel)<input type="text" id="custom" value="' + esc(draft.custom) + '"></label>' +
    '<button type="button" onclick="createTicket()">Creer et imprimer le ticket</button></div>';
  flash = null; toggleW();
}
function toggleW() { const sp = $("cat").value === "2"; $("butchbox").style.display = sp ? "none" : "block"; $("redbox").style.display = sp ? "block" : "none"; document.querySelectorAll(".wbox").forEach(e => e.style.display = sp ? "none" : "block"); }
function addRow() { draft = collectForm(); draft.rows.push({ animal: "0", heads: "1", weight: "" }); viewTicket(); }
function delRow(b) { draft = collectForm(); if (draft.rows.length > 1) { const i = [...document.querySelectorAll(".arow")].indexOf(b.parentNode); draft.rows.splice(i, 1); } viewTicket(); }
function createTicket() {
  draft = collectForm();
  const r = makeTicket(cfg, draft, tickets.concat(deleted), new Date());
  if (r.errors) { viewTicket(r.errors); return; }
  tickets.push(r.ticket); saveTk(); draft = null;
  if (prefs.autoprint) printTicket(r.ticket.no);      // dans le meme clic : necessaire pour ouvrir RawBT
  show("result", r.ticket.no);
}
function viewResult() {
  const t = tickets.find(x => x.no === lastNo); if (!t) return show("ticket");
$("app").innerHTML = '<div class="card">' +
    (prefs.logoOn && logo ? '<div style="text-align:center;background:#fff"><img src="' + logo.src + '" style="max-width:' + Math.min(logo.w, 300) + 'px;filter:grayscale(1) contrast(2)"></div>' : "") + "<pre>" +
    esc(previewText(renderTicket(t, prefs.chars), prefs.chars)) + "</pre>" +
    '<div class="big">TOTAL : ' + f2(t.total) + " DH</div>" +
    '<button onclick="printTicket(\'' + t.no + '\')">Imprimer / Reimprimer</button>' +
    '<button class="blue" onclick="show(\'ticket\')">Nouveau ticket</button><button class="del" onclick="deleteTicket(\'' + t.no + '\')">Supprimer ce ticket</button></div>';
}


// ---------- Suppression protegee par le code secret ----------
function deleteTicket(no) {
  if (!cfg.admin_pin) return alert("Definissez d'abord un code secret : Reglages > Commune et bouchers > Code secret.");
  const t = tickets.find(x => x.no === no); if (!t) return;
  const p = prompt("Supprimer le ticket " + no + " (" + f2(t.total) + " DH).\nEntrez le code secret :");
  if (p === null) return;
  if (p.trim() !== cfg.admin_pin) return alert("Code incorrect.");
  deleted.push(Object.assign({}, t, { deleted_at: stamp(new Date()) }));
  tickets = tickets.filter(x => x.no !== no); saveTk(); saveDel();
  alert("Ticket " + no + " supprime.");
  if (view === "result") show("ticket"); else viewReport($("rday") ? $("rday").value : undefined);
}
