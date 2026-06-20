# System Design Curriculum

## A bottleneck-first, composable curriculum

The goal is not to memorize 50 problems. It is to build a **mix-and-match toolkit**:
given any system — including one you've never seen — you locate the bottleneck,
reach for the right primitive, and reason about the *new* bottleneck that primitive
introduces. The 18 named systems are not the curriculum; they are the case studies
that prove each primitive in a real domain.

---

## How to use this document

It has three parts, indexed in the order you actually work through a design:

1. **Part I — The Bottleneck Catalog.** The diagnosis layer. Given a symptom,
   what levers exist and what each one costs you. This is the table you run in
   your head when you hit a wall.
2. **Part II — The Primitives.** The composable building blocks. Each is
   self-contained: what it is, when to reach for it, the new problem it hands
   you, and which systems exemplify it. *These are the units you will split into
   one document each.*
3. **Part III — The Systems.** The 18 case studies. Each now leads with its
   **hard constraint** (the one axis where the naive design dies) and tags the
   **primitives it exercises**, so a system is just a particular composition of
   primitives under a particular dominant constraint.

The skill this trains: a system is `(dominant bottleneck) + (the primitives you
compose to relieve it) + (the secondary bottlenecks that composition creates)`.

---

# Part I — The Bottleneck Catalog

This is the heart of mix-and-match. Read it as: **you observe a symptom → you
have candidate levers → each lever hands you a new problem to defend.** No lever
is free. Naming the cost you're accepting is the move that matters.

| Symptom (the bottleneck) | Candidate levers | New bottleneck each lever introduces |
|---|---|---|
| **Write throughput too high** | Batch/async buffer; log-structured (LSM) writes; partition the write key; pre-aggregate at source | Lost ordering; partition skew (hot partition); compaction cost; loss of raw detail |
| **Read latency too high** | Cache (cache-aside/write-through); read replica; denormalize; precompute (fan-out on write); CDN/edge | Cache invalidation + stampede; replication lag (stale reads); write amplification + storage blowup; staleness at edge |
| **One write fans out to many readers** | Fan-out on write (push); fan-out on read (pull); hybrid by node degree | Storage linear in followers + hot-user problem (push); slow reads (pull); complexity of the split (hybrid) |
| **A single key/partition is hot** | Split the key (sharding the shard); request coalescing/dedup; dedicated cache replica; hybrid fan-out | Recombination logic; cache consistency; detecting which keys are hot in real time |
| **Cross-shard joins / queries** | Denormalize; co-locate data by shard key; scatter-gather then merge | Write amplification; rigid access patterns; fan-out reads + tail latency |
| **Full scan over huge dataset (analytics)** | Columnar storage; predicate/projection pushdown; partition pruning; MPP parallelism | Shuffle (network) becomes the bottleneck; planning complexity; bad plans on bad stats |
| **Search/lookup over a large corpus** | Inverted index; secondary indexes; precomputed materialized views | Near-real-time gap (index lag); distributed IDF/global-stats problem; index storage cost |
| **Storage cost growing unbounded** | Tiered storage (hot→warm→cold); erasure coding vs replication; compression; retention/TTL | Latency on cold tier; reconstruction cost (erasure); CPU for (de)compression; data gone after TTL |
| **Need coordination / a single leader** | Consensus (Raft/Paxos); distributed lock; leader election | Quorum-majority latency; the slow-but-alive lock holder → need fencing tokens |
| **Need exactly-once / no double effect** | Idempotency keys; dedup table written transactionally; saga + compensation | Can't truly guarantee across external systems → settle for at-least-once + idempotent; reconciliation cost |
| **Real-time push to clients** | Persistent connections (WebSocket/SSE); stateful connection servers | Connection-state routing (which server holds user X?); reconnection/dedup |
| **Tail latency (p99/p999) too high** | Hedged/backup requests; aggressive timeouts; load shedding; backpressure | Wasted duplicate work; dropped/rejected requests; upstream must handle "slow down" |
| **Geo / proximity queries** | Geohash / quad-tree bucketing | Radius-vs-result-set precision tradeoff (hash length); boundary cells |
| **Producer outpaces consumer** | Backpressure; bounded buffers; drop/sample; durable queue as shock absorber | Data loss (drop); unbounded queue lag; end-to-end latency grows |

