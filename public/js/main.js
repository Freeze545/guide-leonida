(function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  var launch = new Date("2026-11-19T00:00:00-05:00");
  var boxes = document.querySelectorAll("[data-countdown]");
  function pad(n) { return String(n); }
  function tick() {
    var now = Date.now();
    var diff = launch.getTime() - now;
    if (diff <= 0) {
      boxes.forEach(function (root) {
        root.innerHTML = "<p class=\"lede\" style=\"margin:0\">C’est le jour J — consulte les <a href=\"/actus/\">actus</a> et les <a href=\"/guides/\">guides</a>, mis à jour dès qu’on a des faits vérifiés.</p>";
      });
      return;
    }
    var s = Math.floor(diff / 1000);
    var d = Math.floor(s / 86400);
    var h = Math.floor((s % 86400) / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    boxes.forEach(function (root) {
      var dEl = root.querySelector("[data-d]");
      var hEl = root.querySelector("[data-h]");
      var mEl = root.querySelector("[data-m]");
      var sEl = root.querySelector("[data-s]");
      if (dEl) dEl.textContent = pad(d);
      if (hEl) hEl.textContent = pad(h);
      if (mEl) mEl.textContent = pad(m);
      if (sEl) sEl.textContent = pad(sec);
    });
  }
  if (boxes.length) {
    tick();
    setInterval(tick, 1000);
  }

  var form = document.querySelector("[data-search]");
  var input = form && form.querySelector("input[type='search']");
  var results = document.querySelector("[data-search-results]");
  if (!form || !input || !results) return;

  var index = [];
  var loaded = false;
  function loadIndex() {
    if (loaded) return Promise.resolve(index);
    return fetch("/js/search-index.json", { credentials: "same-origin" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        index = data;
        loaded = true;
        return index;
      })
      .catch(function () {
        index = [];
        return index;
      });
  }

  function normalize(str) {
    return (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function render(items, q) {
    if (!q) {
      results.classList.remove("is-open");
      results.innerHTML = "";
      results.hidden = true;
      return;
    }
    if (!items.length) {
      results.hidden = false;
      results.classList.add("is-open");
      results.innerHTML = "<p style='margin:0;padding:0.85rem 1rem;color:var(--faint)'>Aucun résultat pour « " + q.replace(/[<>&]/g, "") + " ».</p>";
      return;
    }
    results.hidden = false;
    results.classList.add("is-open");
    results.innerHTML = items.slice(0, 8).map(function (item) {
      return "<a href=\"" + item.url + "\"><strong>" + item.title + "</strong><small>" + item.blurb + "</small></a>";
    }).join("");
  }

  function query(q) {
    var n = normalize(q.trim());
    if (!n) return [];
    return index.filter(function (item) {
      var hay = normalize(item.title + " " + item.blurb + " " + (item.tags || []).join(" "));
      return hay.indexOf(n) !== -1;
    });
  }

  input.addEventListener("input", function () {
    var q = input.value;
    loadIndex().then(function () { render(query(q), q.trim()); });
  });
  input.addEventListener("focus", function () {
    loadIndex().then(function () {
      if (input.value.trim()) render(query(input.value), input.value.trim());
    });
  });
  document.addEventListener("click", function (e) {
    if (!form.contains(e.target) && !results.contains(e.target)) {
      results.classList.remove("is-open");
    }
  });
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    loadIndex().then(function () {
      var items = query(input.value);
      render(items, input.value.trim());
      if (items[0]) window.location.href = items[0].url;
    });
  });
})();
