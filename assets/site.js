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

  function link(href, label, sub) {
    return '<a class="' + (sub ? "sub" : "") + (href.split("/").pop() === here ? " active" : "") +
           '" href="' + B + href + '">' + label + "</a>";
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
})();
