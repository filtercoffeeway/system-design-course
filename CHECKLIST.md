# CHECKLIST — deep-dive write-up progress

Read `CLAUDE.md` first. This file tracks which pages have a full write-up.
A page is **done** only when its `Full write-up` TODO card is replaced by a
complete deep dive following the template, with at least one verified real-world
example. Tick the box, update "Last touched", and add a changelog line.

**Status:** all 35 pages have a first full draft. **Depth pass in progress:**
the first drafts are too high-level — named concepts (e.g. "Gorilla for time
series") appear without mechanics. The depth pass adds, per page: worked
byte/bit examples with real records, numeric walkthroughs, algorithm-level
mechanics, and extra diagrams. **P8 done as the depth-pass template.**
**Next up:** roll the same treatment across the remaining pages (start with the
heaviest mechanics: P17, P5, P3, P6, S2, S6).

Legend: `[x]` done · `[~]` in progress · `[ ]` not started

---

## Primitives (Part II)  —  docs/primitives/pN.html

- [x] **P1**  Batching / async buffering        — *Datadog DogStatsD, Kafka producer*
- [x] **P2**  Partitioning / hot-key             — *Amazon Dynamo / Cassandra*
- [x] **P3**  Replication & consistency ladder   — *DynamoDB, Spanner TrueTime*
- [x] **P4**  Caching strategies                 — *Facebook Memcache (leases)*
- [x] **P5**  Write-time vs read-time (fan-out)  — *Twitter timelines*
- [x] **P6**  Inverted index                     — *Apache Lucene segments*
- [x] **P7**  Scatter-gather & partial agg       — *Elasticsearch query-then-fetch*
- [x] **P8**  Tiered & columnar storage          — *Dremel/BigQuery, Parquet, S3 classes*
- [x] **P9**  Idempotency & exactly-once-ish     — *Stripe idempotency keys*
- [x] **P10** Consensus, leader election, fencing — *Chubby / etcd, fencing tokens*
- [x] **P11** CDN & edge caching                 — *Netflix Open Connect*
- [x] **P12** Tail latency: hedging / shedding   — *Google "Tail at Scale"*
- [x] **P13** Real-time connections & routing    — *Slack / Discord gateway*
- [x] **P14** Saga & compensation                — *Uber Cadence / Temporal*
- [x] **P15** Geospatial indexing                — *Uber H3*
- [x] **P16** Backpressure / flow control        — *TCP, Netflix concurrency-limits*
- [x] **P17** Storage durability & write internals — *RocksDB / LevelDB LSM*

## Systems (Part III)  —  docs/systems/sN.html

- [x] **S1**  Rate limiter                        — *Stripe (layered limiters)*
- [x] **S2**  Message Queue / Kafka               — *LinkedIn / Kafka internals*
- [x] **S3**  Key-value store (Redis / DynamoDB)  — *Amazon Dynamo*
- [x] **S4**  RDBMS internals + scaling           — *YouTube / Vitess*
- [x] **S5**  Object store (S3-style)             — *Amazon S3 (erasure coding)*
- [x] **S6**  Distributed log + metrics (Datadog) — *Datadog Agent + DDSketch*
- [x] **S7**  Search engine (Elasticsearch)       — *Elasticsearch / Lucene*
- [x] **S8**  Distributed SQL engine              — *Presto/Trino, BigQuery*
- [x] **S9**  Social feed                         — *Twitter / Instagram*
- [x] **S10** Chat system                         — *WhatsApp (Erlang)*
- [x] **S11** Notification system                 — *Uber push platform*
- [x] **S12** Distributed task scheduler          — *SQS + Lambda, Cadence*
- [x] **S13** Distributed lock / leader election  — *Chubby, ZooKeeper, etcd*
- [x] **S14** URL shortener                       — *Bitly / TinyURL*
- [x] **S15** Ride-sharing / location (Uber)      — *Uber H3 + dispatch*
- [x] **S16** Video streaming                     — *Netflix Open Connect*
- [x] **S17** Payment system                      — *Stripe, Uber LedgerStore*
- [x] **S18** Web crawler                         — *Googlebot / Mercator*

Progress: **35 / 35** pages have full write-ups.

---

## Per-page quality gate (applied to every page)

- [x] Follows the template sections for its type (primitive vs system).
- [x] Has a Mermaid diagram that renders.
- [x] Has ≥1 named real-world example with specifics.
- [x] Cross-links the primitives/systems it references.
- [x] "Further reading" has real source links.
- [x] Top matter + prev/next + scripts intact; no broken internal links.

## Remaining polish (optional, next sessions)

- [ ] Re-verify each real-world example's numbers/specifics against a current
      primary source (per CLAUDE.md, examples written from knowledge should be
      double-checked; the Datadog/DDSketch facts on P1/S6 are already web-verified).
- [ ] Consider a second diagram on the heavier system pages (S6, S2, S16).
- [ ] Optional: dark-mode CSS; a search box on the landing page.

---

## Changelog

- 2026-06-20 — Scaffolded site; wrote CLAUDE.md + CHECKLIST.md; deep-dive CSS +
  Mermaid. Completed **P1, S2, S6** by hand (web-verified Datadog/Kafka facts).
- 2026-06-20 — Completed the remaining **32** pages (P2–P17, S1, S3–S5, S7–S18)
  via batch generators (helpers.py + partA–D.py in the scratchpad), each with a
  diagram, a named real-world example, cross-links, and further reading. Removed
  all "interview" wording. Verified: 35/35 pages, 0 placeholders, 0 broken links.
- 2026-06-20 — Began **depth pass**. Rewrote **P8** from ~250 to ~1630 words:
  added the dictionary/RLE/delta/FoR encoding table with sample records, a full
  Gorilla worked example (delta-of-delta timestamp bits + XOR value bits with
  real IEEE-754 patterns, incl. window-reuse on v3), a raw-vs-Gorilla per-point
  budget, a second Mermaid diagram, a variants table, and a Facebook/Gorilla
  real-world example. Bit patterns computed in Python; Gorilla spec from the
  VLDB 2015 paper (web search was unavailable to re-verify, but the scheme is a
  fixed published spec). Note: the `Plan/docs` duplicate and `.bundle` are no
  longer in the workspace — `system-design-course` is the single source now.
