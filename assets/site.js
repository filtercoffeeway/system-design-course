// Shared sidebar nav, injected into every page. Set window.SITE_BASE per page
// ("" at root, "../" one level deep) before loading this file.
(function () {
  var B = window.SITE_BASE || "";
  var primitives = [
    "Batching / buffering","Partitioning / hot-key","Replication / consistency","Caching",
    "Write- vs read-time","Inverted index","Scatter-gather","Tiered / columnar","Idempotency",
    "Consensus / fencing","CDN / edge","Tail latency","Real-time / routing","Saga / compensation",
    "Geospatial","Backpressure","Storage internals"
  ];
  var systems = [
    "Rate limiter","Kafka","Key-value store","RDBMS scaling","Object store","Datadog",
    "Search engine","Distributed SQL","Social feed","Chat","Notification","Task scheduler",
    "Distributed lock","URL shortener","Ride-sharing","Video streaming","Payment","Web crawler"
  ];

  var here = location.pathname.split("/").pop() || "index.html";

  // ---- completion status: the ONLY place to mark a page "complete" ----
  // Add a page's filename here once it's reviewed to full depth.
  var COMPLETE = { "s12.html": 1, "s14.html": 1 };
  function fileOf(href) { return (href || "").split("#")[0].split("/").pop(); }
  function isDone(file) { return !!COMPLETE[file]; }

  function link(href, label, sub) {
    var f = href.split("/").pop();
    var dot = sub ? '<span class="dot' + (isDone(f) ? " done" : "") + '"></span>' : "";
    return '<a class="' + (sub ? "sub" : "") + (f === here ? " active" : "") +
           '" href="' + B + href + '">' + dot + label + "</a>";
  }

  var html = "";
  html += '<a class="brand" href="' + B + 'index.html">System Design Curriculum</a>';

  html += "<h2>Overview</h2>";
  html += link("index.html", "Home");
  html += link("index.html#catalog", "Bottleneck Catalog");

  html += "<h2>Part II · Primitives</h2>";
  for (var i = 0; i < primitives.length; i++) {
    html += link("primitives/p" + (i + 1) + ".html", "P" + (i + 1) + " · " + primitives[i], true);
  }

  html += "<h2>Part III · Systems</h2>";
  for (var j = 0; j < systems.length; j++) {
    html += link("systems/s" + (j + 1) + ".html", (j + 1) + " · " + systems[j], true);
  }

  html += "<h2>Reference</h2>";
  html += link("index.html#matrix", "Coverage matrix");
  html += link("index.html#sequence", "Study sequence");

  var el = document.getElementById("side");
  if (el) el.innerHTML = html;

  // ---- status markers across the site ----
  function insertAfter(node, ref) { ref.parentNode.insertBefore(node, ref.nextSibling); }

  function runStatus() {
    // 1) per-page banner on primitive/system pages (just under the <h1>)
    if (/^[ps]\d+\.html$/.test(here)) {
      var done = isDone(here);
      var bar = document.createElement("div");
      bar.className = "pagestatus " + (done ? "is-done" : "is-wip");
      bar.innerHTML = done
        ? "Complete <small>Reviewed to full depth.</small>"
        : "Work in progress <small>Draft — not yet reviewed to full depth; details may be thin or change.</small>";
      var h1 = document.querySelector(".reading h1") || document.querySelector("h1");
      if (h1) insertAfter(bar, h1);
    }

    // 2) badges on landing-page tiles
    var tiles = document.querySelectorAll("a.tile");
    for (var i = 0; i < tiles.length; i++) {
      var f = fileOf(tiles[i].getAttribute("href"));
      if (!/^[ps]\d+\.html$/.test(f)) continue;
      var d = isDone(f);
      var s = document.createElement("span");
      s.className = "st " + (d ? "st-done" : "st-wip");
      s.textContent = d ? "Complete" : "Draft";
      tiles[i].appendChild(s);
    }

    // 3) legend on the landing page (just under the <h1>)
    if (here === "index.html" || here === "") {
      var lg = document.createElement("div");
      lg.className = "statuslegend";
      lg.innerHTML =
        'Reading guide: <span class="st st-done">Complete</span> pages are reviewed to full depth. ' +
        '<span class="st st-wip">Draft</span> pages are still work in progress. ' +
        "Currently complete: <b>S12 Task scheduler</b> and <b>S14 URL shortener</b>.";
      var ih1 = document.querySelector(".reading h1") || document.querySelector("h1");
      if (ih1) insertAfter(lg, ih1);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runStatus);
  } else {
    runStatus();
  }
})();
