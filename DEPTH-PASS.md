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
it, AND field any reasonable follow-up in the area without leaving the page.
**~1,800 words is a FLOOR, not a ceiling — page size and word count are never a
blocker or a reason to cut real content.** Completeness is the bar: if a topic has
more sub-decisions, sampling modes, or interview gotchas worth deriving, add them.
A page that runs long because it fully covers its area (e.g. S6's three pillars
+ push/pull + sampling, ~3.8k words) is *correct*, not bloated. The only thing to
trim is filler — never a derivation, ladder, worked number, or anticipated Q&A.
Be **SELF-CONTAINED**. `systems/s14.html` and `systems/s6.html` are exemplars of
shape: they derive **multiple** major decisions as ladders, each ending in a
`rung → good until → breaks on` table.

> **Self-contained, not link-only.** Cross-link the primitives, but do NOT
> outsource the mechanism to them — *recap the key mechanism inline* (a few
> sentences + a worked `.estimate`) so the page stands alone as an interview
> answer, then link the P-page for the full treatment. A reader should never have
> to open three primitive pages to follow the system. Aim to derive **at least 2–3
> major decisions as ladders** on every system page (storage engine, partitioning,
> replication/consistency, caching, fan-out, transport — whichever the system
> turns on). Lean ~700-word pages that just link out are **below bar** — expand them.
> There is **no upper word limit**: cover the area exhaustively so the reader can answer
> any follow-up. Length is only a problem when it's padding, never when it's depth.

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

**Reference exemplars:** `systems/s12.html` (task scheduler) and `systems/s14.html`
(URL shortener) are the full-depth bar. `s6.html`/`s2.html` are close but should be
lengthened to the same standard during the pass.

### Cross-cutting deep-dive checks (run against EVERY system)

These are generalized "interview gotchas" — lenses that catch the gaps a sharp
reviewer finds. They came out of the S12 review; apply them to every system page
proactively, in the design *and* the Q&A. (Instance from S12 in parens.)

1. **Every major query needs a partition key — or you've designed a
   scatter-gather.** When point-access and a range/time scan hit the same data,
   one partition key can't serve both. Split into two layouts (a base table keyed
   for point ops + a secondary/outbox table partitioned for the scan), kept in
   sync. *Always ask: "which partition does this query hit?" If the answer is
   "all of them," fix it.* (S12: `tasks` by `task_id` **+** `schedule` outbox by
   `time_bucket`; a `task_id`-partitioned due-scan fans out over P7.)

2. **Bound the failover / cold-start cost of any in-memory state.** Anything held
   in RAM and rebuilt from durable store on failover has a recovery time — never
   a full scan. Couple the durable layout to the in-memory structure so the new
   owner loads only the working window. *Ask: "leader dies — how long to rebuild,
   and what's the latency spike?"* (S12: rebuild the heap from only the current/next
   time-bucket → ms, not a 100M-row scan.)

3. **Leases/timeouts age from grant-time, not work-time — beware buffering.** Any
   time you prefetch/batch leased items, their visibility timeout ticks while they
   sit in a buffer → expiry → re-delivery → accidental concurrent execution on a
   *healthy* worker. Cap prefetch; heartbeat *all* held items. (S12 §8 prefetch
   trap; Kafka `max.poll.records`/`max.poll.interval`.)

4. **Any recurring/overlapping trigger needs an explicit policy.** "What if it runs
   long and overlaps the next fire / runs twice / arrives out of order?" must be
   answered, not implicit. (S12: cron `concurrency_policy` = Allow / Forbid /
   Replace, à la K8s CronJob.)

5. **Async/deferred work is a debugging black hole — propagate context.** Carry
   W3C trace context (`traceparent`/`tracestate`) + the idempotency key through the
   queue so a side effect that fires minutes/days later stitches back to the
   originating request in the APM. Add a `context`/`metadata` field to the schema.
   (S12 §10 observability.)

