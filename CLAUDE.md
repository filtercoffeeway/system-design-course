# CLAUDE.md — System Design Curriculum site

Instructions for any Claude session working on this project. Read this first,
then read `CHECKLIST.md` to see what is done and what to write next.

> ## ⭐ THE #1 RULE — derive every major decision as a ladder
>
> This governs the **entire course** and overrides any instinct to just state an
> answer. **Never assert a major design decision; derive it.** For every
> significant choice — ID/key generation, which datastore, caching, partitioning,
> replication, consistency, the queue, the index, transport — walk the ladder:
>
> **simplest thing that works → the concrete number/load where it breaks (the
> bottleneck) → the next option that relieves it → its new bottleneck → … → the
> "complex" answer, now obviously necessary.**
>
> The reader must *derive* why (e.g.) a central token service or a KV store is
> needed by watching the simpler options each die at a specific scale — never
> memorize it. Anchor every rung to a number ("fine at ~10 rps; caps at a few
> k/s; so…"), and end with a small `rung → good until → breaks on` table. This is
> the curriculum's own thesis (*every lever creates a new bottleneck*) applied
> **inside each decision**. Exemplars: `systems/s14.html` §4 (store) and §6
> (id generation). Full spec in `DEPTH-PASS.md`.

> **Active work: the depth pass.** Every page has a first draft, but the drafts
> are too high-level (they name concepts without showing the mechanics, bits, or
> numbers). The current job is to deepen each page. **Read `DEPTH-PASS.md`** for
> the per-page tracker, the two depth standards (primitive "mechanism deep dive"
> vs system "full interview answer"), and the session recipe. The depth exemplars
> are `primitives/p8.html` (primitive) and `systems/s14.html` (system).

## The idea

This is a **bottleneck-first system design curriculum**, published as a static
multi-page site under `docs/` (GitHub Pages, deploy from `/docs`, no build step).

The thesis: don't memorize 50 systems. Learn a small set of **composable
primitives** (the levers), learn to **diagnose the dominant bottleneck** of any
system, and learn the **consequence chain** — every lever you pull creates a new
bottleneck. A system is:

> `(dominant bottleneck) + (the primitives you compose to relieve it)
>  + (the secondary bottlenecks that composition creates)`

There are three layers:

- **Part I — Bottleneck Catalog** (on `docs/index.html`): symptom → candidate
  levers → new bottleneck each introduces. The diagnosis layer.
- **Part II — 17 Primitives** (`docs/primitives/p1.html` … `p17.html`): the
  composable building blocks.
- **Part III — 18 Systems** (`docs/systems/s1.html` … `s18.html`): case studies,
  each = a composition of primitives under one dominant ("hard") constraint.

The numbering of primitives (P1–P17) and systems (1–18) is FIXED. Do not
renumber — links across the whole site depend on it. The canonical list with
titles is in `CHECKLIST.md` and in `docs/assets/site.js`.

## Repository layout

```
Plan/
  CLAUDE.md                  <- this file
  CHECKLIST.md               <- progress tracker; update it every session
  system-design-curriculum.md  <- original single-file source (reference)
  index.html                 <- legacy single-page version (leave as-is)
  docs/                      <- THE SITE (publish this folder)
    index.html               <- landing: catalog, grids, matrix, sequence
    assets/
      style.css              <- all styling (incl. deep-dive callout classes)
      site.js                <- builds the sidebar nav on every page
    primitives/p1.html … p17.html
    systems/s1.html … s18.html
```

`docs/gen scaffold` note: the summary skeletons were generated once. From now on
**edit the HTML files directly** — there is no build step and no regeneration.
Each page that still has a `Full write-up` TODO card is unwritten.

## Your job each session

1. Open `CHECKLIST.md`. Pick the next unchecked page (follow the study-sequence
   order unless told otherwise).
2. Replace that page's `Full write-up` TODO card with a complete deep dive using
   the template below.
3. Tick the box in `CHECKLIST.md`, set the `Last updated` line, and add a one-line
   note in the changelog at the bottom of the checklist.
4. Keep the page's existing top matter (breadcrumb, `<h1>`, summary `.field` /
   `.hard` / `.prims` blocks, prev/next nav, scripts). Only the write-up changes.

## Page anatomy (do not break these)

Every content page has, in order:
- `<head>` with `<link rel="stylesheet" href="../assets/style.css">` and (if it
  has diagrams) the Mermaid module script.
- `<nav class="side" id="side"></nav>` — populated by `site.js`, leave empty.
- `.crumb` breadcrumb, `<h1>`, then the summary blocks.
- **The deep dive** (what you write).
- `.prevnext` navigation, then `<script>window.SITE_BASE="../"</script>` and
  `<script src="../assets/site.js"></script>`.

