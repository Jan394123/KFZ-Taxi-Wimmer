/* Einfache, deutsch-kommentierte Haupt-JS-Datei
   Ziel: klar und verständlich für Schüler (Oberstufe).
   Funktionen:
   - Navbar und Footer laden
   - WhatsApp-Knöpfe aktivieren
   - Optional: entfernte Index-Seite laden (nur wenn WEB_URL gesetzt)
*/

// Lädt ein HTML-Fragment von 'url' in das Element mit der ID 'id'.
function loadFragment(id, url) {
  var el = document.getElementById(id);
  if (!el) return; // Wenn nicht vorhanden, nichts tun
  fetch(url)
    .then(function (res) { return res.text(); })
    .then(function (html) { el.innerHTML = html; })
    .catch(function () { /* Fehler ignorieren, damit die Seite weiter funktioniert */ });
}

// Spezielle Funktion für Footer (setzt auch das Jahr)
function loadFooter() {
  loadFragment('footer-placeholder', '/content/footer.html');
  // Kurzer Timeout, damit das Fragment geladen werden kann
  setTimeout(function () {
    var y = document.getElementById('footer-year');
    if (y) y.textContent = new Date().getFullYear();
  }, 150);
}

// Navbar laden
function loadNavbar() {
  loadFragment('navbar-placeholder', '/content/navbar.html');
}

// WhatsApp-Buttons (nur aktiv, wenn die Knöpfe existieren)
function attachWhatsApp() {
  var workshopBtn = document.getElementById('wa-workshop');
  var taxiBtn = document.getElementById('wa-taxi');
  var WORKSHOP_PHONE = '4915121160489';
  var TAXI_PHONE = '4915128265858';

  function openWA(phone, text) {
    var url = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(text);
    window.open(url, '_blank');
  }

  if (workshopBtn) {
    workshopBtn.addEventListener('click', function () {
      openWA(WORKSHOP_PHONE, 'Hallo, ich möchte einen Werkstatttermin vereinbaren.');
    });
  }
  if (taxiBtn) {
    taxiBtn.addEventListener('click', function () {
      openWA(TAXI_PHONE, 'Hallo, ich möchte ein Taxi bestellen.');
    });
  }
}

// Optional: entfernte Index-Seite vom Storage laden (nur wenn gültige URL)
var WEB_URL = 'https://kfzwimmer.blob.core.windows.net/content/index.html?<SAS-Token>';
function maybeLoadRemoteIndex() {
  try {
    if (location.pathname === '/' && WEB_URL.indexOf('<SAS-Token>') === -1) {
      fetch(WEB_URL)
        .then(function (r) { return r.text(); })
        .then(function (html) { document.body.innerHTML = html; })
        .catch(function () { /* Fehler anzeigen oder ignorieren */ });
    }
  } catch (e) { /* ignore */ }
}

// Startpunkt: wenn DOM fertig ist
document.addEventListener('DOMContentLoaded', function () {
  loadNavbar();
  loadFooter();
  attachWhatsApp();
  maybeLoadRemoteIndex();
});

/* Ende vereinfachtes JS */
