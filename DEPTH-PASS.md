# DEPTH-PASS.md — deepening every page to full depth

**Read `CLAUDE.md` first**, then this file. `CHECKLIST.md` tracks whether a page
has *any* full draft; **this file tracks the depth pass** — turning the shallow
first drafts into deep, worked-example content. Any fresh Claude session can pick
up here: find the next unchecked page, deepen it to the standard below, tick it,
add a changelog line.

The first drafts are **too high-level** — they name a concept ("Gorilla for time
series", "base62 keys") without ever showing the mechanics, the bits, or the
numbers. The depth pass fixes that.

---

## ⭐ THE #1 RULE: derive every major decision as an escalation ladder

This is **the most important rule in the entire course** — it outranks every
other instruction here. It applies to **any major design decision on any page**,
not just one section: id/key generation, datastore choice, caching, partitioning,
replication, consistency level, queue vs direct call, index structure, transport,
and so on. If a page makes a significant choice, that choice must be *derived*,
never asserted.

**Never present a solution as a finished fact, and never present options as a
flat menu.** Instead, derive the solution as a ladder driven by scale:

> **simplest thing that works → the concrete number where it breaks (the
> bottleneck) → the next option that relieves it → its new bottleneck → … →
> the "complex" answer, now obviously necessary.**

The reader must finish thinking *"of course you need a central token service — I
watched the simpler options each die at a specific load"*, not *"I memorized that
the answer is a token service."* Anchor every rung to a **number**: "at ~10 rps a
DB auto-increment is fine; it caps out around a few thousand writes/s on one node;
so…". Each rung names: (1) what you'd build, (2) why it's enough for *some* scale,
(3) the exact bottleneck that forces the next rung. Use a `.estimate` block or a
table per rung, and prefer ending with a small "ladder" recap table (rung → good
until → breaks on).

### The depth bar — go all the way down, don't stop at the named rung

A correct ladder is necessary but **not sufficient**. Each rung is a *named
mechanism that must be fully unpacked*, not a label to move past. Apply this test
to every page before calling it done:

- **Enumerate the real algorithms/data structures, don't name one.** A worker-
  selection rung isn't "P2C" — it's the *family*: random/round-robin, least-
  connections/JSQ, weighted-least-connections, **JIQ**, power-of-two-choices,
  P2C+peak-EWMA, work-stealing, and resource-aware filter-then-score (K8s/Borg).
  Name the real ones and say when each wins. Same for storage (heap vs **timing
  wheel** vs bucketed index), hashing, etc.
- **Explain every named concept inline. No unexplained jargon.** If the page says
  "timing wheel," "P2C," "EWMA," "fencing token," "CRDT," "Bloom filter," it must
  also say *what that is* in a sentence or two + a worked micro-example. Assume the
  reader is learning it here, not refreshing it.
- **Pre-empt the obvious objection.** For each choice, ask "what would a sharp
  interviewer push back with?" and answer it in the doc. (P2C → "wouldn't random
  pick a weak worker?" → compare utilization not raw count / filter-then-P2C.)
  These belong inline *and* in the §12 Interview-follow-ups section.
- **The litmus test:** if a knowledgeable reader could ask a one-line follow-up
  that the page doesn't already answer, the page isn't deep enough yet. The whole
  back-and-forth that *should* happen in an interview should already be on the page.

S12 (after its Q&A, JIQ, P2C-caveat, min-heap, and timing-wheel passes) is the
reference for this bar. The earlier-done systems (S1, S3, S4, S5, S17) were built
to the *structure* bar but not this *depth* bar — they name rungs without fully
unpacking the algorithm family, so they need a back-fill pass to match S12.

This is just the curriculum's own thesis — *every lever creates a new
bottleneck* — applied **inside** a single topic. Exemplar: the code-generation
ladder in `systems/s14.html` §6 (DB auto-increment → Redis INCR → range leasing →
Snowflake, each with the load that kills it).

---

## Two standards: Primitives vs Systems

### Primitive pages (`primitives/pN.html`) — "mechanism deep dive"

A primitive page must make the reader able to *implement* the lever. **Target
1,200–1,800 words of real content.** Every primitive page must contain all four
of these treatments wherever they apply:

1. **Worked byte/bit example** — trace concrete sample records through the
   mechanism. Show the actual bits/bytes/rows, not a description of them.
2. **Numeric walkthrough** — carry real numbers through: sizes, latencies,
   throughput, ratios — the math that shows *why* the lever pays off.
3. **Algorithm-level mechanics** — step the actual algorithm or data structure,
   not just the named concept.
4. **Diagrams** — at least one Mermaid diagram of the mechanism; add a second
   (encoding layout, state machine, sequence) where it clarifies.
5. **The escalation ladder** (see above) — where the primitive has a range of
   implementations (it usually does), walk simplest → bottleneck → next, so the
   reader sees why the sophisticated version exists.

**Reference exemplar: `primitives/p8.html`** (Tiered & columnar). Open it. The
Gorilla section is the bar — delta-of-delta timestamps and XOR values traced
through real IEEE-754 bit patterns, a raw-vs-compressed per-point budget, an
encoding-toolbox table with sample columns, and a second diagram. Match that.
`p1.html` (batching) is also at depth.

### System pages (`systems/sN.html`) — "full interview answer"

**A system page must read like a complete, strong system-design interview
answer** — comprehensive enough that the reader could give the whole answer from
it. **Target 1,800–2,800 words, and SELF-CONTAINED.** `systems/s14.html` is the
exemplar to match in *both* length and shape: it derives **multiple** major
decisions as ladders (store §4, id-gen §6, caching §8), each ending in a
`rung → good until → breaks on` table.

> **Self-contained, not link-only.** Cross-link the primitives, but do NOT
> outsource the mechanism to them — *recap the key mechanism inline* (a few
> sentences + a worked `.estimate`) so the page stands alone as an interview
> answer, then link the P-page for the full treatment. A reader should never have
> to open three primitive pages to follow the system. Aim to derive **at least 2–3
> major decisions as ladders** on every system page (storage engine, partitioning,
> replication/consistency, caching, fan-out, transport — whichever the system
> turns on). Lean ~700-word pages that just link out are **below bar** — expand them.

The shallow drafts (e.g. the URL shortener at ~470 words) are exactly what to
avoid. Every system page must walk, in order:

1. **Requirements** — functional (what it does) and non-functional (scale,
   latency SLO, consistency, availability, durability). State assumptions.
2. **Capacity estimation** — a `.estimate` block with real back-of-envelope
   math: DAU → QPS (read and write separately, with the read:write ratio),
   storage/year, bandwidth, cache working-set. Numbers drive every later choice.
3. **API design** — concrete endpoint signatures (method, path, params, return).
4. **Data model** — the actual schema/tables/keys, AND **derive the store with a
   ladder, never assert it**. Start from the correct default — **a single SQL
   table** — and show the concrete point where it breaks, then escalate *by the
   access pattern*: point-lookup that outgrows one node → shard, and once you're
   only using SQL as a distributed hash map, → KV/wide-column; scan-few-columns-
   over-many-rows → row store dies on scan I/O → columnar (→ <a>P8</a>);
   write-saturated → LSM (→ P17). The reader must learn *when SQL becomes the
   bottleneck and why this store relieves it*, not "NoSQL because web-scale."
5. **High-level architecture** — a Mermaid diagram + a paragraph walking it.
6. **The write path** — step by step, the components a write touches.
7. **The read path** — step by step, including the cache and its hit-ratio math.
8. **The hard constraint, in depth** — the one axis the naive design dies on,
   and the primitive(s) that relieve it. Cross-link the P-pages. **For the key
   sub-problem(s), use the escalation ladder** (simplest → bottleneck → next),
   not a flat list of options.
9. **Scaling & bottlenecks** — what breaks at 10×, the consequence chain.
10. **Tradeoffs & alternatives** — what you'd change under different constraints.
11. **Real-world example** — how a named company actually built it, with specifics.
12. **Interview follow-ups (Q&A)** — REQUIRED. Anticipate the probing questions a
    real interviewer asks once the main design is on the table, and answer each
    crisply (a derived mini-answer, often itself a small ladder). These are the
    "what about…" deep-dives that separate a memorized answer from understanding,
    e.g. for a task scheduler: *how do you pick the right worker by capacity?*
    (random push → pull-based self-balancing → least-loaded → power-of-two-choices;
    + capability/affinity routing). 3–6 per page, chosen for what that system
    actually gets grilled on.
13. **Key talking points** — the 5–7 sentences that capture the design.
14. **Further reading.**

> **Workflow:** systems are deepened **one at a time, when the user opens that
> system** — don't batch ahead. Take the named system all the way to S14 depth
> (self-contained, ≥2–3 ladders, worked numbers, the Q&A section) before moving on.

Include at least one **worked example** specific to the system (e.g. the URL
shortener: base62-encode a real counter value and show the 7-char output; the KV
store: a quorum read/write with N=3, W=2, R=2 traced). Show schemas as real
field lists, APIs as real signatures.

**Reference exemplars: `systems/s6.html`** (Datadog) and **`systems/s2.html`**
(Kafka) are the closest existing depth, but even these should be lengthened to
the full-interview standard during the pass.

---

## Session recipe (do this each time)

1. Open this file; pick the next `[ ]` page (primitives first, then systems, or
   follow the priority order in the tables — heaviest mechanics first).
2. **Read the target page** and the exemplar (`p8.html` for a primitive,
   `s6.html`/`s2.html` for a system).
3. **Compute, don't invent.** Any bit pattern, hash, base62 output, erasure-code
   reconstruction, or capacity number goes through Python (`mcp__workspace__bash`)
   first so it's exact. Hedge live-drifting facts ("on the order of").
4. **Verify named facts** with `WebSearch` where possible (per CLAUDE.md). If
   search is down, use the fixed published spec and note it in the changelog.
5. **Edit the page body only** — keep top matter (breadcrumb, `<h1>`, summary
   `.field`/`.newprob`/`.prims` blocks), `.prevnext`, and the scripts intact.
   Use the existing CSS classes: `.sec`, `.example`+`.tag`, `.newprob`, `.note`,
   `.estimate` (monospaced — ideal for bit/byte/math blocks), `.tablewrap`>`table`.
   `.estimate` blocks render monospaced; use them for worked records and math.
6. If the page has any Mermaid diagram, the init script is already at the bottom —
   reuse it. Keep diagrams simple (`graph LR/TD`, sequence).
7. **Cross-link generously** to the primitives/systems referenced.
8. **Verify**: from the repo root,
   `sed -n '/<hr>/,/prevnext/p' <file> | sed 's/<[^>]*>//g' | wc -w` for word
   count; check no `TODO`/placeholder remains; confirm internal links resolve.
9. Tick the box here, update the page's word count in the table, add a changelog
   line at the bottom of this file.

**There is no longer a `Plan/docs` duplicate** — `system-design-course/` is the
single source of truth (the git repo published to GitHub Pages). Edit it directly.

---

## Status — Primitives (`primitives/pN.html`)

Order roughly by mechanics weight (do the heavy ones first; they're the best
templates for the rest).

Legend: `[x]` at depth · `[~]` in progress · `[ ]` shallow, needs depth pass

| ✓ | Page | Now | Deepen with (the specific shallow concept to expand) |
|---|------|-----|------------------------------------------------------|
| [x] | **P8** Tiered & columnar | 1634 | DONE — depth exemplar. Gorilla worked bits, encoding table. |
| [x] | **P1** Batching / buffering | 1216 | Already deep (hand-written). Light review only. |
| [x] | **P17** Storage durability / LSM | 1319 | DONE. LSM op trace, three-amplification table, bloom-filter FP math, erasure-coding numbers. Pairs with P8 for TSDB. |
| [x] | **P2** Partitioning / sharding | 970 | DONE. Ladder modulo→consistent-hash→vnodes with measured rebalance (80% vs 18% on 4→5); hot-key split math. |
| [x] | **P3** Replication / consistency | 846 | DONE. Replication ladder (1 copy→single-leader→quorum) with N=3/W=2/R=2 overlap worked; version-vector conflict trace; CAP/PACELC. |
| [x] | **P6** Inverted index | 745 | DONE. Worked index from 3 docs (postings+positions); BM25 scored (doc1/doc3 tie 0.711, long doc 0.152); delta+varint compression; immutable segments. |
| [x] | **P5** Write-vs-read / fan-out | 672 | DONE. Fan-out ladder (read→write→hybrid) with celebrity 100M-write math + hybrid threshold. |
| [x] | **P10** Consensus / fencing | 1132 | DONE. Election ladder (static→single-store lease→consensus); Raft log walkthrough; fencing-token trace; safe ID-allocation + worker-ID leasing (S14 links here). |
| [x] | **P4** Caching | 652 | DONE. Hit-ratio→effective-latency math (90%→2.5ms vs 99%→0.7ms); write-policy table; stampede trace (~1000 concurrent misses → coalesce to 1). |
| [x] | **P7** Scatter-gather / partial agg | 533 | DONE. Worked global top-3 merge; slowest-of-N tail math (100 shards → 63% hit a slow one); shuffle + sketches. |
| [x] | **P9** Idempotency | 985 | DONE. Ladder (at-least-once→at-most-once→key+dedup); concurrent-retry race; unique-constraint state machine; key design + idempotent-by-construction; reconciliation. |
| [x] | **P12** Tail latency | 515 | DONE. Slowest-of-N math (0.99^100=37%); hedge-above-p95 → ~5% extra load, both-slow 0.25%. |
| [x] | **P15** Geospatial indexing | 440 | DONE. Geohash worked (SF → "9q8yyk8"), prefix→cell-size table, neighbor-ring; quad-tree/H3. |
| [x] | **P16** Backpressure | 546 | DONE. Little's Law backlog→latency (15s lag worked); credit-flow trace; lossless→lossy options. |
| [x] | **P14** Saga / compensation | 550 | DONE. Ladder ACID→2PC→saga; worked compensation rollback (ship fails → refund+release). |
| [x] | **P13** Real-time connections | 519 | DONE. Ladder poll→long-poll→WebSocket+registry; connection-memory math (10M conns ≈ 100GB). |
| [x] | **P11** CDN / edge caching | 465 | DONE. Origin-offload math (99% hit → 10x less origin); on-demand vs pre-position fill ladder. |

## Status — Systems (`systems/sN.html`) — full interview-answer standard

| ✓ | Page | Now | Deepen with |
|---|------|-----|-------------|
| [~] | **S6** Distributed log + metrics (Datadog) | 1223 | Closest to depth; lengthen to full-interview standard (capacity math, API, data model). |
| [~] | **S2** Message queue / Kafka | 1132 | Closest to depth; lengthen to full-interview standard. |
| [x] | **S14** URL shortener | 2093 | DONE — systems + escalation-ladder exemplar. §6 code-gen is the ladder (DB auto-increment → Redis INCR → range leasing → Snowflake, each with the load that kills it). Base62 rollover worked, capacity math, API, schema, cache-cascade sequence diagram. |
| [x] | **S3** Key-value store (Dynamo-style) | 1249 | DONE. 3 ladders: partitioning (modulo→ring→vnodes), storage engine (B-tree→LSM), conflict resolution (LWW→version-vector→CRDT) + traced quorum write/read paths, CAP ladder. |
| [x] | **S5** Object store (S3-style) | 921 | DONE. Durability ladder (1→3×→erasure, 1.4×-vs-3×) + metadata-store ladder (SQL→sharded KV, range-partition for LIST); write/read paths + degraded read. |
| [x] | **S17** Payment system | 741 | DONE. Worked double-entry ledger (sums to 0), idempotent charge path, money-movement ladder (ACID→2PC→saga), reconciliation net. |
| [x] | **S4** RDBMS internals + scaling | 891 | DONE. MVCC version-chain worked; explicit scaling ladder (tune→replicas→pool/cache→functional→shard); cross-shard join cost (50× + tail). |
| [ ] | **S15** Ride-sharing / location | 500 | H3 dispatch (→P15); supply/demand matching; driver QuadTree; location-update QPS math; ETA. |
| [x] | **S1** Rate limiter | 801 | DONE. Algorithm ladder (fixed-window 2× burst→sliding log→sliding counter→token bucket, worked) + distributed-counter ladder (local→Redis atomic→hybrid); fail-open/closed. |
| [ ] | **S13** Distributed lock / leader election | 491 | Lease + fencing-token worked (→P10); ZAB/Raft; the Redlock controversy; lock-table schema. |
| [x] | **S12** Distributed task scheduler | 3118 | DONE — reference exemplar. Two-table schema (tasks by id + schedule outbox by time_bucket — fixes the scatter-gather paradox); delivery ladder; delayed-task ladder (poll→time-partition→min-heap→timing wheel) + **failover-storm fix** (bucketed rebuild); lease lifecycle + **prefetch buffer-bloat fix**; **cron concurrency_policy** (Allow/Forbid/Replace); **W3C trace-context** propagation; worker-selection ladder (…JIQ…P2C w/ utilization caveat); 10-Q interview Q&A. |
| [ ] | **S8** Distributed SQL engine | 486 | Query plan → stages → exchange/shuffle; partial agg (→P7); columnar scan (→P8); join strategies; coordinator/worker. |
| [ ] | **S7** Search engine | 470 | Index → shard → query-then-fetch traced (→P6,P7); BM25; segment merge; refresh interval; relevance. |
| [ ] | **S16** Video streaming | 472 | ABR ladder + HLS/DASH chunking; CDN (→P11); transcode pipeline; storage/bandwidth math; start-up latency. |
| [ ] | **S11** Notification system | 472 | Pipeline: dedup → rate-limit → fan-out to APNs/FCM/SMS; device registry; idempotency (→P9); retry/DLQ. |
| [ ] | **S9** Social feed | 482 | Fan-out hybrid (→P5); timeline cache; ranking; capacity math; celebrity problem. |
| [ ] | **S18** Web crawler | 469 | Frontier (BFS + priority); politeness/rate-limit; dedup via bloom filter; DNS cache; trap avoidance; scale math. |
| [ ] | **S10** Chat system | 452 | Message delivery + ordering; fan-out; presence; offline queue; WhatsApp/Erlang connection numbers. |

---

## Reader-facing completion status

The site shows readers what's polished, driven by **one list**: the `COMPLETE`
map at the top of `assets/site.js` (currently `{ "s12.html", "s14.html" }`).
`site.js` then renders, with no per-page edits: a green **Complete** / amber
**Work in progress** banner under each page's `<h1>`, a **legend** + per-tile
**Complete/Draft** badges on the landing page, and status **dots** in the sidebar.
**To publish a page as complete, add its filename to `COMPLETE` in `site.js`** —
keep it in sync with the `[x]` marks below (a page is reader-"complete" only once
it meets the depth bar, not just the structure bar).

## Progress

- Primitives at depth: **17 / 17** ✅ — Part II COMPLETE.
- Systems at depth: **7 / 18** (S1, S3, S4, S5, S12, S14, S17). S2/S6 partial.
- **Total: 24 / 35.** **S12 is the new full-depth exemplar** (1701 w, incl. the
  interview Q&A section).
- **Workflow:** deepen systems **one at a time, when the user opens that system.**
  Remaining: S15, S13, S8, S7, S16, S11, S9, S18, S10 (+ lengthen S2/S6).
- **Length:** full S14-length (1.8–2.8k, self-contained, ≥2–3 ladders, + an
  Interview Q&A section). S1/S3/S4/S5/S17 carry multiple ladders but sit
  ~800–1250 w — a future pass can push them to full length like S12.
- **Convention reminder:** failure modes/failover get detailed in the primitive
  (P10, P9, P16); systems name the failure in one line and link out (see S14 §6).

---

## Changelog

- 2026-06-20 — Created this depth-pass tracker. Defined the two standards
  (primitive "mechanism deep dive" 1.2–1.8k words; system "full interview answer"
  1.8–2.8k words). P8 set as the primitive exemplar; S14 chosen as the systems
  exemplar (user called it out as too shallow).
- 2026-06-20 — Deepened **S14** (URL shortener) 468→1717 w to the full-interview
  standard: requirements table, capacity `.estimate`, API signatures, schema,
  base62 rollover worked example (counter 62^6 → first 7-char code), cache-cascade
  sequence diagram + hit-ratio math, counter-vs-hash table, scaling, tradeoffs,
  talking points. Numbers computed in Python.
- 2026-06-20 — Deepened **P17** (LSM / write internals) 412→1319 w: WAL +
  group-commit, step-by-step LSM op trace (memtable → flush → SSTable → compaction
  with tombstones), three-amplification comparison table, bloom-filter
  false-positive table (8/10/16 bits/key), replication-vs-erasure-coding numbers.
- 2026-06-20 — Added **the escalation ladder** as the core framing (top of file):
  every page derives its solution as simplest → bottleneck-at-a-number → next,
  not a flat menu. Per user feedback (their filtercoffeeway token-generation page).
  Rebuilt **S14 §6** as the exemplar ladder (1717→2093 w total).
- 2026-06-20 — Extended the ladder to the **Data model** step: store choice must
  be derived (single SQL → where it breaks → shard → KV / or columnar by access
  pattern), never asserted. Rebuilt **S14 §4** as the store-selection ladder
  (→2574 w), including the "scan-heavy ⇒ columnar (P8)" branch.
- 2026-06-20 — Per user: the ladder is now **THE #1 rule of the whole course** —
  *any* major decision must be derived, never asserted. Elevated it to the top of
  `CLAUDE.md` and reworded the core framing here. Made the ladder the spine of all
  of **S14**'s major decisions: added the **caching/read-path ladder** in §8
  (read-from-store → Redis → CDN/edge, each with its bottleneck). S14 → 2773 w,
  three rung-recap tables (store, id-gen, caching).
- 2026-06-20 — Established the **failure-mode convention** (detail in primitive,
  link from system) + S14 §6 failover note. Deepened **P10** 438→1132 w (election
  ladder, Raft log walkthrough, fencing trace, safe ID-allocation/worker-ID
  leasing), **P9** 410→985 w (retry ladder, concurrent-race, unique-constraint
  state machine, key design), **P2** 569→970 w (modulo→ring→vnodes with measured
  80%-vs-18% rebalance, hot-key split math). Numbers computed in Python.
- 2026-06-20 — **Part II (all 17 primitives) COMPLETE.** Deepened the remaining
  batch with ladders + computed numbers: **P3** (quorum N=3/W=2/R=2 + version
  vectors), **P4** (hit-ratio latency + stampede), **P5** (fan-out celebrity math),
  **P6** (worked BM25), **P7** (slowest-of-N tail), **P11** (origin offload),
  **P12** (hedge economics), **P13** (connection memory), **P14** (ACID→2PC→saga +
  compensation trace), **P15** (geohash "9q8yyk8"), **P16** (Little's Law). Next:
  Part III systems at the full-interview standard.
- 2026-06-20 — Started **Part III**. Deepened **S3** (KV) 509→925 w (traced
  quorum write/read paths, hinted handoff, read repair, Merkle anti-entropy, CAP
  AP-vs-CP ladder), **S5** (object store) 502→775 w (durability ladder 1→3×→
  erasure with 1.4×-vs-3× overhead math, degraded-read reconstruction), **S17**
  (payments) 511→641 w (worked balanced double-entry ledger, idempotent charge
  path, saga compensation). Convention: these link to P-pages for mechanism depth.
- 2026-06-20 — User wants **full S14-length, self-contained** systems (updated the
  standard). Expanded **S3**→1249 (3 ladders), **S5**→921 (+metadata ladder),
  **S17**→741 (+ACID→2PC→saga ladder); brought **S4**→891 (explicit scaling ladder,
  MVCC version-chain, cross-shard join cost) and **S1**→801 (algorithm ladder +
  distributed-counter ladder, worked token-bucket/fixed-window-burst). 6/18 systems.
- 2026-06-20 — Added **Interview follow-ups (Q&A)** as a required system section
  (anticipate the interviewer's probing "what about…" questions) + set the
  **one-at-a-time, when-the-user-opens-it** workflow. Took **S12** to full S14
  depth (486→1701 w): delivery-semantics ladder, worked lease lifecycle w/ fencing,
  delayed-task ladder, worker-selection-by-capacity ladder, 6-question Q&A. S12 is
  now the full-depth systems exemplar alongside S14.
