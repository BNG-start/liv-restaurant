/* LIV Restaurant — en-tête, menu, statut d'ouverture, horaires du jour, réservation WhatsApp */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  var WHATSAPP = "2250759700700";
  var header = document.querySelector(".header");
  var burger = document.querySelector(".burger");
  var nav = document.getElementById("nav");
  var fab = document.querySelector(".fab");
  var reserve = document.getElementById("reserver");

  /* En-tête + bouton flottant au défilement */
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 30);
    var r = reserve.getBoundingClientRect();
    var inReserve = r.top < window.innerHeight * 0.8 && r.bottom > 0;
    fab.classList.toggle("is-visible", y > window.innerHeight * 0.7 && !inReserve);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* Menu mobile */
  function setMenu(open) {
    header.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    document.body.style.overflow = open ? "hidden" : "";
  }
  burger.addEventListener("click", function () { setMenu(!header.classList.contains("is-open")); });
  nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  window.addEventListener("resize", function () { if (window.innerWidth >= 960) setMenu(false); });

  /* Horaires (heure d'Abidjan = UTC+0). Fermeture en heures, > 24 = après minuit. */
  var HOURS = { 0: [19.5, 24], 1: null, 2: [19.5, 24], 3: [19.5, 24], 4: [19.5, 25], 5: [19.5, 26.5], 6: [19.5, 26.5] };
  var LABEL = { 24: "minuit", 25: "1h", 26.5: "2h30" };
  var DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

  function nextOpening(day) {
    for (var i = 1; i <= 7; i++) {
      var d = (day + i) % 7;
      if (HOURS[d]) return i === 1 ? "demain à 19h30" : DAYS[d] + " à 19h30";
    }
    return "";
  }

  function updateStatus() {
    var now = new Date();
    var day = now.getUTCDay();
    var h = now.getUTCHours() + now.getUTCMinutes() / 60;
    var today = HOURS[day];
    var yesterday = HOURS[(day + 6) % 7];
    var open = false, closeAt = null;

    if (yesterday && yesterday[1] > 24 && h < yesterday[1] - 24) { open = true; closeAt = yesterday[1]; }
    else if (today && h >= today[0]) { open = true; closeAt = today[1]; }

    var text;
    if (open) text = "Ouvert maintenant · jusqu’à " + LABEL[closeAt];
    else if (today && h < today[0]) text = "Fermé · ouvre ce soir à 19h30";
    else text = "Fermé · ouvre " + nextOpening(day);

    document.querySelectorAll("[data-status-text]").forEach(function (el) { el.textContent = text; });
    document.querySelectorAll("[data-status]").forEach(function (el) { el.classList.toggle("is-open", open); });
    document.querySelectorAll(".hours tr").forEach(function (tr) {
      tr.classList.toggle("is-today", Number(tr.getAttribute("data-day")) === day);
    });
  }
  updateStatus();
  setInterval(updateStatus, 60000);

  /* Formulaire de réservation → WhatsApp */
  var form = document.getElementById("form");
  var error = document.getElementById("form-error");
  var dateInput = document.getElementById("date");
  var todayISO = new Date().toISOString().slice(0, 10);
  dateInput.min = todayISO;

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    error.textContent = "";
    var f = form.elements;
    var nom = f.nom.value.trim();
    var tel = f.tel.value.trim();
    var date = f.date.value;

    if (!nom || tel.replace(/\D/g, "").length < 8 || !date) {
      error.textContent = "Merci d’indiquer votre nom, un numéro de téléphone valide et la date.";
      return;
    }
    var chosen = new Date(date + "T12:00:00Z");
    if (chosen.getUTCDay() === 1) {
      error.textContent = "Le restaurant est fermé le lundi : merci de choisir un autre jour.";
      return;
    }
    var dateFr = chosen.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
    var lines = [
      "Bonjour LIV Restaurant,",
      "Je souhaite réserver une table :",
      "",
      "• Nom : " + nom,
      "• Téléphone : " + tel,
      "• Date : " + dateFr,
      "• Heure : " + f.heure.value,
      "• Personnes : " + f.couverts.value
    ];
    if (f.occasion.value) lines.push("• Occasion : " + f.occasion.value);
    if (f.message.value.trim()) lines.push("• Message : " + f.message.value.trim());
    lines.push("", "Merci !");
    window.open("https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(lines.join("\n")), "_blank", "noopener");
  });

  /* Apparitions au défilement */
  var items = document.querySelectorAll(".reveal");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add("is-in"); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    items.forEach(function (el) {
      var i = Array.prototype.indexOf.call(el.parentElement.children, el);
      el.style.transitionDelay = Math.min(i, 4) * 90 + "ms";
      io.observe(el);
    });
  }

  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
