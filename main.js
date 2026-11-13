// ---------- demarrage ----------
document.querySelectorAll("nav a").forEach(a => a.onclick = e => { e.preventDefault(); show(a.dataset.v); });
$("ttl").textContent = cfg.commune_title;
if (!storageOK) flash = "Stockage indisponible dans ce mode d'ouverture : les tickets seront perdus a la fermeture. Ouvrez le fichier avec Chrome et exportez souvent.";
show("ticket");
ensureLogo().then(() => { setHeadLogo(); if (view === "settings") viewSettings(); });
