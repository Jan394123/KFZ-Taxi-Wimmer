
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

  // Attach PDF link / modal behavior
  function attachPDFUI() {
    var link = document.getElementById('preisliste-link');
    var openBtn = document.getElementById('preisliste-open');
    var applyBtn = document.getElementById('preisliste-apply');
    var pdfSrc = '/content/preisliste.pdf';

    // Check if PDF exists (via HEAD request) and hide buttons if not present
    try {
      fetch(pdfSrc, { method: 'HEAD' }).then(function (res) {
        if (!res.ok) {
          if (link) link.style.display = 'none';
          if (openBtn) openBtn.style.display = 'none';
          if (applyBtn) applyBtn.style.display = 'none';
        } else {
          // if PDF present, check if developer extraction json exists; otherwise disable apply
          var jsonUrl = pdfSrc + '.prices.json';
          fetch(jsonUrl, { method: 'HEAD' }).then(function (jr) {
            if (!jr.ok) {
              if (applyBtn) applyBtn.style.display = 'none';
            } else {
              if (applyBtn) applyBtn.style.display = '';
            }
          }).catch(function () {
            if (applyBtn) applyBtn.style.display = 'none';
          });
        }
      }).catch(function () {
        if (link) link.style.display = 'none';
        if (openBtn) openBtn.style.display = 'none';
        if (applyBtn) applyBtn.style.display = 'none';
      });
    } catch (e) {
      if (link) link.style.display = 'none';
      if (openBtn) openBtn.style.display = 'none';
    }

    var pdfModalEl = document.getElementById('pdfModal');
    var pdfFrame = document.getElementById('pdf-frame');
    if (pdfModalEl && pdfFrame) {
      pdfModalEl.addEventListener('show.bs.modal', function () {
        if (!pdfFrame.src || pdfFrame.src === 'about:blank') pdfFrame.src = pdfSrc;
      });
      pdfModalEl.addEventListener('hidden.bs.modal', function () {
        // clear to release memory
        pdfFrame.src = 'about:blank';
      });
    }
  }

  // Call function when DOM is ready
  document.addEventListener('DOMContentLoaded', function () {
    attachPDFUI();
  });

  // If there is a prices JSON for the PDF, fetch and render it into the page
  var PREISLISTE_ENTRIES = null; // store parsed entries for preview/apply
  function renderPricesFromJSON() {
    var out = document.getElementById('preisliste-extracted');
    if (!out) return;
    var jsonUrl = '/content/preisliste.pdf.prices.json';
    fetch(jsonUrl).then(function (res) {
      if (!res.ok) return null;
      return res.json();
    }).then(function (entries) {
      PREISLISTE_ENTRIES = entries || null;
      if (!entries || entries.length === 0) return;
      var card = document.createElement('div');
      card.className = 'card shadow-sm';
      var body = document.createElement('div');
      body.className = 'card-body';
      var title = document.createElement('h3');
      title.className = 'h5';
      title.textContent = 'Preise aus Preisliste';
      body.appendChild(title);
      var table = document.createElement('table');
      table.className = 'table table-sm mt-3';
      var thead = document.createElement('thead');
      thead.innerHTML = '<tr><th>Position</th><th>Preis</th></tr>';
      table.appendChild(thead);
      var tbody = document.createElement('tbody');
      var amountRx = /([\d.,]+)\s*(?:€|EUR)/i;
      entries.forEach(function (e) {
        var line = (e.line || '');
        var amt = e.amount || (line.match(amountRx) ? line.match(amountRx)[1] : '');
        var label = line.replace(amountRx, '').trim();
        if (!label) label = e.context || line;
        var tr = document.createElement('tr');
        var td1 = document.createElement('td'); td1.textContent = label;
        var td2 = document.createElement('td'); td2.textContent = (amt ? amt + ' €' : '–');
        tr.appendChild(td1); tr.appendChild(td2); tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      body.appendChild(table);
      card.appendChild(body);
      out.appendChild(card);
      // Also try to map the extracted entries into the visible price cards
      if (typeof applyPricesToCards === 'function') applyPricesToCards(entries);
    }).catch(function () {
      // ignore; simply don't render
    });
  }

// Provide an 'apply' flow for the user that updates UI values safely
function enableApplyPricesButton() {
  var btn = document.getElementById('preisliste-apply');
  var status = document.getElementById('preisliste-apply-status');
  if (!btn || !status) return;
  btn.addEventListener('click', function () {
    if (!PREISLISTE_ENTRIES || !PREISLISTE_ENTRIES.length) {
      status.innerHTML = '<div class="alert alert-warning">Keine Preisinformationen zum Anwenden gefunden.</div>';
      return;
    }
    // Build a preview of changes
    var changes = collectPriceChanges(PREISLISTE_ENTRIES);
    if (!changes || !changes.length) {
      status.innerHTML = '<div class="alert alert-info">Keine relevanten Änderungen erkannt.</div>';
      return;
    }
    // Show preview and ask for confirmation
    var previewHtml = '<div class="alert alert-secondary mb-2">Vorschau: die folgenden Preise werden überschrieben (Original → Neu):<ul>' +
      changes.map(function (c) {
        return '<li><strong>' + c.key + '</strong>: ' + (c.original || '—') + ' → <span class="text-success">' + (c.newValue || '—') + '</span></li>';
      }).join('') + '</ul></div>';
    previewHtml += '<div class="d-flex gap-2"><button id="apply-confirm" class="btn btn-success btn-sm">Ändern übernehmen</button><button id="apply-cancel" class="btn btn-outline-secondary btn-sm">Abbrechen</button></div>';
    status.innerHTML = previewHtml;
    document.getElementById('apply-cancel').addEventListener('click', function () { status.innerHTML = ''; });
    document.getElementById('apply-confirm').addEventListener('click', function () {
      applyCollectedChanges(changes);
      status.innerHTML = '<div class="alert alert-success">Preise übernommen. Änderungen können über die Rückgängig-Schaltfläche zurückgesetzt werden.</div>';
    });
  });
}

// Collect changes — returns an array of { key, el, original, newValue }
function collectPriceChanges(entries) {
  var mapping = buildKeyKeywordMapping();
  var results = [];
  var elements = document.querySelectorAll('[data-price-key]');
  elements.forEach(function (el) {
    var key = el.getAttribute('data-price-key');
    var best = findBestMatchForKey(key, entries, mapping[key]);
    if (best && best.amount !== null) {
      var normAmount = formatAmount(best.amount, el.textContent);
      if (normAmount && normAmount !== el.textContent) {
        results.push({ key: key, el: el, original: el.textContent, newValue: normAmount });
      }
    } else if (best && best.text && best.text.toLowerCase().indexOf('kostenlos') !== -1) {
      var val = 'kostenlos';
      if (val !== el.textContent.toLowerCase()) {
        results.push({ key: key, el: el, original: el.textContent, newValue: val });
      }
    }
  });
  return results;
}

function applyCollectedChanges(changes) {
  changes.forEach(function (c) {
    try {
      if (!c.el.hasAttribute('data-original')) c.el.setAttribute('data-original', c.original);
      c.el.textContent = c.newValue;
      c.el.classList.add('price-updated');
      // Add an undo link next to the element if not present
      var undoId = 'undo-' + c.key.replace(/[^a-z0-9_-]/ig, '_');
      var existing = document.getElementById(undoId);
      if (!existing) {
        var small = document.createElement('button');
        small.type = 'button';
        small.className = 'btn btn-link btn-sm text-danger ps-0 undo-price';
        small.id = undoId;
        small.textContent = 'Rückgängig';
        small.addEventListener('click', function () {
          if (c.el.hasAttribute('data-original')) {
            c.el.textContent = c.el.getAttribute('data-original');
            c.el.classList.remove('price-updated');
          }
          small.remove();
        });
        c.el.parentNode.appendChild(small);
      }
    } catch (e) { console.warn('Apply failed for', c.key, e); }
  });
}

  // Try to map extracted entries to the price cards (best-effort)
  function applyPricesToCards(entries) {
    if (!entries || !entries.length) return;
    var mappings = {
      'stadt_grundgebuehr': ['grundgebühr','grundgebuehr','grundgebühr','grundgebühr'],
      'stadt_pro_km': ['pro kilometer','pro km','kilometer','km'],
      'stadt_wartezeit': ['wartezeit','pro stunde','wartezeit (pro stunde)'],
      'airport_vienna': ['flughafen wien','vienna','wien'],
      'airport_salzburg': ['flughafen salzburg','salzburg'],
      'airport_gepaeck': ['gepäck','gepaeck'],
      'event_stundenpreis': ['stundenpreis','pro stunde'],
      'event_mindestbuchung': ['mindestbuchung'],
      'event_nachtzuschlag': ['nachtzuschlag','nacht']
    };

    function norm(s) { return (s||'').toLowerCase().replace(/[^a-z0-9äöüß\s]/g, ' '); }

    entries.forEach(function (e) {
      var text = norm((e.line || '') + ' ' + (e.context || ''));
      for (var key in mappings) {
        var words = mappings[key];
        for (var i = 0; i < words.length; i++) {
          if (text.indexOf(words[i]) !== -1) {
            var el = document.querySelector('[data-price-key="' + key + '"]');
            if (el) {
              var amount = e.amount;
              if (amount) {
                // Only overwrite if we have likely high confidence; try to normalize
                var newText = formatAmount(amount, el.textContent);
                el.setAttribute('data-original', el.textContent);
                el.textContent = newText;
                el.classList.add('price-updated');
              } else if (e.line && e.line.toLowerCase().indexOf('kostenlos') !== -1) {
                el.setAttribute('data-original', el.textContent);
                el.textContent = 'kostenlos';
                el.classList.add('price-updated');
              } else {
                // fallback: don't override unless user confirms (we will not overwrite here)
              }

              // Helper: build static mapping of price-key to keywords
              function buildKeyKeywordMapping() {
                return {
                  'stadt_grundgebuehr': ['grundgebühr', 'grundgebuehr', 'grund gebuehr', 'grundgebuehr:'],
                  'stadt_pro_km': ['pro kilometer', 'pro km', 'kilometerpreis', 'pro-km', 'km'],
                  'stadt_wartezeit': ['wartezeit', 'wartezeit (pro stunde)', 'wartezeit pro stunde', 'wartezeit pro stunde'],
                  'airport_vienna': ['flughafen wien', 'wien', 'vienna', 'airport vienna'],
                  'airport_salzburg': ['flughafen salzburg', 'salzburg'],
                  'airport_gepaeck': ['gepäck', 'gepaeck', 'zusteigendes gepaeck', 'stueck gepaeck'],
                  'event_stundenpreis': ['stundenpreis', 'pro stunde', 'stunde preis'],
                  'event_mindestbuchung': ['mindestbuchung', 'mindestens', 'minimum buchung'],
                  'event_nachtzuschlag': ['nachtzuschlag', 'nachtzuschlag', 'nachtzuschlag']
                };
              }

              // Helper: find best match for a key among entries by keywords + amount presence
              function findBestMatchForKey(key, entries, keywords) {
                if (!entries || !entries.length) return null;
                var best = null; var bestScore = 0;
                var kwList = (keywords || buildKeyKeywordMapping()[key] || []).map(k => k.toLowerCase());
                entries.forEach(function (e) {
                  var text = ((e.line || '') + ' ' + (e.context || '')).toLowerCase();
                  var score = 0;
                  if (e.amount) score += 2; // strong signal
                  // count matched keywords
                  kwList.forEach(function (kw) { if (kw && text.indexOf(kw) !== -1) score += 2; });
                  // small boost if digits appear near keyword
                  var digitMatch = text.match(/\d+[.,]?\d*/);
                  if (digitMatch && digitMatch.index >= 0) score += 1;
                  if (score > bestScore) { bestScore = score; best = e; }
                });
                // require at least score 2 to be confident
                return bestScore >= 2 ? best : null;
              }

              // Helper: format normalized amount with currency and local comma decimals
              function formatAmount(amountRaw, textContext) {
                if (!amountRaw) return null;
                var a = String(amountRaw).trim();
                a = a.replace(/\s+/g, '');
                a = a.replace(/\./g, ','); // show as comma if originally dot
                // if text context uses comma, keep comma; otherwise show € with comma
                if (a.indexOf(',') === -1 && textContext && textContext.indexOf(',') !== -1) {
                  // nothing
                }
                return a + ' €';
              }
            }
            break; // match first keyword for this entry
          }
        }
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderPricesFromJSON();
    enableApplyPricesButton();
    initFareCalculator();
    maybeLoadTarifText();
  });

  function maybeLoadTarifText() {
    var pre = document.querySelector('#tarif-text pre');
    if (!pre) return;
    var txtUrl = '/Tarif_Passau-lkr_%2001.08.2025.txt';
    fetch(txtUrl).then(function (res) {
      if (!res.ok) return;
      return res.text();
    }).then(function (text) {
      if (!text) return;
      pre.textContent = text;
    }).catch(function () {
      // ignore; keep the inline version
    });
  }

  // ===== Fahrpreis-Kalkulator =====
  function initFareCalculator() {
    var btn = document.getElementById('calc-calc');
    var resetBtn = document.getElementById('calc-reset');
    if (btn) btn.addEventListener('click', doCalc);
    if (resetBtn) resetBtn.addEventListener('click', doReset);
  }

  function doReset(e) {
    e && e.preventDefault();
    var ids = ['calc-distance','calc-wait','calc-zone','calc-period','calc-luggage','calc-bulky','calc-animals','calc-large','calc-btw'];
    document.getElementById('calc-distance').value = '1.00';
    document.getElementById('calc-wait').value = '0';
    document.getElementById('calc-zone').value = 'I';
    document.getElementById('calc-period').value = 'day';
    document.getElementById('calc-luggage').value = '0';
    document.getElementById('calc-bulky').value = '0';
    document.getElementById('calc-animals').value = '0';
    document.getElementById('calc-large').checked = false;
    document.getElementById('calc-btw').checked = false;
    
    // Hide result container
    var container = document.getElementById('calc-result-container');
    if (container) container.classList.add('d-none');
    
    document.getElementById('calc-output').innerHTML = '';
    document.getElementById('calc-final').textContent = '';
  }

  function doCalc(e) {
    e && e.preventDefault();
    var distance = parseFloat(document.getElementById('calc-distance').value) || 0;
    var waitMin = parseFloat(document.getElementById('calc-wait').value) || 0;
    var zone = document.getElementById('calc-zone').value || 'I';
    var period = document.getElementById('calc-period').value || 'day';
    var luggage = parseInt(document.getElementById('calc-luggage').value) || 0;
    var bulky = parseInt(document.getElementById('calc-bulky').value) || 0;
    var animals = parseInt(document.getElementById('calc-animals').value) || 0;
    var large = document.getElementById('calc-large').checked;
    var btw = document.getElementById('calc-btw').checked;

    var breakdown = calculateFare({ distance: distance, waitMin: waitMin, zone: zone, period: period, luggage: luggage, bulky: bulky, animals: animals, large: large, btw: btw });
    showCalcResult(breakdown);
  }

  function showCalcResult(b) {
    var container = document.getElementById('calc-result-container');
    var out = document.getElementById('calc-output');
    var finalEl = document.getElementById('calc-final');
    if (!out || !finalEl || !container) return;
    
    // Show result container
    container.classList.remove('d-none');
    
    var html = '<div class="row g-2">';
    html += '<div class="col-sm-6"><strong>Grundgebühr:</strong></div><div class="col-sm-6 text-end">' + formatCurrencyEuro(b.base) + '</div>';
    if (b.kmCost) html += '<div class="col-sm-6"><strong>Kilometerpreis:</strong><br><small class="text-muted">' + b.distance.toFixed(2) + ' km × ' + formatCurrencyEuro(b.kmRate) + '/km</small></div><div class="col-sm-6 text-end">' + formatCurrencyEuro(b.kmCost) + '</div>';
    if (b.timeCost) html += '<div class="col-sm-6"><strong>Warte-/Zeitpreis:</strong></div><div class="col-sm-6 text-end">' + formatCurrencyEuro(b.timeCost) + '</div>';
    if (b.shortDistanceApplied) html += '<div class="col-sm-6"><strong>Kurzstrecke (Festpreis):</strong></div><div class="col-sm-6 text-end">' + formatCurrencyEuro(b.shortDistancePrice) + '</div>';
    if (b.surchargeTotal) html += '<div class="col-sm-6"><strong>Zuschläge:</strong>' + (b.surchargeCapped ? '<br><small class="text-muted">max. ' + formatCurrencyEuro(b.surchargeCap) + ' angewendet</small>' : '') + '</div><div class="col-sm-6 text-end">' + formatCurrencyEuro(b.surchargeTotal) + '</div>';
    html += '<div class="col-12"><hr class="my-2"></div>';
    html += '<div class="col-sm-6"><strong>Zwischensumme:</strong></div><div class="col-sm-6 text-end"><strong>' + formatCurrencyEuro(b.subTotal) + '</strong></div>';
    if (b.minApplied) html += '<div class="col-12"><small class="text-muted">Mindestfahrpreis angewendet: ' + formatCurrencyEuro(b.minFare) + '</small></div>';
    html += '</div>';
    out.innerHTML = html;
    finalEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-currency-euro me-2" viewBox="0 0 16 16"><path d="M4 9.42h1.063C5.4 12.323 7.317 14 10.34 14c.622 0 1.167-.068 1.659-.185v-1.3c-.484.119-1.045.17-1.659.17-2.1 0-3.455-1.198-3.775-3.264h4.017v-.928H6.497v-.936c0-.11 0-.219.008-.329h4.078v-.927H6.618c.388-1.898 1.719-2.985 3.723-2.985.614 0 1.175.05 1.659.177v-1.3C11.484 2.68 10.939 2.612 10.34 2.612 7.317 2.612 5.4 4.289 5.063 7.19H4v.928h1.063v1.42H4v.928z"/></svg>' + formatCurrencyEuro(b.total);
    
    // Scroll to result
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function calculateFare(ctx) {
    // Tarifwerte anhand der Vorgaben
    var rates = {
      base: { day: 4.20, night: 7.20, holiday_day: 6.20, holiday_night: 9.20 },
      min: { day: 4.40, night: 7.40, holiday_day: 6.40, holiday_night: 9.40 },
      timePerMin: 42.00 / 60.0, // € / min
      km: 2.50, // € / km
      shortDistPrice: 9.20, // Festpreis
      luggage: 0.5,
      bulky: 1.0,
      animals: 2.0,
      large: 10.0,
      btw: 10.0,
      surchargeCap: { pkwtaxi: 6.0, largeOrBTW: 15.0 }
    };

    var period = ctx.period || 'day';
    var base = rates.base[period] || rates.base.day;
    var minFare = rates.min[period] || rates.min.day;
    var distance = Math.max(0, parseFloat(ctx.distance || 0));
    var waitMin = Math.max(0, parseFloat(ctx.waitMin || 0));
    var kmCost = 0;
    var shortDistanceApplied = false;
    var shortDistancePrice = 0;

    if (ctx.zone === 'I' && distance <= 2.0) {
      shortDistanceApplied = true;
      shortDistancePrice = rates.shortDistPrice;
    } else {
      kmCost = distance * rates.km;
    }

    var timeCost = waitMin * rates.timePerMin; // default
    // Note: bei Störung Fahrpreisanzeiger wäre 0,45 €/min — not modeled by default

    // Surcharges
    var surcharge = 0;
    surcharge += (ctx.luggage || 0) * rates.luggage;
    surcharge += (ctx.bulky || 0) * rates.bulky;
    surcharge += (ctx.animals || 0) * rates.animals;
    if (ctx.large) surcharge += rates.large;
    if (ctx.btw) surcharge += rates.btw;

    // Apply caps
    var cap = (ctx.large || ctx.btw) ? rates.surchargeCap.largeOrBTW : rates.surchargeCap.pkwtaxi;
    var surchargeCapped = false;
    if (surcharge > cap) { surcharge = cap; surchargeCapped = true; }

    var subTotal = base + kmCost + timeCost + surcharge;
    var total = subTotal;
    if (shortDistanceApplied) {
      total = shortDistancePrice + surcharge; // time not included
      subTotal = shortDistancePrice + surcharge;
    }
    var minApplied = false;
    if (total < minFare) {
      total = minFare;
      minApplied = true;
    }

    return {
      base: base,
      distance: distance,
      kmRate: rates.km,
      kmCost: kmCost,
      timeCost: timeCost,
      surchargeTotal: surcharge,
      surchargeCap: cap,
      surchargeCapped: surchargeCapped,
      subTotal: subTotal,
      total: total,
      minFare: minFare,
      minApplied: minApplied,
      shortDistanceApplied: shortDistanceApplied,
      shortDistancePrice: shortDistancePrice
    };
  }

  function formatCurrencyEuro(x) {
    if (x === null || x === undefined || Number.isNaN(Number(x))) return '€ —';
    var n = parseFloat(x);
    return '€ ' + n.toFixed(2).replace('.', ',');
  }

/* Ende vereinfachtes JS */
function calculateCost() {
  const distance = parseFloat(document.getElementById('distance').value);
  const resultDiv = document.getElementById('result');
  
  if (!distance || distance <= 0) {
    resultDiv.innerHTML = '<strong>Bitte geben Sie eine gültige Entfernung ein.</strong>';
    resultDiv.style.display = 'block';
    return;
  }
  
  // Standard Tarif: Grundgebühr 4,40€ + 2,50€ pro km
  const grundgebuehr = 4.40;
  const preis_pro_km = 2.50;
  
  const gesamtkosten = grundgebuehr + (distance * preis_pro_km);
  
  resultDiv.innerHTML = `
    <strong>Geschätzte Kosten:</strong><br>
    Grundgebühr: ${grundgebuehr.toFixed(2).replace('.', ',')}€<br>
    ${distance} km × ${preis_pro_km.toFixed(2).replace('.', ',')}€ = ${(distance * preis_pro_km).toFixed(2).replace('.', ',')}€<br>
    <hr>
    <strong>Gesamt: ${gesamtkosten.toFixed(2).replace('.', ',')}€</strong><br>
    <small class="text-muted">*Unverbindliche Schätzung. Endpreis kann je nach Tarif und Zusatzleistungen abweichen.</small>
  `;
  resultDiv.style.display = 'block';
}

/* Ende vereinfachtes JS */

// Active page highlighting
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    var path = window.location.pathname;
    var links = document.querySelectorAll('.nav-link');
    links.forEach(function(link) {
      var href = link.getAttribute('href');
      if (path === '/' && href === '/') {
        link.classList.add('active');
      } else if (path !== '/' && href !== '/' && href && path.indexOf(href) !== -1) {
        link.classList.add('active');
      }
    });
  }, 100);
});
