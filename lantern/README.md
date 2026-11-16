# Lantern

A free, private idea-card reader: short cards that each explain one idea, grouped into sets you can finish in a few minutes. No account, no ads, no paywall.

## Use it

Open `index.html` in any browser. It is a single self-contained file, so it also works offline and can be hosted anywhere (for GitHub Pages: Settings → Pages → deploy from this branch, then visit `/lantern/`).

## What it does

- **Today**: three sets picked for you each day, a daily goal ring, and a streak.
- **Watch**: every idea plays as a short narrated clip with animated captions, in a swipe-up feed. Any clip can be downloaded as a video file (captions only, no audio track).
- **Explore**: 150+ original cards across 12 topics, with search.
- **Learn anything**: type a subject and get a new set of cards (built from Wikipedia; written by Claude when run as a Claude artifact).
- **Stash**: unlimited saving, any number of stashes, a note on every card.
- **Review**: saved ideas come back on a spaced schedule so you remember them.
- **Listen**: reads a card aloud and carries on through the set.
- **Your own cards**: write an idea, or paste text and turn it into cards.
- **Share and backup**: copy a card, download it as an image, export everything as JSON or Markdown.

Your data stays in your browser's storage. Use **You → Export backup** to move it between devices.

## Develop

Edit the files in `src/`, then run `node build.mjs` to regenerate `index.html`. No dependencies.

The built-in cards are original text. Each set credits the people whose ideas it explains.