Relative paths from a primitive/system page: CSS/JS = `../assets/...`,
other primitives = `../primitives/pN.html`, systems = `../systems/sN.html`,
home/catalog = `../index.html#catalog`. (On the root `index.html`, base is `""`.)

## Deep-dive template — PRIMITIVE pages

Use `<h2 class="sec">` for section titles, `<h3>`/`<h4>` for sub-parts. Sections:

1. **The problem it solves** — 1–2 paragraphs. The symptom in concrete terms.
2. **How it works** — the mechanism, step by step. Include a Mermaid diagram.
3. **Variants & when to use each** — the menu of options and their tradeoffs (a
   table is good here).
4. **The new bottleneck it hands you** — the consequence chain, in depth. This is
   the most important section; it is what makes the curriculum different.
5. **Real-world example** — REQUIRED. A concrete, named company implementation
   with specifics and numbers (see "Real examples" below).
6. **Applying it in a design** — when to reach for it, and the sentence that
   signals you understand the tradeoff.
7. **Pitfalls** — common mistakes.
8. **Further reading** — links to papers, engineering blogs, docs.

## Deep-dive template — SYSTEM pages

1. **Requirements & scale** — functional + non-functional requirements, then a
   back-of-the-envelope estimate (use a `.estimate` block). Numbers drive design.
2. **High-level architecture** — a Mermaid diagram + a paragraph walking it.
3. **The hard constraint, in depth** — why the naive design dies on this axis.
4. **Component deep dives** — one `<h3>` per major component; show the data model,
   the write path, the read path.
5. **Real-world example** — REQUIRED. How a named company actually built it.
6. **Tradeoffs & alternatives** — what you'd change under different constraints.
7. **Key talking points** — the 5–7 things that capture the design.
8. **Further reading.**

Cross-link generously: when you mention a primitive, link it
(`<a href="../primitives/p2.html">P2 partitioning</a>`); when you mention another
system, link it too. This is the whole point — show how concepts compose.

## Real examples — the bar

Every page MUST include at least one concrete, named implementation. Prefer
primary sources (engineering blogs, papers, official docs). Examples already used:

- **Datadog** (S6 / P1): the Agent + DogStatsD do **client-side aggregation** —
  counters/gauges/histograms are aggregated in the client before being sent over
  UDP/UDS, then the Agent's DogStatsD server aggregates again over a **10s flush
  interval** before submitting to intake. Distributions/percentiles use
  **DDSketch**, Datadog's mergeable relative-error quantile sketch (e.g. 1%
  relative accuracy), so per-host sketches merge centrally without shipping raw
  points. This is the canonical "aggregate at the source" story.
- **Kafka** (S2 / P1): producer batching via `linger.ms` + `batch.size`;
  zero-copy reads via `sendfile`; the page cache as the read path; ISR for
  durability. Originated at LinkedIn.

When you add a new example, VERIFY it with a web search before writing it as
fact — architectures and numbers drift. Cite the source under "Further reading".
Hedge numbers ("on the order of", "by default ~10s") rather than inventing
precision.

## Mermaid diagrams

For any page with a diagram, add this once, right before the `site.js` script tag:

```html
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
  mermaid.initialize({ startOnLoad: true, theme: 'neutral' });
</script>
```

Then place diagrams as `<pre class="mermaid"> ...graph... </pre>`. GitHub Pages
allows this CDN. Keep diagrams simple (flowchart `graph LR/TD`, sequence).

## Style & tone

- Prose first. Use tables for option/tradeoff comparisons and `.estimate` blocks
  for math. Avoid long bullet lists.
- Callout classes (defined in `style.css`):
  `.hard` (the hard constraint), `.newprob` (the new bottleneck a lever creates),
  `.example` (real-company example — put `<span class="tag">Company</span>` first),
  `.note` (asides), `.estimate` (back-of-envelope math), `.prims` (primitive refs).
- ~800 words is a *floor*, not a ceiling. **Page size and word count are never a
  blocker or a limiting factor** — cover the topic completely so the reader can answer
  any follow-up in the area. Trim padding, never depth. (See DEPTH-PASS.md; S6 ≈3.8k
  for its full three-pillar treatment is correct, not bloated.)
- US English. Be precise; explain *why*, not just *what*.

## Verifying your work

After editing, sanity-check links resolve. From `docs/`:
```
grep -o 'href="[^"#]*\.html"' systems/s6.html   # targets should exist relative to the file
```
Open the page in a browser to confirm the sidebar loads and Mermaid renders.
