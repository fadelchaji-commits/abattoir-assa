// ---------- Rapport ----------
function viewReport(day) {
  day = typeof day === "string" ? day : stamp(new Date()).slice(0, 10);
  const list = tickets.filter(t => t.ts.startsWith(day));
  const byB = {}, byA = {}; let heads = 0, total = 0;
  list.forEach(t => {
    const b = byB[t.butcher] = byB[t.butcher] || [0, 0]; b[0]++; b[1] += t.total; total += t.total;
    t.items.forEach(i => { byA[i.name] = (byA[i.name] || 0) + i.heads; heads += i.heads; });
  });
  $("app").innerHTML = '<div class="card"><h3>Rapport du jour</h3><input type="date" id="rday" value="' + day + '" onchange="viewReport(this.value)">' +
    (!list.length ? "<p>Aucun ticket ce jour.</p>" :
      '<div class="stats"><div class="stat main"><b>' + f2(total) + '</b><span>DH</span></div><div class="stat"><b>' + list.length + '</b><span>ticket(s)</span></div><div class="stat"><b>' + heads + '</b><span>tete(s)</span></div></div>' +
      "<h4>Par boucher</h4><table>" + Object.keys(byB).sort().map(n => "<tr><td>" + esc(n) + "</td><td>" + byB[n][0] + "</td><td>" + f2(byB[n][1]) + " DH</td></tr>").join("") + "</table>" +
      "<h4>Par animal</h4><table>" + Object.keys(byA).map(n => "<tr><td>" + esc(n) + "</td><td>" + byA[n] + " tete(s)</td></tr>").join("") + "</table>" +
      "<h4>Tickets</h4><table>" + list.map(t => "<tr><td>" + t.no.slice(-3) + "</td><td>" + esc(t.butcher) + "</td><td>" + f2(t.total) + '</td><td><a href="#" onclick="printTicket(\'' + t.no + "');return false\">Imprimer</a> &nbsp; <a href=\"#\" style=\"color:var(--red)\" onclick=\"deleteTicket(\'" + t.no + "');return false\">Supprimer</a></td></tr>").join("") + "</table>" +
      '<button class="blue" onclick="download(\'registre_\' + $(\'rday\').value + \'.csv\', csvOf(tickets.filter(t=>t.ts.startsWith($(\'rday\').value))), \'text/csv\')">Exporter le CSV du jour</button>') + "</div>";
}
function download(name, text, mime) {
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: mime }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}

