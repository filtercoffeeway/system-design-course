# System Design Course

A **bottleneck-first** course in distributed system design. Instead of memorizing
50 architectures, you learn a small set of composable **primitives** (the levers),
how to **diagnose the dominant bottleneck** of any system, and the **consequence
chain** — every lever you pull creates a new bottleneck.

> A system is `(dominant bottleneck) + (the primitives you compose to relieve it)
> + (the secondary bottlenecks that composition creates)`.

## Live site

Static HTML, no build step. Open `index.html` locally, or publish via **GitHub
Pages → deploy from branch `main`, folder `/ (root)`**. It will serve at
`https://filtercoffeeway.github.io/system-design-course/`.

## What's inside

Three layers, indexed in the order you actually work through a design:

1. **Part I — Bottleneck Catalog** (on `index.html`): symptom → candidate levers →
   the new bottleneck each one introduces. The diagnosis layer.
2. **Part II — 17 Primitives** (`primitives/p1…p17.html`): the composable building
   blocks (batching, partitioning, caching, replication, consensus, …). One page
   each — what it is, how it works, variants, the new bottleneck it hands you, a
   real-world example, and pitfalls.
3. **Part III — 18 Systems** (`systems/s1…s18.html`): case studies (Kafka, Datadog,
   Dynamo-style KV, social feed, chat, payments, …). Each leads with its **hard
   constraint** and tags the primitives it exercises.

Every page has a Mermaid diagram, a named real-world example (Datadog, Kafka,
Stripe, Facebook Memcache, Google, Netflix, Uber, …), cross-links, and further
reading.

## Repository layout

```
.
├── index.html                  ← landing: catalog, grids, coverage matrix, sequence
├── assets/
│   ├── style.css               ← all styling
│   └── site.js                 ← builds the sidebar nav on every page
├── primitives/  p1.html … p17.html
├── systems/     s1.html … s18.html
├── system-design-curriculum.md ← the source outline (single-file reference)
├── CLAUDE.md                   ← conventions + page templates for contributors
└── CHECKLIST.md                ← per-page progress tracker
```

## Contributing / extending

`CLAUDE.md` documents the page anatomy, the deep-dive section template (separate
for primitives vs systems), the Mermaid snippet, and the requirement that every
page carry a verified real-world example. `CHECKLIST.md` tracks status per page.

## Note on accuracy

The Datadog/DDSketch and Kafka facts are web-verified. Other real-world examples
were written from well-established public sources (engineering blogs, papers) with
hedged figures — see each page's *Further reading*. Verify specifics against a
current primary source before relying on exact numbers.

---

*Companion to the [Filter Coffee Way system-design notebook](https://github.com/filtercoffeeway/system-design)
— this repo is the structured course; that one is the per-topic essays.*
