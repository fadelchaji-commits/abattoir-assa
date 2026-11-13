# Abattoir - Commune d'Assa

Application web (HTML/JS, sans serveur) pour creer et imprimer les tickets d'abattage,
suivre le rapport journalier, modifier les prix et regler l'imprimante thermique (RawBT / USB).

## Structure

| Fichier | Role |
|---|---|
| `index.html` | Page principale (en-tete, menu, chargement des scripts) |
| `css/style.css` | Apparence (couleurs, cartes, boutons) |
| `js/logo-data.js` | Logo de la commune encode en base64 |
| `js/logic.js` | Calcul des taxes, validation de la config, creation du ticket |
| `js/printer.js` | Mise en forme du ticket, commandes ESC/POS, export CSV |
| `js/core.js` | Stockage (localStorage), etat de l'application, envoi a l'imprimante |
| `js/ticket.js` | Onglet **Ticket** |
| `js/report.js` | Onglet **Rapport** |
| `js/prices.js` | Onglet **Prix** |
| `js/logo.js` | Gestion du logo (conversion noir et blanc pour l'imprimante) |
| `js/settings.js` | Onglet **Reglages** (impression, commune, bouchers, sauvegarde) |
| `js/main.js` | Demarrage de l'application |
| `js/pwa.js` | Enregistre le service worker (mode hors connexion) |
| `sw.js` | Service worker : copie locale des fichiers, fonctionne sans internet |
| `manifest.json` | Nom, couleurs et icones de l'application installable (PWA) |
| `images/` | `logo.png` (reference) et icones `icon-*.png` de l'application |

## Utilisation
Ouvrir `index.html` avec Chrome, ou publier avec GitHub Pages (Settings > Pages).

## Donnees
Les tickets et reglages sont enregistres dans le navigateur du telephone (localStorage).
Ils ne sont **pas** dans GitHub. Utiliser *Reglages > Sauvegarde complete (JSON)* regulierement.

## Ordre des scripts
Les fichiers JS partagent les memes variables globales : ne pas changer l'ordre dans `index.html`.

## PWA (installation sur l'ecran d'accueil)
Necessite HTTPS : publier avec GitHub Pages, ouvrir le lien dans Chrome, puis menu > *Installer l'application*.
A chaque modification du projet, changer `VERSION` dans `sw.js` (ex. `abattoir-v1.1.1`) pour forcer la mise a jour,
et ajouter tout nouveau fichier a la liste `FILES`.

## Structure a plat
Tous les fichiers sont a la racine du depot (aucun dossier) pour faciliter l'envoi depuis un telephone.
Pour ranger en dossiers (css/, js/, images/), le faire sur ordinateur puis corriger les chemins dans
`index.html`, `manifest.json` et `sw.js`.