**How to drive it:** state the dominant bottleneck →
pick a lever → immediately name the new bottleneck it creates → decide whether
that new one is acceptable or needs its own lever. That chain *is* the design.

---

# Part II — The Primitives

Each primitive below is a standalone unit (your next step: one document each).
The template is deliberately uniform so the docs compose:

- **What it is**
- **Reach for it when** — the symptom
- **The lever** — the core mechanism and its variants
- **The new problem it hands you** — consequence chaining
- **Exemplified by** — systems where this is the star

---

## P1. Batching / async buffering

**What it is:** absorbing bursts and amortizing per-item overhead by grouping
work and decoupling producer from consumer in time.

**Reach for it when:** write throughput is too high, or a downstream is slower
or less available than the upstream.

**The lever:** client/agent-side batching; an in-memory or durable buffer
(queue/log) between stages; pre-aggregation at the source before the wire.

**The new problem it hands you:** added latency (a batch waits to fill); lost or
weakened ordering; the buffer itself becomes state you must size, persist, and
back-pressure (see [P16](#p16-backpressure--flow-control)).

**Exemplified by:** Rate limiter, Kafka, Datadog, Notification.

---

## P2. Partitioning / sharding (and the hot-partition problem)

**What it is:** splitting data or load across nodes so no single node is the
ceiling.

**Reach for it when:** a dataset or write rate exceeds one node; or you need
parallelism.

**The lever:** partition by key (co-locates related data, enables ordering per
key), by hash (even spread), by range (range scans), or directory-based.
Consistent hashing minimizes redistribution on topology change.

**The new problem it hands you:** **skew — the hot partition/hot key.** Even
spread on average says nothing about the worst key. A celebrity, a viral URL, a
hot geo-cell, or a single high-traffic tenant lands on one partition and recreates
the single-node bottleneck you tried to escape. Mitigations: split the hot key,
coalesce requests, give it a dedicated cache, or go hybrid. Detecting which keys
are hot, in real time, is its own problem. Cross-partition queries/joins also
become expensive (see [P7](#p7-scatter-gather--partial-aggregation)).

**Exemplified by:** Kafka, KV store, RDBMS scaling, Search, Social feed
(celebrity), Ride-sharing (hot cell).

---

## P3. Replication & the consistency ladder

**What it is:** keeping copies of data for durability, availability, and read
scale — and choosing how consistent those copies must be.

**Reach for it when:** you need to survive node loss, serve more reads, or place
data near users.

**The lever:** replication models — single-leader (simple, lag on followers),
multi-leader (write-anywhere, conflict resolution), leaderless/quorum
(Dynamo-style R+W>N). The **consistency ladder** is the dial you turn:
strong → bounded-staleness → read-your-writes → eventual. CAP says under
partition you pick availability (stale, AP) or consistency (error, CP).

**The new problem it hands you:** **replication lag** → read-after-write
anomalies (you write to primary, read a stale replica). Multi-leader/leaderless
→ write conflicts needing version vectors/vector clocks or last-writer-wins.
Stronger consistency → higher latency and lower availability under partition.

**Exemplified by:** KV store, RDBMS scaling, Kafka (ISR), Object store.

---

## P4. Caching strategies

**What it is:** a fast tier in front of a slow one, exploiting locality.

**Reach for it when:** reads dominate writes and read latency is the complaint
(the URL shortener is 1000:1 reads:writes — it is a caching problem wearing a
storage costume).

**The lever:** placement (client, edge/CDN, app-tier, DB buffer pool); write
policy — cache-aside (lazy, app manages), write-through (consistent, slower
writes), write-back (fast writes, risk on crash); eviction (LRU/LFU/TTL).

**The new problem it hands you:** **invalidation** ("one of the two hard
problems") — stale data when the source changes. **Stampede / thundering herd** —
a hot key expires and N requests hit the origin at once (mitigate: request
coalescing, probabilistic early refresh, locks). Cold-start misses. Memory cost.

**Exemplified by:** URL shortener, Video (CDN), Social feed (timeline in Redis),
Chat (presence/routing lookup), KV store (Bloom filter avoids disk for misses).

---

## P5. Write-time vs read-time cost (fan-out & precomputation)

**What it is:** the choice of *when* you pay for an answer — eagerly at write
(precompute) or lazily at read (compute on demand).

**Reach for it when:** a single event must be reflected to many consumers, or an
expensive query is read far more than its inputs change.

**The lever:** fan-out on write / materialize (fast reads, expensive writes,
storage grows with audience); fan-out on read / compute-on-demand (cheap writes,
slow reads); hybrid based on node degree or query frequency. Write-time rollup
vs read-time aggregation is the same dial for metrics.

**The new problem it hands you:** push → storage blows up and the **hot
producer** (celebrity) makes a single write trigger millions of fan-out ops
synchronously. Pull → read latency and repeated recomputation. Hybrid → you now
maintain two code paths and a classifier for which nodes are "hot."

**Exemplified by:** Social feed, Datadog (write- vs read-time rollup), URL
shortener (analytics), Notification.

---

## P6. Inverted index

**What it is:** a map from term → list of documents containing it, so you find
matches without scanning the corpus.

**Reach for it when:** you need full-text or faceted search, or lookups over a
high-cardinality attribute space (tags).

**The lever:** tokenize/stem → posting lists with term frequency + position;
TF-IDF/BM25 for relevance ranking; immutable segments merged in the background
rather than in-place updates.

**The new problem it hands you:** **near-real-time gap** — newly written data
isn't searchable until indexed/refreshed. **Distributed IDF** — each shard knows
only local term stats, so global relevance needs a stats pass or approximation.
Index storage and cardinality cost.

**Exemplified by:** Search engine, Datadog (inverted index on tag space).

---

## P7. Scatter-gather & partial aggregation

**What it is:** fan a query out to all shards, compute partials locally, merge
centrally.

**Reach for it when:** the answer spans partitions (search ranking,
group-by/aggregate, cross-shard query).

**The lever:** push computation to the data (partial aggregates, top-K per
shard), then combine; minimize what crosses the network.

**The new problem it hands you:** **the slowest shard sets the latency** (tail
latency, see [P12](#p12-tail-latency-hedging--load-shedding)); **shuffle** (data
redistribution for joins/group-by) becomes the dominant cost; partial results
can be approximate (local-only stats).

**Exemplified by:** Distributed SQL engine, Search, Datadog (MPP query).

---

## P8. Tiered & columnar storage

**What it is:** matching the storage format and medium to the access pattern and
the data's age.

**Reach for it when:** storage cost grows unbounded, or analytical scans read
few columns over many rows.

**The lever:** columnar layout (Parquet/ORC) so you read only projected columns;
compression (Gorilla for time series); immutable time-partitioned blocks;
lifecycle tiers hot→warm→cold (Standard→IA→Glacier) by access-frequency decay.

**The new problem it hands you:** cold-tier read latency; (de)compression CPU;
columnar is great for scans but poor for point writes/updates; immutability means
updates become append + compaction.

**Exemplified by:** Datadog, Distributed SQL, Object store, Video.

---

## P9. Idempotency & "exactly-once-ish"

**What it is:** making a repeated operation safe so retries don't double-apply.

**Reach for it when:** any at-least-once delivery, retry, or external side effect
(charge a card, send a push).

**The lever:** idempotency key carried by the client; a dedup table written
**transactionally** with the effect `(key, result)`; idempotent worker logic so
re-execution converges to the same state.

**The new problem it hands you:** you can't get true exactly-once across systems
you don't control (FCM, Stripe, the bank) — settle for at-least-once + idempotent
+ **reconciliation** to catch drift. The dedup table is itself state to scale and
expire.

**Exemplified by:** Task scheduler, Notification, Payment.

---

## P10. Consensus, leader election & fencing

**What it is:** getting distributed processes to agree, or to elect one leader,
despite failures.

**Reach for it when:** you need mutual exclusion, a single writer, or a single
cron firer.

**The lever:** Raft/Paxos — a majority quorum agrees; on leader failure a new
leader is elected. A lock is a leader-with-metadata. Watches notify on release
without polling. Session/heartbeat TTL detects a dead holder.

**The new problem it hands you:** **the slow-but-alive holder** — a GC pause or
network blip means a process still "holds" the lock while another takes over.
TTL tuning can't fix this; **fencing tokens** (monotonic, reject stale) solve the
correctness problem. Quorum adds latency; minority partitions can't make progress.

**Exemplified by:** Distributed lock (ZooKeeper/etcd), Task scheduler (cron
firer), Kafka (controller).

---

## P11. CDN & edge caching

**What it is:** serving bytes from a node geographically close to the user, so
origin only sees cache misses.

**Reach for it when:** large static assets at high concurrency, or any read-heavy
content with geographic spread.

**The lever:** origin populates the CDN; CDN serves users; the design question
becomes "what populates the edge and how is it invalidated?" — not "how do I serve
it?" 301 (cached forever, cheap, kills analytics) vs 302 (always hits you,
countable).

**The new problem it hands you:** edge staleness/invalidation; cache-miss
stampede on origin; cost of cache fill for long-tail (rarely-watched) content.

**Exemplified by:** Video streaming, URL shortener.

---

## P12. Tail latency: hedging & load shedding

**What it is:** defending p99/p999 when the average is fine but the worst case
isn't — especially in any scatter-gather where the slowest of N dominates.

**Reach for it when:** fan-out reads, SLO-bound APIs, or any "the median is fast
but users complain" situation.

**The lever:** hedged/backup requests (send a second after a delay, take the
first to return); tight timeouts + retries with budgets; load shedding (reject
early when overloaded); request prioritization.

**The new problem it hands you:** hedging wastes duplicate work and can amplify
load under stress; shedding drops real requests; aggressive timeouts can turn a
slow success into a failure.

**Exemplified by:** Distributed SQL, Search, Chat — anywhere [P7](#p7-scatter-gather--partial-aggregation)
is in play.

---

## P13. Real-time connections & routing

**What it is:** maintaining persistent bidirectional channels to many clients and
delivering a message to the right one.

**Reach for it when:** server-initiated push, live updates, presence.

**The lever:** WebSocket/SSE for persistent connections; stateful connection
servers; a fast lookup `user_id → server_id` (Redis) updated on every
connect/disconnect; per-conversation sequence numbers for ordering.

**The new problem it hands you:** **routing** — which of 10k connection servers
holds recipient B's socket? The lookup must be fast and consistent. Connection
state is hard to scale and to fail over; reconnection needs dedup.

**Exemplified by:** Chat, Notification (real-time channel), presence systems.

---

## P14. Saga & compensation

**What it is:** a multi-step workflow across services where each step has a
compensating undo, used when a single distributed transaction is too expensive.

**Reach for it when:** a business operation spans systems you can't wrap in one
ACID transaction (debit → credit → notify).

**The lever:** orchestrated or choreographed steps; each step records progress;
failure triggers compensating actions for completed steps; combine with
[P9](#p9-idempotency--exactly-once-ish) for safe retries.

**The new problem it hands you:** intermediate states are visible (no isolation);
compensations may themselves fail; you need reconciliation as the final
correctness net (2PC is the alternative and is almost never worth it).

**Exemplified by:** Payment, any distributed transaction, order/checkout flows.

---

## P15. Geospatial indexing

**What it is:** making "what's near me" fast over a 2D space.

**Reach for it when:** proximity matching or range queries on coordinates under
high update rates.

**The lever:** geohash or quad-tree bucketing turns 2D proximity into prefix /
bucket lookups; precision level controls bucket size.

**The new problem it hands you:** **radius vs result-set precision** — coarse
cells over-return, fine cells miss neighbors across boundaries; high-frequency
location updates make it write-heavy ([P1](#p1-batching--async-buffering)/
[P2](#p2-partitioning--sharding-and-the-hot-partition-problem) apply); hot cells
(downtown at rush hour) recreate the hot-partition problem.

**Exemplified by:** Ride-sharing / location systems.

---

## P16. Backpressure / flow control

**What it is:** letting a slow consumer tell a fast producer to slow down, rather
than collapsing.

**Reach for it when:** any producer can outpace any consumer (ingestion, queues,
streaming).

**The lever:** bounded buffers; credit/acknowledgement-based flow control; a
durable queue as a shock absorber; explicit drop/sample policies when you'd rather
lose data than fall over.

**The new problem it hands you:** if you block, latency propagates upstream; if
you drop/sample, you lose data; an unbounded buffer just defers the collapse and
grows lag.

**Exemplified by:** Kafka, Datadog ingest, Rate limiter, any streaming pipeline.

---

## P17. Storage durability & write internals

**What it is:** how a single storage node doesn't lose data on crash, and the
fundamental read-vs-write structure tradeoff.

**Reach for it when:** designing or reasoning about *inside* any database or
durable store.

**The lever:** **WAL (write-ahead log)** — append the intent before the mutation,
replay on recovery (the universal crash-recovery primitive). **LSM-tree** (writes
sequential/fast, reads merge levels, compaction is the hidden cost) vs **B-tree**
(predictable reads, random-I/O writes at scale). **Erasure coding vs replication**
for durability (erasure stores less for the same durability, costs reconstruction).
Bloom filters to skip disk for absent keys.

**The new problem it hands you:** LSM → read amplification + compaction load;
B-tree → write amplification; WAL → fsync cost on the hot path; erasure coding →
CPU + latency to reconstruct on read.

**Exemplified by:** KV store, RDBMS internals, Object store, Kafka (the log
itself).

---

# Part III — The Systems (case studies)

Each system is a *composition of primitives under one dominant constraint*. Read
the hard constraint first; it tells you which primitive is the star and which are
supporting. Reordered so the foundational storage systems come before the
domain-specific ones.

---

## Cluster A — Foundations: ingestion, storage, movement

### 1. Rate Limiter
**Hard constraint:** must add near-zero latency to the hot path. If checking the
limit costs more than the request, you solved the wrong problem.
**Primitives exercised:** P16 backpressure, P3 consistency (local vs global
counter), P4 caching (Redis coordination).
**Unique principles:** token bucket vs sliding vs fixed window (and their failure
modes); distributed counter coordination (local accuracy vs global latency); Redis
as fast-but-not-perfectly-consistent state; fail-open vs fail-closed when the store
is down.

### 2. Message Queue / Kafka
**Hard constraint:** a partition is consumed sequentially by one consumer per
group → throughput ceiling = partition count × consumer speed.
**Primitives exercised:** P1 buffering, P2 partitioning, P3 replication (ISR),
P16 backpressure, P17 log/WAL.
**Unique principles:** log-structured storage (append beats random write);
partitioning strategies; consumer-group parallelism ceiling; offset management and
at-least-once vs EOS; replication factor + ISR; compacted topics for changelogs;
retention as a replay buffer.

### 3. Key-Value Store (Redis / DynamoDB-style)
**Hard constraint:** CAP felt viscerally — under partition, return stale (AP) or
error (CP). The choice is the application's, and you must reason about it explicitly.
**Primitives exercised:** P17 LSM/WAL/Bloom, P2 consistent hashing, P3
replication + consistency ladder, P4 caching.
**Unique principles:** LSM vs B-tree; WAL for crash recovery; consistent hashing;
single-/multi-leader/leaderless quorum; eventual consistency + vector clocks; Bloom
filters to skip disk on misses.

### 4. Relational Database Internals + Scaling
**Hard constraint:** cross-shard joins are prohibitively expensive — denormalize
to avoid them, or accept fan-out-to-all-shards + merge.
**Primitives exercised:** P17 internals, P2 sharding, P3 replicas + lag, P7
scatter-gather.
**Unique principles:** MVCC; index types (B-tree/hash/GIN/GiST) and why you can't
index freely; read replicas + replication lag; sharding strategies + the cross-shard
join problem; connection pooling as a DB resource; 2PC and why it's rarely right.

### 5. Object Store (S3-style)
**Hard constraint:** durability and scale almost free, but zero transactionality
and no in-place mutation — every design that treats it like a database fails.
**Primitives exercised:** P17 erasure coding, P3 eventual consistency, P8 tiered
storage.
**Unique principles:** read-after-write consistency guarantees (and the gaps);
multipart upload; erasure coding vs 3× replication; presigned URLs as scoped access
without proxying; storage classes for access-frequency decay.

### 6. Distributed Log + Metrics Platform (Datadog)
**Hard constraint:** cardinality — the number of unique tag combinations, not the
point rate, drives cost and scalability.
**Primitives exercised:** P1 batch/pre-agg, P6 inverted index, P7 scatter-gather,
P8 columnar/tiered/compression, P5 write- vs read-time rollup, P16 backpressure.
**Unique principles:** agent-side batching + pre-aggregation; Gorilla compression;
inverted index on tag space; write-time rollup vs read-time aggregation;
index-everything vs archive-and-index-selectively; immutable time-partitioned
blocks; scatter-gather MPP with pushdown.

---

## Cluster B — Read, search, and analytics

### 7. Search Engine (Elasticsearch / Lucene)
**Hard constraint:** distributed relevance — each shard has only local term stats,
so global IDF needs a separate pass or approximation.
**Primitives exercised:** P6 inverted index, P2 sharding, P7 scatter-gather, P12
tail latency.
**Unique principles:** inverted index construction (tokenize/stem/posting lists);
TF-IDF/BM25; immutable segments + merge; near-real-time gap; sharded scatter-gather
ranking with fetch-then-enrich.

### 8. Distributed SQL Engine (Presto / BigQuery-style)
**Hard constraint:** shuffle (cross-node redistribution for joins/group-by) is the
bottleneck; every optimizer decision reduces to minimizing shuffle.
**Primitives exercised:** P8 columnar, P7 scatter-gather, P12 tail latency, P2
partition pruning.
**Unique principles:** columnar storage; predicate/projection pushdown + partition
pruning; cost-based planning; hash vs sort-merge vs broadcast join; exchange/shuffle
operators; vectorized execution.

---

## Cluster C — High fan-out: write vs read amplification

### 9. Social Feed (Twitter / Instagram)
**Hard constraint:** the celebrity / hot-user problem — one write from 100M
followers triggers 100M synchronous fan-outs; naive push deadlocks.
**Primitives exercised:** P5 fan-out, P2 hot-key, P4 caching (sorted set
timeline).
**Unique principles:** fan-out on write vs read; hybrid (push for normal, pull for
celebrities) + hot-node detection; ranked vs chronological (ML breaks simple merge);
Redis sorted set as the natural timeline structure.

### 10. Chat System (WhatsApp / Slack)
**Hard constraint:** routing — when A messages B, how does A's server find which of
10k connection servers holds B's socket?
**Primitives exercised:** P13 real-time connections, P4 caching (routing lookup),
P1 buffering (offline delivery).
**Unique principles:** WebSocket/SSE; stateful connection servers; per-conversation
sequence numbers (global ordering impossible and unnecessary); delivery receipts as
a separate event stream; presence as high-frequency aggregation; client-side dedup
on retry.

### 11. Notification System
**Hard constraint:** at-least-once is easy; exactly-once is near-impossible — you
can't see whether FCM/Twilio actually delivered. Design for idempotency.
**Primitives exercised:** P9 idempotency, P5 fan-out, P1 buffering/priority, P16
channel rate limits.
**Unique principles:** priority queues (critical vs marketing); idempotency keys;
channel-specific rate limits; scheduled/delayed delivery with a scanner; per-channel
preference checks before send.

---

## Cluster D — Coordination and scheduling

### 12. Distributed Task Scheduler (Cadence / SQS+Lambda style)
**Hard constraint:** you can't have exactly-once execution and fault-tolerance
without a too-expensive distributed transaction — accept at-least-once + idempotent
workers.
**Primitives exercised:** P9 idempotency, P10 consensus (cron firer), P16
visibility/leasing.
**Unique principles:** idempotency as first-class; visibility timeout; dead-letter
queue; the "who fires the cron?" problem (single scheduler + distributed lock); task
leasing with renewal.

### 13. Distributed Lock / Leader Election (ZooKeeper / etcd)
**Hard constraint:** the slow-but-alive holder (GC pause, network blip) — TTL
tuning can't make this correct; fencing tokens can.
**Primitives exercised:** P10 consensus/fencing.
**Unique principles:** Raft/Paxos + majority quorum; fencing tokens (monotonic,
reject stale); session/heartbeat TTL for death detection; leader election as a lock
with metadata; watch/notify instead of polling.

---

## Cluster E — Domain-specific problem classes

### 14. URL Shortener (bit.ly style)
**Hard constraint:** sub-millisecond lookup — a CDN/Redis cache at the edge *is*
the read architecture; the storage system barely matters.
**Primitives exercised:** P4 caching, P11 CDN, P5 analytics fan-out.
**Unique principles:** Base62 encoding; read-heavy optimization (1000× redirects);
collision avoidance (pre-generate vs hash-and-check); 301 vs 302 tradeoff; click
analytics as the same ingestion pattern as Datadog.

### 15. Ride-Sharing / Location System (Uber)
**Hard constraint:** geo-search must be fast with a variable radius; geohash
precision trades search radius against result-set size.
**Primitives exercised:** P15 geospatial, P1 write-heavy updates, P2 hot-cell.
**Unique principles:** geohash/quad-tree partitioning; ~1M location updates/min
(write-heavy); matching as supply-demand in a cell; surge as a real-time read on
that ratio; routing vs ETA (static graph shortest-path + dynamic traffic).

### 16. Video Streaming (YouTube / Netflix)
**Hard constraint:** you never stream origin→user at scale; every byte must be
cached at the edge — the question is always "what populates the CDN?"
**Primitives exercised:** P11 CDN, P8 tiered storage, P1 chunked upload + async
transcode.
**Unique principles:** encoding pipeline (one upload → N renditions via async
workers); adaptive bitrate (HLS/DASH, player switches on static segments);
CDN as the entire read path; resumable chunked upload; manifest files.

### 17. Payment System
**Hard constraint:** you can't span a distributed transaction across your DB and
an external processor — only your side is controllable. Saga + idempotency +
reconciliation is the standard answer.
**Primitives exercised:** P14 saga, P9 idempotency, P3 strong consistency.
**Unique principles:** double-entry bookkeeping (entries sum to zero → bug
detection); idempotency keys on payment APIs; saga with compensations;
reconciliation as the correctness net; exactly-once via a transactional idempotency
table.

### 18. Web Crawler
**Hard constraint:** the URL frontier must be distributed (too big for one node)
yet ordered (prioritized) — a distributed priority queue is non-trivial.
**Primitives exercised:** P2 partitioning, P1 buffering, P4 DNS caching, graph
traversal.
**Unique principles:** URL frontier (priority queue by freshness); politeness
(robots.txt, per-domain rate limit); near-duplicate detection (SimHash/MinHash);
mandatory DNS caching; recrawl scheduling via change-frequency backoff.

---

# The coverage matrix

Primitive → systems that teach it (use this to pick a case study per primitive doc).

| Primitive | Systems that exemplify it |
|---|---|
| P1 Batching / async buffering | Rate limiter, Kafka, Datadog, Notification, Crawler |
| P2 Partitioning / sharding (+ hot-key) | Kafka, KV, RDBMS, Search, Feed, Ride-share |
| P3 Replication + consistency ladder | KV, RDBMS, Kafka, Object store |
| P4 Caching strategies | URL shortener, Video, Feed, Chat, KV |
| P5 Write- vs read-time cost (fan-out) | Feed, Datadog, URL shortener, Notification |
| P6 Inverted index | Datadog, Search |
| P7 Scatter-gather + partial agg | Datadog, Distributed SQL, Search, RDBMS |
| P8 Tiered / columnar storage | Datadog, Distributed SQL, Object store, Video |
| P9 Idempotency / exactly-once-ish | Task scheduler, Notification, Payment |
| P10 Consensus / leader election / fencing | Distributed lock, Task scheduler, Kafka |
| P11 CDN / edge caching | URL shortener, Video |
| P12 Tail latency / hedging / shedding | Distributed SQL, Search, Chat |
| P13 Real-time connections + routing | Chat, Notification |
| P14 Saga / compensation | Payment |
| P15 Geospatial indexing | Ride-sharing |
| P16 Backpressure / flow control | Kafka, Datadog, Rate limiter |
| P17 Storage durability / write internals | KV, RDBMS, Object store, Kafka |

---

# Recommended study sequence

Learn the primitives in the order that maximizes transfer; pull in each system as
the case study where that primitive is the star.

1. **Rate limiter** → P16 backpressure, P3 (counters): the gentle on-ramp.
2. **Kafka** → P1, P2, P16, P17: the decoupling buffer at the center of everything.
3. **Key-value store** → P17, P2, P3: storage internals (LSM, WAL, replication).
4. **RDBMS scaling** → P17, P2, P3, P7: sharding, MVCC, replica lag *(moved earlier
   — it's foundational, not domain-specific)*.
5. **Object store** → P17, P3, P8: blob storage + erasure coding *(moved earlier —
   storage cluster belongs together)*.
6. **Datadog** → P1, P6, P7, P8, P5, P16: the full ingestion pipeline + TSDB.
7. **Social feed** → P5, P2, P4: fan-out and the write/read cost dial.
8. **Search engine** → P6, P7, P12: inverted index + distributed ranking.
9. **Distributed SQL** → P8, P7, P12: MPP and shuffle minimization.
10. **Chat** → P13, P4: real-time connections and routing.
11. **Notification** → P9, P5, P13: multi-channel delivery + idempotency.
12. **Task scheduler** → P9, P10: at-least-once + distributed work.
13. **Distributed lock** → P10: consensus and fencing.
14. **URL shortener** → P4, P11: read-heavy caching.
15. **Ride-sharing** → P15, P2: geospatial indexing + hot cells.
16. **Video streaming** → P11, P8, P1: CDN + encoding pipeline.
17. **Payment** → P14, P9, P3: saga + distributed correctness.
18. **Web crawler** → P2, P1, P4: distributed graph traversal.

After steps 1–9 you hold every transferable primitive; everything later is depth
and domain specialization. From there, practice the *real* skill: take any new
prompt, name its dominant bottleneck from **Part I**, compose the **Part II**
primitives that relieve it, and defend the secondary bottlenecks each one creates.