6. **Name the consistency/duplication reality.** Exactly-once *execution* is
   usually unaffordable → at-least-once + idempotent effect + reconciliation; say
   so and show the dedup/fencing that makes re-runs safe (P9/P10).

Not every check fits every system, but each page should consciously pass or
consciously dismiss all six.

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
| [x] | **P18** Distributed sort / external merge (MapReduce) | 1244 | **NEW, not started.** Gap found via Reddit/SystemDesign.io 45-Q audit (2026-06-21) — "sort large datasets" + "coordinate a cluster (botnet)" had no home (closest was P7 scatter-gather, but that's merge of *results*, not a full external/distributed sort). Build: external merge sort (chunk → spill to disk → k-way merge, run-size math), then distributed (MapReduce shuffle: map→partition→sort→reduce, traced); ladder in-memory sort → external merge sort → distributed shuffle-sort, each with the data-size bottleneck that forces the next rung. |
| [x] | **P19** CRDTs (conflict-free replicated data types) | 1204 | **NEW, not started.** Gap: CRDT is currently only *named* (S3 conflict-resolution ladder ends "→ CRDT") and the depth-bar explicitly lists it as jargon that must be unpacked, but no page does so. Build: G-counter/PN-counter worked merge, LWW-register, OR-Set (add/remove tombstone trace), state-based vs op-based CRDTs, why merge must be commutative/associative/idempotent (worked counter-example of a *non*-CRDT merge that diverges). Cross-link from S3's conflict-resolution ladder once built. |
| [x] | **P20** Distributed tracing (spans, sampling, propagation) | 1338 | **NEW, not started.** Gap: tracing is currently folded into S6 §11 (W3C traceparent layout + head/tail sampling) as one system's section, not a standalone mechanism page — so it can't be cross-linked the way P9/P10 are. Build as its own primitive: span/trace data model, context propagation across process/queue/thread-pool boundaries (the W3C traceparent bit layout, baggage), sampling ladder (head → tail → mixed/biased), storage (high-cardinality span store, →P8 columnar), service-map construction. S6 should then link out to this page instead of carrying the full mechanism inline. |

## Status — Systems (`systems/sN.html`) — full interview-answer standard

| ✓ | Page | Now | Deepen with |
|---|------|-----|-------------|
| [x] | **S6** Distributed metrics logging + aggregation (Datadog) | ~3800 | DONE — full three-pillar treatment. 19 sections. Ladders: metric store (SQL→time-partition→LSM→columnar TSDB), source-aggregation (per-call→client→agent→DDSketch), **push-vs-pull collection**, **logs index-vs-archive** ("Logging without Limits" + grok + log-based metrics), **trace head-vs-tail sampling** (W3C traceparent layout, 100GB tail buffer, hash(trace_id)%N routing, RED-from-100%), alerting (query→rollups→stream proc). Two layouts (value blocks by series_id + tag inverted index), worked posting-intersection, DDSketch 576-bucket math, Gorilla 12×, three-pillar correlation, 11-Q Q&A (all 6 cross-cutting checks). |
| [x] | **S2** Message queue / Kafka | 1837 | DONE. Added API + partition-count ladder (table), consumer-group rebalancing (eager vs cooperative/static), 7-Q Q&A; kept the strong existing log/ISR/zero-copy prose. |
| [x] | **S14** URL shortener | 2093 | DONE — systems + escalation-ladder exemplar. §6 code-gen is the ladder (DB auto-increment → Redis INCR → range leasing → Snowflake, each with the load that kills it). Base62 rollover worked, capacity math, API, schema, cache-cascade sequence diagram. |
| [x] | **S3** Key-value store (Dynamo-style) | 1801 | DONE (depth back-fill). 3 ladders (partitioning, storage engine, conflict resolution) + traced quorum paths + CAP ladder + NEW: gossip/φ-accrual membership, tombstone deletes, sloppy quorum, 7-Q Q&A. |
| [x] | **S5** Object store (S3-style) | 1379 | DONE (depth back-fill). Durability ladder + metadata-store ladder + degraded read + NEW: continuous scrub/repair (bit rot, failure domains), 7-Q Q&A. |
| [x] | **S17** Payment system | 1350 | DONE (depth back-fill). Double-entry ledger + idempotent charge + money-movement ladder (ACID→2PC→saga) + reconciliation + NEW: capacity/money-as-int-cents, auth-vs-capture state machine, chargebacks, 7-Q Q&A. |
| [x] | **S4** RDBMS internals + scaling | 1466 | DONE (depth back-fill). MVCC + covering index + NEW isolation-level ladder (RC→RR/SI→serializable, write-skew); scaling ladder; cross-shard join cost; 7-Q Q&A. |
| [x] | **S15** Ride-sharing / location | 2630 | DONE. Geo-index ladder (DB scan→uniform grid→geohash→H3, w/ cell-size tables); write path absorbing 1.25M pings/s + hot-cell fix; matching ladder (greedy→offer lease→batched DISCO assignment); surge + CH routing; Q&A. |
| [x] | **S1** Rate limiter | 1941 | DONE (depth back-fill). Full algorithm family (fixed→sliding log→sliding counter w/ worked weight→token bucket→GCRA) + distributed-counter ladder + atomicity/hot-counter + fail-open/closed + multi-dimensional/concurrency/load-shed + 7-Q Q&A. |
| [x] | **S13** Distributed lock / leader election | 2136 | DONE. Lock ladder over failure modes (DB row→Redis SET NX PX→+fencing→quorum); slow-but-alive hazard; fencing-token trace; sessions/ephemeral/watches + thundering-herd; Redlock controversy in depth; Q&A. |
| [x] | **S12** Distributed task scheduler | 3118 | DONE — reference exemplar. Two-table schema (tasks by id + schedule outbox by time_bucket — fixes the scatter-gather paradox); delivery ladder; delayed-task ladder (poll→time-partition→min-heap→timing wheel) + **failover-storm fix** (bucketed rebuild); lease lifecycle + **prefetch buffer-bloat fix**; **cron concurrency_policy** (Allow/Forbid/Replace); **W3C trace-context** propagation; worker-selection ladder (…JIQ…P2C w/ utilization caveat); 10-Q interview Q&A. |
| [x] | **S8** Distributed SQL engine | 2280 | DONE. Read-less ladder (row→columnar→pushdown→partition prune, 1PB→<100GB); stages/tasks/exchanges; partial agg; join ladder (broadcast→shuffle-hash→sort-merge) w/ network math + skew; vectorized exec; stragglers; Q&A. |
| [x] | **S7** Search engine | 1998 | DONE. Inverted index + BM25 (IDF/TF-sat/length-norm worked); segments + refresh gap + merge; query-then-fetch ladder; distributed-IDF wall (approx vs dfs); tail amplification + two-phase ranking + vector hybrid; Q&A. |
| [x] | **S16** Video streaming | 2011 | DONE. 250 Tbps wall; encoding=batch (chunk-parallel transcode, per-title bitrates) vs serving=CDN; ABR (HLS/DASH static segments + manifest); CDN fill ladder (pull→pre-position→tiered/ISP-embedded); startup/seek; live/DRM; Q&A. |
| [x] | **S11** Notification system | 1700 | DONE. Delivery-semantics ladder (fire-forget→at-least-once→+idempotency key) + Bloom-fronted dedup; priority lanes (critical/transactional/bulk); fan-out + per-channel rate limit (→S1); time-bucketed outbox; device feedback; Q&A. |
| [x] | **S9** Social feed | 1783 | DONE. Fan-out ladder (pull→push→hybrid) w/ celebrity 100M-write math + threshold derivation; Redis sorted-set timeline cache; hot-author/celebrity (→P2); chronological vs ML candidate-gen+re-rank; Q&A. |
| [x] | **S18** Web crawler | 1997 | DONE. Frontier ladder (FIFO→priority→two-level priority-front+per-domain-back w/ politeness heap→sharded by domain); politeness; exact Bloom + SimHash near-dup (worked); mandatory DNS cache; traps; recrawl by change-freq; Q&A. |
| [x] | **S10** Chat system | 1860 | DONE. Transport ladder (poll→long-poll/SSE→WebSocket); routing registry wall (user→gateway, TTL'd, rebuilt from clients on failover); per-conversation seq; receipts as separate stream; at-least-once+client_msg_id dedup; presence firehose; groups/multi-device; Q&A. |
| [x] | **S19** Search autocomplete / Typeahead | 2649 | NEW page (built straight to depth). Match-structure ladder (sorted array→trie w/ top-k at node→FST→+Levenshtein); partition ladder (single→first-letter TRAP→hash(prefix)→replicate+edge-cache head→two-tier); freshness lambda/kappa (batch base + streaming speed layer: CMS+heavy-hitters+decay, merge at serve); candidate-gen→re-rank ranking; Interview Q&A. Sibling of S7. |
| [x] | **S20** Authentication & authorization | 2245 | DONE (built from stub to depth). Password ladder (plaintext→fast hash→salted→Argon2/bcrypt cost+memory-hard, w/ attacker math); session-state ladder (sticky→shared store→stateless JWT→short-JWT+revocable refresh); refresh rotation+reuse detection; OAuth2/OIDC+PKCE; MFA + login rate-limit (→S1); authz RBAC→ReBAC/Zanzibar; Q&A. |
| [x] | **S21** Booking / reservation system | 2114 | DONE (built from stub to depth). Overbooking ladder (read-then-write→optimistic version CAS→row lock→distributed lease+fence→partition contention); double-booking race traced; search-stale vs book-linearizable split (→P3); hold/TTL/confirm state machine (lease ages from grant time); idempotent confirm + payment saga (→P9,P14); flash-sale waiting room; deliberate overbooking; Q&A. |
| [x] | **S22** Top-K trending topics | 3884 | DONE — built straight to depth (Twitter trends). 3 ladders: counting (per-event DB INCR hot-key → in-RAM exact map ~3.8 GB unbounded → **CMS + Misra-Gries/Space-Saving** ~74 KB constant-in-cardinality), top-K (sort-on-read → min-heap K → **per-shard top-K + K′=cK over-fetch scatter-gather**, →P7), windows (tumbling 1-min buckets + hierarchical rollup → lazy **exponential decay**). Key differentiator vs a leaderboard: **trending = surge not volume** (z-score/ratio vs per-topic baseline + volume floor; HLL distinct-user count for spam). Worked: CMS min-corrects #t5 collision, MG retention bound, distributed-merge #y-miss + over-fetch fix, decay trace, z-score table. All numbers Python-computed. Cross-cutting checks all addressed. Sibling of S19 (write-heavy mirror) / S6 / S7.

---

## Reader-facing completion status

The site shows readers what's polished, driven by **one list**: the `COMPLETE`
map at the top of `assets/site.js` (now: all 20 primitives + systems S2, S6, S7,
S8, S9, S10, S11, S12, S13, S14, S15, S16, S18, S19, S20, S21, S22 — S1/S3/S4/S5/S17
deliberately left draft pending a depth back-fill).
`site.js` then renders, with no per-page edits: a green **Complete** / amber
**Work in progress** banner under each page's `<h1>`, a **legend** + per-tile
**Complete/Draft** badges on the landing page, and status **dots** in the sidebar.
**To publish a page as complete, add its filename to `COMPLETE` in `site.js`** —
keep it in sync with the `[x]` marks below (a page is reader-"complete" only once
it meets the depth bar, not just the structure bar).

## Progress

- Primitives at depth: **20 / 20** (P1–P20 ✅).
- Systems at depth: **22 / 22** (S1–S22 ✅; S1/S3/S4/S5/S17 depth back-fill done
  2026-06-23 — each now has the full algorithm-family + a dedicated Interview Q&A).
- **Total: 42 / 42 — the depth pass is COMPLETE.** **S12/S14/S19/S22 are the
  full-depth exemplars** (S12 incl. the interview Q&A section; S22 is the
  write-heavy/approximate-counting exemplar).
- **Remaining work:** none for the depth pass. Future polish only: optional
  diagrams, web-re-verification of company-specific numbers, copy edits.
- **Length:** ~1.8k words is a **floor, not a ceiling — page size is never a blocker.**
  Cover the area completely (S6 runs ~3.8k for the full three-pillar treatment and that's
  correct). Self-contained, ≥2–3 ladders, + an Interview Q&A section. S1/S3/S4/S5/S17 carry
  multiple ladders but sit ~800–1250 w — a future pass can push them to full depth like S6/S12.
- **Convention reminder:** failure modes/failover get detailed in the primitive
  (P10, P9, P16); systems name the failure in one line and link out (see S14 §6).

---

## Changelog

- 2026-06-23 — **Depth back-fill of S1, S3, S4, S5, S17 → depth pass COMPLETE (42/42).**
  Brought the five remaining structure-bar systems to full S6/S12 depth, each gaining a
  dedicated **Interview follow-ups (Q&A)** section + deeper algorithm-family unpacking:
  **S1** rate limiter (801→1941 w): full algorithm family incl. sliding-window-counter
  worked weighting + GCRA, hot-counter shard fix, multi-dimensional/concurrency/load-shed
  limiters. **S3** KV store (1249→1801 w): added gossip + φ-accrual membership, tombstone
  deletes (resurrection hazard), sloppy quorum. **S4** RDBMS (891→1466 w): added the
  isolation-level ladder (RC→RR/SI→serializable, write-skew) + covering/index-only scans.
  **S5** object store (921→1379 w): added continuous scrub/repair (bit rot, failure
  domains) — durability as a process not a number. **S17** payments (741→1350 w): added
  capacity + money-as-integer-cents, the authorize-vs-capture state machine, chargebacks.
  Marked all five complete in site.js COMPLETE map (now all 20 primitives + all 22
  systems) and updated the legend. All links verified resolving; no placeholders.

- 2026-06-23 — **Big depth pass: 10 systems + S2 lengthen + 3 new primitives → 37/42.**
  Deepened to full interview-answer standard (each self-contained, multiple derived
  ladders, worked Python-computed numbers, a dedicated Interview Q&A, all six
  cross-cutting checks considered): **S15** ride-sharing (geo-index ladder DB→grid→
  geohash→H3; 1.25M pings/s write path + hot cell; matching ladder greedy→lease→
  batched DISCO), **S13** distributed lock (lock ladder over failure modes; slow-but-
  alive; fencing trace; Redlock controversy), **S8** distributed SQL (read-less ladder
  1PB→<100GB; join ladder broadcast→shuffle-hash→sort-merge; shuffle/skew/stragglers),
  **S7** search (BM25 worked; query-then-fetch; distributed-IDF wall; two-phase rank),
  **S16** video (250 Tbps wall; encode=batch vs serve=CDN; ABR; CDN fill ladder),
  **S11** notification (delivery-semantics ladder + Bloom dedup; priority lanes;
  provider pacing), **S9** social feed (fan-out ladder w/ celebrity math + threshold),
  **S18** crawler (two-level frontier ladder; Bloom+SimHash; DNS cache; traps; recrawl),
  **S10** chat (transport ladder; routing-registry wall; per-conv seq; presence firehose),
  **S20** auth (built from stub: password ladder; session-state ladder; refresh rotation;
  OAuth/OIDC+PKCE; authz RBAC→Zanzibar), **S21** booking (built from stub: overbooking
  ladder; double-booking race; search/book consistency split; hold-TTL; saga). Lengthened
  **S2** Kafka to full standard (+API, partition-count ladder, rebalancing, Q&A).
  Built **P18** distributed sort/external merge (run-gen + k-way merge + MapReduce shuffle;
  replacement selection; skew), **P19** CRDTs (G-/PN-counter, LWW, OR-Set worked merges;
  commut/assoc/idempotent law + non-CRDT counter-example; state vs op-based), **P20**
  distributed tracing (span/trace model; W3C traceparent 55-char layout; sampling ladder
  head→tail→metrics-from-100%; columnar span store; service map). Wired site.js (primitives[]
  +3, COMPLETE map → all 20 primitives + 17 systems, generic legend), index.html (P18–P20
  tiles + matrix rows), p17→p18 prevnext. All numbers Python-computed; all internal links
  verified resolving; no placeholders remain. Remaining: depth back-fill of S1/S3/S4/S5/S17.

- 2026-06-21 — **Built S22 Top-K trending topics straight to depth** (3884 w, new
  full-depth exemplar) answering the "Twitter trending topics / top-K / most-shared
  in last hour" question. Three derived ladders: **counting** (per-event DB INCR →
  in-RAM exact map ~3.8 GB & unbounded → Count-Min Sketch + Misra-Gries/Space-Saving
  ~74 KB *constant in cardinality*), **top-K** (sort-on-read → size-K min-heap →
  per-shard local top-K + **K′=cK over-fetch scatter-gather merge**, →P7), **windows**
  (tumbling 1-min buckets + hierarchical rollup → lazy exponential decay). The
  load-bearing distinction from a plain leaderboard: **trending = surge, not volume**
  — rank by z-score/ratio vs a per-topic baseline + volume floor (HLL distinct-user
  count for spam resistance). Worked examples all Python-computed: CMS min-correcting
  a #t5 collision (904→4), Misra-Gries N/(m+1) retention, the distributed-merge #y-miss
  and its over-fetch fix, the decay trace, the z-score table (#Election 40× vs #love
  1.04×). All six cross-cutting checks addressed. Framed as the **write-heavy mirror of
  S19** (autocomplete is read-heavy). Wired: index tile #22 + study-sequence line,
  sidebar (site.js systems[] + COMPLETE), s19 prevnext → s20. Also created **draft stubs
  s20 (auth) and s21 (booking/reservation)** so Part III numbering stays contiguous (1–22)
  and no nav link 404s — both are WIP skeletons seeded from their backlog sketches, not
  full builds (still to be deepened one-at-a-time per workflow).
- 2026-06-21 — **Gap audit against the "45 curated system design questions"
  list** (Reddit r/leetcode → SystemDesign.io/Medium, mapped question-by-question
  against all 19 systems + 17 primitives). Added **6 new backlog entries** for
  topics with no existing page: primitives **P18** (distributed sort / MapReduce),
  **P19** (CRDTs — currently only named in S3's conflict-resolution ladder, never
  unpacked), **P20** (distributed tracing — currently folded into S6 §11 only,
  not a standalone cross-linkable mechanism); systems **S20** (authentication &
  authorization — notable gap, one of the most commonly asked real interview
  questions), **S21** (booking/reservation — inventory contention under
  concurrency), **S22** (top-K / real-time leaderboard — showed up twice in the
  45-Q list, top-shared-articles-by-window and bestseller rankings, with no
  home). Not built yet — backlog rows only, each with the ladder/mechanism sketch
  to follow when picked up. New totals: 20 primitives, 22 systems, 42 pages
  overall (26 still at depth).
- 2026-06-21 — **Added S19 Search autocomplete / Typeahead** (NEW 19th system, ~2.65k w, built
  straight to depth). Maps the "how does YouTube/Google search work" interview question to the
  as-you-type suggestion problem (vs full retrieval = S7). Three derived ladders: match structure
  (sorted array→trie-with-top-k-at-node→FST→+Levenshtein), partitioning (single→first-letter
  TRAP→hash(prefix)→replicate+edge-cache the head→two-tier trie), freshness (lambda/kappa: daily
  batch base + streaming speed layer w/ Count-Min Sketch + heavy-hitters + time decay, merged at
  serve). Capacity math computed in Python (~347k avg/~1M peak QPS, ~2 TB materialized index, top
  ~10k prefixes ≈ 50–70% of traffic). Wired: index tile #19 + study-sequence line, sidebar
  (site.js systems[] + COMPLETE), S18 prevnext → S19. Sibling cross-links with S7.
- 2026-06-21 — **Expanded S6 to the full three-pillar treatment** (~2.4k→~3.8k w, 15→19
  sections) per user ("as much detail as possible; should be able to answer any follow-up").
  Added: **§6 push-vs-pull collection** (Datadog push because SaaS can't scrape into customer
  nets; Prometheus pull for owned networks + free down-detection); **§10 logs pipeline in
  depth** (grok parse worked example, index-vs-archive ladder = "Logging without Limits",
  rehydration, log-based metrics, exclusion filters, search = inverted index → S7/P6);
  **§11 tracing in depth** (span/trace model, W3C traceparent 55-char bit layout, head-vs-
  tail sampling ladder with 100 GB tail buffer + hash(trace_id)%N routing + decision_wait,
  RED-metrics-from-100%-before-sampling, service map); **§12 three-pillar correlation** on
  trace_id+tags w/ exemplars. Q&A grown to 11. Requirements now lead with the three-pillar
  shape table; capacity adds logs (864 TB/day) + traces (864 TB/day, sampling) math. Numbers
  Python-computed; head/tail sampling + DDSketch + Gorilla web-verified. Also **reframed the
  word-count guidance** (CLAUDE.md + this file): page size is a floor, never a blocker/ceiling
  — cover the area completely, trim only padding.
- 2026-06-21 — Deepened **S6** (distributed metrics logging & aggregation / Datadog)
  1223→~2400 w to full S14/S12 standard, and reframed it to answer "Design a
  Distributed Metrics Logging and Aggregation System" generically (Datadog as the
  real-world example). Full template walk (requirements→capacity→API→data model→
  architecture→write path→read path→hard constraint→alerting→scaling→tradeoffs→
  real example→Q&A→talking points→reading). **3 ladders:** store
  (SQL→time-partition→LSM→columnar TSDB, derived by access pattern), source
  aggregation (per-call 4×10^10/s→client→agent 10s→DDSketch), alerting
  (query-store→rollups→stream processor). **Two layouts** (value blocks by series_id
  + tag-partitioned inverted index) fixes the point-vs-scan partition-key paradox.
  Worked: posting-list intersection [47,91,140], DDSketch 576-bucket math (γ=1.0202,
  1% rel-err), Gorilla 16B→~1.37B/pt (~12×), 63% fan-out tail. **8-Q Q&A** addresses
  all 6 cross-cutting checks (partition-key, bounded head-block WAL replay, event-vs-
  arrival-time/late data, at-least-once idempotent points, alert-overlap single-flight,
  trace_id correlation). Numbers computed in Python; DDSketch/Gorilla facts web-verified.
  Marked reader-complete in `site.js` COMPLETE map.
- 2026-06-21 — From a deep S12 review (user-found gaps), added **"Cross-cutting
  deep-dive checks"** (6 generalized interview gotchas: partition-key-or-scatter-
  gather, bounded failover rebuild, lease-ages-while-buffered, recurring-overlap
  policy, async trace-context propagation, name-the-duplication-reality). Run them
  against every system. Also folded all six fixes into **S12** (now 3118 w): two-
  table schema (tasks + time-bucketed schedule outbox), failover-storm bucketed
  rebuild, prefetch buffer-bloat fix, cron `concurrency_policy`, W3C trace context.
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
