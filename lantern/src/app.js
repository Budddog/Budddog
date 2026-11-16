/* Lantern: a free, private, offline idea-card reader. No account, no ads, no paywall. */
(() => {
  "use strict";

  // ---------- helpers ----------
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");
  const dstr = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const dayNum = (d = new Date()) => Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 864e5);
  const uid = () => Math.random().toString(36).slice(2, 9);
  const words = (s) => s.trim().split(/\s+/).filter(Boolean);
  const icon = (name) => {
    const p = {
      save: '<path d="M6 3h12v18l-6-4.5L6 21z"/>',
      play: '<path d="M7 4l13 8-13 8z"/>',
      stop: '<rect x="6" y="6" width="12" height="12"/>',
      share: '<path d="M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5M5 13v7h14v-7"/>',
      note: '<path d="M4 20h4L20 8l-4-4L4 16zM14 6l4 4"/>',
      left: '<path d="M15 4l-8 8 8 8"/>',
      right: '<path d="M9 4l8 8-8 8"/>',
      close: '<path d="M5 5l14 14M19 5L5 19"/>',
      flame: '<path d="M12 2c1 4 5 6 5 11a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-4-1-6 1-10z"/>',
      plus: '<path d="M12 4v16M4 12h16"/>',
      trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    }[name];
    return `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  };

  // ---------- state ----------
  const KEY = "lantern.v1";
  const blank = () => ({
    v: 1, topics: [], goal: 5, seen: {}, saved: {}, decks: [],
    stashes: [{ id: "s-keep", name: "Keepers" }],
    theme: "system", rate: 1, muted: false, updated: 0,
  });
  let state = blank();
  let storageOk = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = Object.assign(blank(), JSON.parse(raw));
  } catch { storageOk = false; }

  const caps = {};
  let remoteRef = null, remoteTimer = null;
  function save() {
    state.updated = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { storageOk = false; }
    if (remoteRef) {
      clearTimeout(remoteTimer);
      remoteTimer = setTimeout(() => {
        remoteRef.set({ json: JSON.stringify(state), updated: state.updated }).catch(() => {});
      }, 900);
    }
  }

  // Inside a Claude artifact, keep the library in the viewer's private store so it
  // survives cleared browser data and follows them across devices.
  async function initCaps() {
    if (!window.claude || !window.claude.use) return;
    const get = (n) => window.claude.use(n).catch(() => null);
    get("sample").then((c) => { caps.sample = c; if (c) render(); });
    get("tts").then((c) => { caps.tts = c; });
    get("downloads").then((c) => { caps.downloads = c; });
    const [db, user] = await Promise.all([get("db"), get("user")]);
    if (!db || !user) return;
    try {
      const id = await user.id();
      if (!id) return;
      const ref = db.doc(`data/users/${id}/state`);
      const snap = await ref.get();
      const data = snap.exists ? snap.data() : null;
      remoteRef = ref;
      if (data && data.json && (data.updated || 0) > (state.updated || 0)) {
        state = Object.assign(blank(), JSON.parse(data.json));
        try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
        applyTheme(); render();
      } else if (state.updated) {
        ref.set({ json: JSON.stringify(state), updated: state.updated }).catch(() => {});
      }
      caps.synced = true;
      if (route() === "you") render();
    } catch { remoteRef = null; }
  }

  // ---------- library ----------
  const topicById = Object.fromEntries(TOPICS.map((t) => [t.id, t]));
  const allDecks = () => DECKS.concat(state.decks);
  const deckById = (id) => allDecks().find((d) => d.id === id);
  const hueOf = (deck) => (topicById[deck.topic] || { hue: 215 }).hue;
  const topicName = (deck) => (topicById[deck.topic] || { name: "My ideas" }).name;
  const ideasOf = (deck) =>
    deck.ideas.map((it, i) => it && { id: `${deck.id}~${i}`, title: it[0], body: it[1], deck }).filter(Boolean);
  const ideaById = (id) => {
    const [d, i] = id.split("~");
    const deck = deckById(d);
    const it = deck && deck.ideas[+i];
    return it ? { id, title: it[0], body: it[1], deck } : null;
  };
  const readCount = (deck) => ideasOf(deck).filter((i) => state.seen[i.id]).length;

  function countsByDay() {
    const m = {};
    for (const k in state.seen) m[state.seen[k]] = (m[state.seen[k]] || 0) + 1;
    return m;
  }
  function streak() {
    const m = countsByDay();
    const d = new Date();
    if (!m[dstr(d)]) d.setDate(d.getDate() - 1);
    let n = 0;
    while (m[dstr(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  const dueIdeas = () => {
    const t = dayNum();
    return Object.keys(state.saved).filter((id) => state.saved[id].due <= t && ideaById(id)).map(ideaById);
  };

  // deterministic daily shuffle
  function seeded(seedStr) {
    let h = 2166136261;
    for (const c of seedStr) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    return () => {
      h += 0x6d2b79f5;
      let t = Math.imul(h ^ (h >>> 15), 1 | h);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function todaysDecks() {
    const rnd = seeded(dstr());
    const pool = DECKS.filter((d) => !state.topics.length || state.topics.includes(d.topic));
    const scored = pool.map((d) => {
      const n = ideasOf(d).length, r = readCount(d);
      // unfinished first, then untouched, then finished
      const rank = r > 0 && r < n ? 0 : r === 0 ? 1 : 2;
      return { d, k: rank + rnd() * 0.99 };
    });
    return scored.sort((a, b) => a.k - b.k).slice(0, 3).map((x) => x.d);
  }
  function ideaOfDay() {
    const rnd = seeded("idea" + dstr());
    const pool = DECKS.filter((d) => !state.topics.length || state.topics.includes(d.topic)).flatMap(ideasOf);
    return pool[Math.floor(rnd() * pool.length)];
  }

  // ---------- theme ----------
  function applyTheme() {
    const r = document.documentElement;
    if (state.theme === "light" || state.theme === "dark") r.setAttribute("data-theme", state.theme);
    else if (r.dataset.lanternSet) r.removeAttribute("data-theme");
    r.dataset.lanternSet = state.theme === "system" ? "" : "1";
  }

  // ---------- toast ----------
  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.hidden = true), 2600);
  }

  // ---------- shared pieces ----------
  const deckCard = (d, a = "open-deck") => {
    const n = ideasOf(d).length, r = readCount(d);
    return `<button class="deck" style="--h:${hueOf(d)}" data-a="${a}" data-id="${esc(d.id)}">
      <span class="eyebrow">${esc(topicName(d))}</span>
      <span class="deck-title">${esc(d.t)}</span>
      <span class="deck-meta">${n} idea${n === 1 ? "" : "s"}${r ? ` · ${r === n ? "finished" : r + " read"}` : ""}</span>
      <span class="deck-bar" aria-hidden="true"><i style="width:${n ? (r / n) * 100 : 0}%"></i></span>
    </button>`;
  };
  let listItems = [];
  const ideaRow = (it, i) => {
    const s = state.saved[it.id];
    return `<article class="idea" style="--h:${hueOf(it.deck)}">
      <button class="idea-main" data-a="open-list" data-i="${i}">
        <span class="eyebrow">${esc(it.deck.t)}</span>
        <span class="idea-title">${esc(it.title)}</span>
        <span class="idea-body">${esc(it.body)}</span>
        ${s && s.note ? `<span class="idea-note">${icon("note")} ${esc(s.note)}</span>` : ""}
      </button>
    </article>`;
  };
  const ring = (done, goal) => {
    const c = 2 * Math.PI * 34, f = Math.min(1, done / goal);
    return `<svg class="ring" viewBox="0 0 80 80" role="img" aria-label="${done} of ${goal} ideas read today">
      <circle cx="40" cy="40" r="34" class="ring-bg" fill="none" stroke-width="8"/>
      <circle cx="40" cy="40" r="34" class="ring-fg" fill="none" stroke-width="8" stroke-linecap="round"
        stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - f)}" transform="rotate(-90 40 40)"/>
      <text x="40" y="38" text-anchor="middle" class="ring-n">${done}</text>
      <text x="40" y="53" text-anchor="middle" class="ring-g">of ${goal}</text>
    </svg>`;
  };
  const topicChips = () =>
    `<div class="chips">${TOPICS.map((t) =>
      `<button class="chip${state.topics.includes(t.id) ? " on" : ""}" style="--h:${t.hue}" data-a="toggle-topic" data-id="${t.id}" aria-pressed="${state.topics.includes(t.id)}">${esc(t.name)}</button>`).join("")}</div>`;

  // ---------- views ----------
  const ui = { q: "", topic: "", stash: "all", busy: "", err: "", review: null, confirmReset: false, compose: null };

  function viewToday() {
    const done = countsByDay()[dstr()] || 0, st = streak(), due = dueIdeas().length;
    const hr = new Date().getHours();
    const hello = hr < 5 ? "Still up" : hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";
    const iod = ideaOfDay();
    const left = Math.max(0, state.goal - done);
    return `
    <section class="hero">
      <div class="hero-text">
        <p class="eyebrow">${new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</p>
        <h1>${hello}.</h1>
        <p class="lede">${left ? `${left} more idea${left === 1 ? "" : "s"} to reach today's goal.` : "Goal reached. Anything more is a bonus."}
        ${st ? ` You are on a ${st}-day streak.` : ""}</p>
        <div class="row"><button class="btn" data-a="watch-feed">${icon("play")} Watch today's clips</button></div>
      </div>
      ${ring(done, state.goal)}
    </section>
    ${!state.topics.length ? `<section class="panel"><h2>What are you curious about?</h2>
      <p class="muted">Pick a few topics and Today will lean toward them. Skip this and you get a mix of everything.</p>${topicChips()}</section>` : ""}
    ${due ? `<a class="nudge" href="#review"><strong>${due} saved idea${due === 1 ? " is" : "s are"} due for review.</strong> <span>Two minutes keeps them from fading.</span></a>` : ""}
    <section><h2>Today's reads</h2><div class="decks">${todaysDecks().map((d) => deckCard(d)).join("")}</div></section>
    ${iod ? `<section><h2>One idea for right now</h2>
      <article class="feature" style="--h:${hueOf(iod.deck)}">
        <p class="eyebrow">${esc(topicName(iod.deck))} · ${esc(iod.deck.t)}</p>
        <h3>${esc(iod.title)}</h3><p>${esc(iod.body)}</p>
        <div class="row"><button class="btn" data-a="open-idea" data-id="${esc(iod.id)}">Read the full set</button>
        <button class="btn ghost" data-a="quick-save" data-id="${esc(iod.id)}">${state.saved[iod.id] ? "Saved" : "Save"}</button></div>
      </article></section>` : ""}`;
  }

  function watchFeed() {
    const first = todaysDecks();
    const rest = DECKS.filter((d) => !first.includes(d) && (!state.topics.length || state.topics.includes(d.topic)));
    const all = first.concat(rest).flatMap(ideasOf);
    const unseen = all.filter((i) => !state.seen[i.id]);
    return unseen.length ? unseen : all;
  }
  function viewWatch() {
    return `<h1>Watch</h1>
    <p class="lede">Every idea plays as a short narrated clip with captions, about 20 seconds each. Swipe up for the next one, tap to pause.</p>
    <div class="row"><button class="btn big" data-a="watch-feed">${icon("play")} Play today's clips</button></div>
    <section><h2>Or pick a set to watch</h2><div class="decks">${allDecks().filter((d) => ideasOf(d).length).map((d) => deckCard(d, "watch-deck")).join("")}</div></section>`;
  }

  function searchIdeas(q) {
    const t = q.toLowerCase();
    return allDecks().flatMap(ideasOf).filter((i) => (i.title + " " + i.body + " " + i.deck.t).toLowerCase().includes(t)).slice(0, 40);
  }
  function viewExplore() {
    const q = ui.q.trim();
    let results = "";
    if (q.length > 1) {
      listItems = searchIdeas(q);
      results = `<section><h2>${listItems.length} idea${listItems.length === 1 ? "" : "s"} matching “${esc(q)}”</h2>
        <div class="ideas">${listItems.map(ideaRow).join("") || `<p class="muted">Nothing in the library yet. Use “Learn anything” below to make a set on it.</p>`}</div></section>`;
    }
    const src = caps.sample ? "Claude writes a fresh set of cards for you." : "Lantern builds a set of cards from the Wikipedia article.";
    const decks = DECKS.filter((d) => !ui.topic || d.topic === ui.topic);
    return `
    <h1>Explore</h1>
    <label class="search"><span class="sr">Search ideas</span>
      <input id="q" type="search" placeholder="Search ${allDecks().flatMap(ideasOf).length} ideas" value="${esc(ui.q)}" autocomplete="off"></label>
    ${results}
    <section class="panel learn">
      <h2>Learn anything</h2>
      <p class="muted">Type any subject. ${src}</p>
      <form class="row" data-form="learn">
        <input id="learn-topic" type="text" placeholder="e.g. Game theory, the Roman Republic, sourdough" required maxlength="80">
        <button class="btn" ${ui.busy === "learn" ? "disabled" : ""}>${ui.busy === "learn" ? "Making cards…" : "Make cards"}</button>
      </form>
      ${ui.err ? `<p class="error" role="alert">${esc(ui.err)}</p>` : ""}
    </section>
    <section>
      <h2>Library</h2>
      <div class="chips"><button class="chip${!ui.topic ? " on" : ""}" data-a="filter-topic" data-id="">All</button>
      ${TOPICS.map((t) => `<button class="chip${ui.topic === t.id ? " on" : ""}" style="--h:${t.hue}" data-a="filter-topic" data-id="${t.id}">${esc(t.name)}</button>`).join("")}</div>
      <div class="decks">${decks.map((d) => deckCard(d)).join("")}</div>
    </section>`;
  }

  function viewLibrary() {
    const ids = Object.keys(state.saved).filter(ideaById).sort((a, b) => state.saved[b].at - state.saved[a].at);
    const inStash = (id, s) => s === "all" || (state.saved[id].st || []).includes(s);
    listItems = ids.filter((id) => inStash(id, ui.stash)).map(ideaById);
    const count = (s) => ids.filter((id) => inStash(id, s)).length;
    const c = ui.compose;
    return `
    <h1>Your stash</h1>
    <div class="row">
      <button class="btn" data-a="compose" data-id="idea">${icon("plus")} Write an idea</button>
      <button class="btn ghost" data-a="compose" data-id="paste">Turn text into cards</button>
    </div>
    ${c ? composeForm(c) : ""}
    <section>
      <div class="chips">
        <button class="chip${ui.stash === "all" ? " on" : ""}" data-a="pick-stash" data-id="all">All saved · ${ids.length}</button>
        ${state.stashes.map((s) => `<button class="chip${ui.stash === s.id ? " on" : ""}" data-a="pick-stash" data-id="${s.id}">${esc(s.name)} · ${count(s.id)}</button>`).join("")}
        <button class="chip dashed" data-a="compose" data-id="stash">${icon("plus")} New stash</button>
      </div>
      ${ui.stash !== "all" ? `<p class="muted small">Stash “${esc((state.stashes.find((s) => s.id === ui.stash) || {}).name)}” ·
        <button class="link" data-a="del-stash" data-id="${ui.stash}">Delete this stash</button> (saved ideas stay in All saved)</p>` : ""}
      <div class="ideas">${listItems.map(ideaRow).join("") ||
        `<div class="empty"><p><strong>Nothing saved here yet.</strong></p><p class="muted">Open any card and press Save. Saving is unlimited, and saved ideas come back in Review so you remember them.</p><a class="btn" href="#explore">Browse the library</a></div>`}</div>
    </section>
    ${state.decks.length ? `<section><h2>Sets you made</h2><div class="decks">${state.decks.map((d) =>
      `<div class="deck-wrap">${deckCard(d)}<button class="mini" data-a="del-deck" data-id="${esc(d.id)}" aria-label="Delete ${esc(d.t)}">${icon("trash")}</button></div>`).join("")}</div></section>` : ""}`;
  }
  function composeForm(c) {
    if (c === "stash") return `<form class="panel" data-form="stash"><h2>New stash</h2>
      <div class="row"><input id="stash-name" type="text" placeholder="e.g. For the team offsite" required maxlength="40"><button class="btn">Create</button>
      <button type="button" class="btn ghost" data-a="compose" data-id="">Cancel</button></div></form>`;
    if (c === "paste") return `<form class="panel" data-form="paste"><h2>Turn text into cards</h2>
      <p class="muted">Paste an article, your notes, or a book chapter. ${caps.sample ? "Claude distils it into idea cards." : "Each paragraph becomes a card you can edit later by rewriting it."}</p>
      <input id="paste-title" type="text" placeholder="Name this set" required maxlength="80">
      <textarea id="paste-text" rows="7" placeholder="Paste text here" required></textarea>
      <div class="row"><button class="btn" ${ui.busy === "paste" ? "disabled" : ""}>${ui.busy === "paste" ? "Working…" : "Make cards"}</button>
      <button type="button" class="btn ghost" data-a="compose" data-id="">Cancel</button></div>
      ${ui.err ? `<p class="error" role="alert">${esc(ui.err)}</p>` : ""}</form>`;
    return `<form class="panel" data-form="idea"><h2>Write an idea</h2>
      <input id="idea-title" type="text" placeholder="Headline" required maxlength="90">
      <textarea id="idea-body" rows="4" placeholder="The idea in a few sentences. Around 50 words reads best." required></textarea>
      <input id="idea-src" type="text" placeholder="Where it came from (optional)" maxlength="120">
      <div class="row"><button class="btn">Save idea</button>
      <button type="button" class="btn ghost" data-a="compose" data-id="">Cancel</button></div></form>`;
  }

  function viewReview() {
    const r = ui.review;
    if (r && r.queue.length) {
      const it = r.queue[0];
      return `<h1>Review</h1>
      <p class="muted">${r.queue.length} left in this session</p>
      <article class="feature review" style="--h:${hueOf(it.deck)}">
        <p class="eyebrow">${esc(it.deck.t)}</p>
        <h3>${esc(it.title)}</h3>
        ${r.shown ? `<p>${esc(it.body)}</p>${state.saved[it.id] && state.saved[it.id].note ? `<p class="idea-note">${icon("note")} ${esc(state.saved[it.id].note)}</p>` : ""}
          <div class="row grades"><button class="btn ghost" data-a="grade" data-id="0">Forgot it</button>
          <button class="btn" data-a="grade" data-id="1">Got it</button>
          <button class="btn ghost" data-a="grade" data-id="2">Knew it cold</button></div>`
        : `<p class="muted">Say the idea in your own words, then check.</p>
          <div class="row"><button class="btn" data-a="reveal">Show the idea</button></div>`}
      </article>`;
    }
    const due = dueIdeas(), total = Object.keys(state.saved).length;
    const next = Math.min(...Object.values(state.saved).map((s) => s.due)) - dayNum();
    return `<h1>Review</h1>
    <p class="lede">Saved ideas return here on a widening schedule: after a day, then a few days, then weeks. Recalling an idea just before you forget it is what makes it stay.</p>
    ${r && r.done ? `<p class="nudge static"><strong>Session finished.</strong> <span>${r.done} idea${r.done === 1 ? "" : "s"} reviewed.</span></p>` : ""}
    <div class="empty">
      ${due.length ? `<p><strong>${due.length} idea${due.length === 1 ? "" : "s"} due today.</strong></p><button class="btn" data-a="start-review" data-id="due">Start review</button>`
      : total ? `<p><strong>Nothing due.</strong></p><p class="muted">Next review ${next <= 1 ? "tomorrow" : "in " + next + " days"}.</p><button class="btn ghost" data-a="start-review" data-id="all">Practise anyway</button>`
      : `<p><strong>No saved ideas yet.</strong></p><p class="muted">Save a card while reading and it will turn up here tomorrow.</p><a class="btn" href="#today">Go to Today</a>`}
    </div>`;
  }

  function viewYou() {
    const m = countsByDay(), total = Object.keys(state.seen).length;
    const cells = [];
    const now = new Date(), start = new Date(now);
    start.setDate(now.getDate() - ((now.getDay() + 6) % 7) - 77); // Monday, 11 weeks back
    for (let i = 0; i < 84; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const n = m[dstr(d)] || 0, future = d > now;
      const lvl = future ? "f" : n === 0 ? 0 : n < state.goal / 2 ? 1 : n < state.goal ? 2 : 3;
      cells.push(`<i class="l${lvl}" title="${dstr(d)}: ${n} read"></i>`);
    }
    const where = caps.synced ? "Your library is saved to your private Claude storage and to this browser."
      : storageOk ? "Your library is saved in this browser only. Export a backup now and then."
      : "This browser is blocking storage, so progress will be lost when you close the page. Export a backup before you leave.";
    return `<h1>You</h1>
    <section class="stats">
      <div><b>${streak()}</b><span>day streak</span></div>
      <div><b>${total}</b><span>ideas read</span></div>
      <div><b>${Object.keys(state.saved).length}</b><span>saved</span></div>
      <div><b>${DECKS.filter((d) => readCount(d) === ideasOf(d).length).length}</b><span>sets finished</span></div>
    </section>
    <section><h2>Last 12 weeks</h2><div class="heat" role="img" aria-label="Reading activity for the last 12 weeks">${cells.join("")}</div></section>
    <section class="panel"><h2>Daily goal</h2>
      <div class="chips">${[3, 5, 8, 12, 20].map((g) => `<button class="chip${state.goal === g ? " on" : ""}" data-a="set-goal" data-id="${g}">${g} ideas</button>`).join("")}</div></section>
    <section class="panel"><h2>Topics you follow</h2>${topicChips()}</section>
    <section class="panel"><h2>Appearance and voice</h2>
      <div class="chips">${["system", "light", "dark"].map((t) => `<button class="chip${state.theme === t ? " on" : ""}" data-a="set-theme" data-id="${t}">${t[0].toUpperCase() + t.slice(1)}</button>`).join("")}</div>
      <div class="chips">${[[0.85, "Slower voice"], [1, "Normal voice"], [1.25, "Faster voice"]].map(([r, l]) => `<button class="chip${state.rate === r ? " on" : ""}" data-a="set-rate" data-id="${r}">${l}</button>`).join("")}</div></section>
    <section class="panel"><h2>Backup</h2>
      <p class="muted">${where}</p>
      <div class="row">
        <button class="btn" data-a="export" data-id="json">Export backup</button>
        <button class="btn ghost" data-a="export" data-id="md">Export saved ideas as Markdown</button>
        <label class="btn ghost file">Restore backup<input id="restore" type="file" accept="application/json,.json"></label>
      </div>
      <div class="row"><button class="link danger" data-a="reset">${ui.confirmReset ? "Press again to erase everything" : "Erase all my data"}</button></div>
    </section>`;
  }

  const views = { today: viewToday, watch: viewWatch, explore: viewExplore, library: viewLibrary, review: viewReview, you: viewYou };
  const route = () => (views[location.hash.slice(1)] ? location.hash.slice(1) : "today");
  function render() {
    const r = route();
    const active = document.activeElement && document.activeElement.id;
    const pos = active && document.activeElement.selectionStart;
    $("#view").innerHTML = views[r]();
    document.querySelectorAll("[data-nav]").forEach((a) => a.setAttribute("aria-current", a.dataset.nav === r ? "page" : "false"));
    const st = streak();
    $("#streak").innerHTML = `${icon("flame")} ${st}`;
    $("#streak").setAttribute("aria-label", `${st} day streak`);
    const due = dueIdeas().length;
    const badge = $("#due-badge"); badge.hidden = !due; badge.textContent = due;
    if (active && $("#" + active)) { const el = $("#" + active); el.focus(); try { el.setSelectionRange(pos, pos); } catch {} }
  }

  // ---------- reader ----------
  const R = { items: [], i: 0, open: false, note: false, listening: false, end: false, next: null };
  function openReader(items, i = 0, next = null) {
    if (!items.length) return;
    Object.assign(R, { items, i, open: true, note: false, end: false, next });
    $("#reader").hidden = false;
    document.body.classList.add("locked");
    renderReader();
    $("#reader").focus();
  }
  function closeReader() {
    stopSpeak();
    R.open = false;
    $("#reader").hidden = true;
    document.body.classList.remove("locked");
    render();
  }
  function markSeen(it) {
    if (!state.seen[it.id]) { state.seen[it.id] = dstr(); save(); }
  }
  function renderReader() {
    const el = $("#reader-body");
    const segs = R.items.map((_, k) => `<i class="${k < R.i || R.end ? "done" : k === R.i ? "now" : ""}"></i>`).join("");
    $("#reader-progress").innerHTML = segs;
    if (R.end) {
      const done = countsByDay()[dstr()] || 0;
      el.innerHTML = `<article class="card end">
        <p class="eyebrow">Finished</p><h2>${R.items.length} idea${R.items.length === 1 ? "" : "s"} read.</h2>
        <p>${done >= state.goal ? "Today's goal is done." : `${state.goal - done} to go for today's goal.`} Ideas you saved will come back in Review.</p>
        <div class="row">${R.next ? `<button class="btn" data-a="open-deck" data-id="${esc(R.next.id)}">Next: ${esc(R.next.t)}</button>` : ""}
        <button class="btn ghost" data-a="close-reader">Done</button></div></article>`;
      $("#reader-actions").hidden = true;
      return;
    }
    const it = R.items[R.i], s = state.saved[it.id];
    markSeen(it);
    $("#reader-actions").hidden = false;
    el.innerHTML = `<article class="card" style="--h:${hueOf(it.deck)}">
      <p class="eyebrow">${esc(topicName(it.deck))} · ${R.i + 1} of ${R.items.length}</p>
      <h2>${esc(it.title)}</h2>
      <p class="card-body">${esc(it.body)}</p>
      <p class="card-src">${esc(it.deck.t)}${it.deck.by ? " · " + esc(it.deck.by) : ""}</p>
      ${s ? `<div class="stash-pick"><span class="small muted">In stashes:</span>${state.stashes.map((x) =>
        `<button class="chip small${(s.st || []).includes(x.id) ? " on" : ""}" data-a="toggle-stash" data-id="${x.id}">${esc(x.name)}</button>`).join("")}</div>` : ""}
      ${R.note || (s && s.note) ? `<label class="note"><span class="small muted">Your note</span>
        <textarea id="note" rows="2" placeholder="Why this matters to you, or how you will use it">${esc(s ? s.note || "" : "")}</textarea></label>` : ""}
    </article>`;
    $("#act-save").classList.toggle("on", !!s);
    $("#act-save .lbl").textContent = s ? "Saved" : "Save";
    $("#act-listen").innerHTML = `${icon(R.listening ? "stop" : "play")}<span class="lbl">${R.listening ? "Stop" : "Listen"}</span>`;
    $("#act-listen").classList.toggle("on", R.listening);
    $("#rd-prev").disabled = R.i === 0;
  }
  function step(d) {
    if (!R.open) return;
    if (R.end) { if (d < 0) { R.end = false; renderReader(); } return; }
    const n = R.i + d;
    if (n < 0) return;
    R.note = false;
    if (n >= R.items.length) { stopSpeak(); R.end = true; } else R.i = n;
    renderReader();
    if (R.listening && !R.end) speakCurrent();
  }
  function ensureSaved(id) {
    if (!state.saved[id]) state.saved[id] = { at: Date.now(), st: [], note: "", due: dayNum() + 1, ivl: 0 };
    return state.saved[id];
  }

  // ---------- listening ----------
  let speakToken = 0;
  function stopSpeak() {
    speakToken++;
    R.listening = false;
    try { caps.tts && caps.tts.stop(); } catch {}
    try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch {}
  }
  function speakText(text) {
    if (caps.tts) return caps.tts.speak(text, { rate: Math.max(0.7, Math.min(1.5, state.rate)) });
    return new Promise((res, rej) => {
      if (!("speechSynthesis" in window)) return rej(new Error("none"));
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = state.rate; u.onend = res; u.onerror = rej;
      window.speechSynthesis.speak(u);
    });
  }
  function speakCurrent() {
    const it = R.items[R.i], token = ++speakToken;
    R.listening = true;
    renderReader();
    speakText(`${it.title}. ${it.body}`).then(() => {
      if (token !== speakToken || !R.listening) return;
      if (R.i + 1 < R.items.length) { R.i++; R.note = false; renderReader(); speakCurrent(); }
      else { R.listening = false; renderReader(); }
    }).catch((e) => {
      if (token !== speakToken) return;
      R.listening = false; renderReader();
      if (e && e.message === "none") toast("This browser has no reading voice.");
    });
  }

  // ---------- files ----------
  async function saveFile(filename, data, type) {
    const blob = data instanceof Blob ? data : new Blob([data], { type });
    if (caps.downloads) {
      try { await caps.downloads.save({ filename, data: blob }); } catch { toast("Download was cancelled."); }
      return;
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  function wrapText(ctx, text, maxW) {
    const out = []; let line = "";
    for (const w of words(text)) {
      const t = line ? line + " " + w : w;
      if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
    }
    if (line) out.push(line);
    return out;
  }
  function shareImage(it) {
    const c = document.createElement("canvas"); c.width = 1080; c.height = 1350;
    const x = c.getContext("2d"), h = hueOf(it.deck);
    x.fillStyle = `hsl(${h} 62% 86%)`; x.fillRect(0, 0, 1080, 1350);
    x.fillStyle = `hsl(${h} 45% 16%)`;
    const disp = getComputedStyle(document.documentElement).getPropertyValue("--display") || "sans-serif";
    const body = getComputedStyle(document.documentElement).getPropertyValue("--text") || "sans-serif";
    x.font = `600 30px ${body}`; x.fillText(topicName(it.deck).toUpperCase(), 90, 150);
    x.font = `700 78px ${disp}`;
    let y = 290;
    for (const l of wrapText(x, it.title, 900)) { x.fillText(l, 90, y); y += 92; }
    y += 30; x.font = `400 44px ${body}`;
    for (const l of wrapText(x, it.body, 900)) { x.fillText(l, 90, y); y += 66; }
    x.font = `600 30px ${body}`; x.globalAlpha = 0.7;
    x.fillText(it.deck.t, 90, 1260);
    return new Promise((res) => c.toBlob(res, "image/png"));
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); toast("Copied."); }
    catch { toast("Copying is blocked here. Select the text on the card instead."); }
  }

  // ---------- making sets ----------
  function addDeck(title, by, cards, topic = "") {
    const deck = { id: "u-" + uid(), topic, t: title.slice(0, 90), by, ideas: cards.map((c) => [String(c[0]).slice(0, 110), String(c[1]).slice(0, 700)]), mine: true };
    state.decks.unshift(deck); save();
    return deck;
  }
  const sentences = (t) => t.replace(/\s+/g, " ").match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) || [];
  function trimTo(text, maxWords) {
    let out = "";
    for (const s of sentences(text)) {
      if (words(out + s).length > maxWords && out) break;
      out += s;
    }
    return out.trim();
  }
  async function learnFromClaude(topic) {
    const v = await caps.sample.json(
      `Write a set of 7 idea cards that teach the subject "${topic}" to a curious adult.\n` +
      `Each card has a short headline (max 8 words) and a body of 40 to 65 words that explains one idea clearly and accurately, in plain language, complete on its own. Order the cards so the set builds from basics to nuance. No filler, no questions, no markdown.\n` +
      `Reply with JSON only: {"title": "short set title", "ideas": [{"title": "...", "body": "..."}]}`);
    if (!v || !Array.isArray(v.ideas) || !v.ideas.length) throw new Error("empty");
    return addDeck(v.title || topic, "Written by Claude on request. Check anything important.", v.ideas.map((i) => [i.title, i.body]));
  }
  async function learnFromWikipedia(topic) {
    const u = "https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts&explaintext=1&exsectionformat=wiki&redirects=1&generator=search&gsrlimit=1&gsrsearch=" + encodeURIComponent(topic);
    const res = await fetch(u);
    const j = await res.json();
    const page = j.query && Object.values(j.query.pages)[0];
    if (!page || !page.extract) throw new Error("notfound");
    const skip = /^(see also|references|notes|external links|further reading|bibliography|sources|citations|footnotes|gallery)$/i;
    const parts = page.extract.split(/\n==\s*([^=\n]+?)\s*==\n/);
    const cards = [];
    const intro = sentences(parts[0]);
    cards.push(["In short", trimTo(intro.slice(0, 3).join(""), 65)]);
    if (intro.length > 4) cards.push(["More context", trimTo(intro.slice(3).join(""), 65)]);
    for (let k = 1; k < parts.length && cards.length < 9; k += 2) {
      const body = trimTo((parts[k + 1] || "").split(/\n===/)[0], 65);
      if (!skip.test(parts[k]) && words(body).length > 12) cards.push([parts[k], body]);
    }
    return addDeck(page.title, `Wikipedia, “${page.title}” (CC BY-SA 4.0)`, cards.filter((c) => c[1]));
  }
  async function pasteToDeck(title, text) {
    if (caps.sample) {
      const v = await caps.sample.json(
        `Distil the text below into idea cards. Use 3 to 10 cards depending on how much substance there is. Each card: a headline of at most 8 words and a body of 35 to 65 words stating one idea from the text faithfully, in plain language, understandable on its own. Do not add facts that are not in the text.\n` +
        `Reply with JSON only: {"ideas": [{"title": "...", "body": "..."}]}\n\nTEXT:\n${text.slice(0, 24000)}`);
      if (!v || !Array.isArray(v.ideas) || !v.ideas.length) throw new Error("empty");
      return addDeck(title, "From text you pasted, distilled by Claude", v.ideas.map((i) => [i.title, i.body]));
    }
    const paras = text.split(/\n\s*\n|\n/).map((p) => p.trim()).filter((p) => words(p).length >= 8).slice(0, 30);
    if (!paras.length) throw new Error("short");
    const cards = paras.map((p) => {
      const first = (sentences(p)[0] || p).trim().replace(/[.!?]+$/, "");
      const w = words(first);
      return [w.length > 9 ? w.slice(0, 9).join(" ") + "…" : first, trimTo(p, 80) || p];
    });
    return addDeck(title, "From text you pasted", cards);
  }

  // ---------- clips (watch mode) ----------
  // Each idea becomes a short clip: a title scene, then one captioned scene per sentence,
  // drawn on a canvas so the same renderer can play it and record it to a video file.
  const V = { items: [], i: 0, clip: null, scene: 0, t0: 0, dur: 1, token: 0, paused: false, open: false, noVoice: false, done: false, raf: 0, rec: false, cache: {} };
  const estDur = (seg) => Math.max(1.5, (words(seg).length * 0.37) / state.rate + 0.6);
  const makeClip = (it) => ({ it, hue: hueOf(it.deck), segs: [it.title].concat(sentences(it.body).map((x) => x.trim()).filter(Boolean)) });
  const fam = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "sans-serif";

  function fitText(ctx, text, font, weight, maxW, maxH, maxSize, minSize) {
    const ws = words(text);
    for (let size = maxSize; ; size -= 3) {
      ctx.font = `${weight} ${size}px ${font}`;
      const lh = size * 1.2, space = ctx.measureText(" ").width, out = [];
      let x = 0, y = 0, wide = false;
      for (const w of ws) {
        const wd = ctx.measureText(w).width;
        if (x && x + wd > maxW) { x = 0; y += lh; }
        out.push({ w, x, y });
        x += wd + space;
        if (wd > maxW) wide = true; // a single word is too wide at this size
      }
      if ((y + lh <= maxH && !wide) || size <= minSize) return { size, weight, font, words: out, h: (out.length ? out[out.length - 1].y : 0) + lh };
    }
  }
  function drawClip(ctx, W, H, clip, scene, p, T, label, cache) {
    const h = clip.hue, u = W / 100, padX = 8 * u;
    // moving backdrop in the topic's hue
    ctx.fillStyle = `hsl(${h} 42% 11%)`; ctx.fillRect(0, 0, W, H);
    for (let k = 0; k < 4; k++) {
      const cx = W * (0.5 + 0.42 * Math.sin(T * (0.11 + k * 0.045) + k * 2.1));
      const cy = H * (0.5 + 0.42 * Math.cos(T * (0.09 + k * 0.035) + k * 1.3));
      const r = W * (0.5 + 0.12 * k);
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, `hsla(${(h + k * 28 - 30 + 360) % 360} 75% ${46 - k * 5}% / 0.5)`);
      g.addColorStop(1, `hsla(${h} 75% 30% / 0)`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    ctx.textBaseline = "top";
    // scene progress segments
    const n = clip.segs.length, gap = u, segW = (W - 2 * padX - gap * (n - 1)) / n, top = 5 * u;
    for (let k = 0; k < n; k++) {
      const x = padX + k * (segW + gap);
      ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.fillRect(x, top, segW, 0.8 * u);
      const f = k < scene ? 1 : k === scene ? p : 0;
      ctx.fillStyle = "#ffbd2e"; ctx.fillRect(x, top, segW * f, 0.8 * u);
    }
    const text = fam("--text"), disp = fam("--display");
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = `600 ${3.3 * u}px ${text}`;
    ctx.fillText(topicName(clip.it.deck).toUpperCase(), padX, top + 4 * u);
    const key = `${clip.it.id}|${scene}|${W}|${H}`;
    const areaTop = top + 14 * u, areaH = H - areaTop - 22 * u, maxW = W - 2 * padX - 12 * u;
    if (scene === 0) {
      const L = cache[key] || (cache[key] = fitText(ctx, clip.segs[0], disp, 700, W - 2 * padX, areaH, 13 * u, 6 * u));
      ctx.font = `${L.weight} ${L.size}px ${L.font}`;
      const y0 = areaTop + (areaH - L.h) / 2;
      L.words.forEach((wd, k) => {
        const a = Math.max(0, Math.min(1, (p * 1.8 * L.words.length - k) / 1.2 + (p > 0.6 ? 1 : 0)));
        ctx.globalAlpha = a; ctx.fillStyle = "#fff";
        ctx.fillText(wd.w, padX + wd.x, y0 + wd.y + (1 - a) * 2 * u);
      });
      ctx.globalAlpha = 1;
    } else {
      const tl = cache[key + "t"] || (cache[key + "t"] = fitText(ctx, clip.segs[0], disp, 650, maxW, 12 * u, 4.6 * u, 3.4 * u));
      const aTop = areaTop + tl.h + 4 * u, aH = H - aTop - 22 * u;
      const L = cache[key] || (cache[key] = fitText(ctx, clip.segs[scene], disp, 600, maxW, aH, 8.6 * u, 4.2 * u));
      ctx.font = `${tl.weight} ${tl.size}px ${tl.font}`; ctx.fillStyle = "#ffbd2e";
      tl.words.forEach((wd) => ctx.fillText(wd.w, padX + wd.x, areaTop + wd.y));
      ctx.font = `${L.weight} ${L.size}px ${L.font}`;
      const y0 = aTop + Math.max(0, (aH - L.h) / 2.6), lit = p * 1.12 * L.words.length;
      L.words.forEach((wd, k) => {
        ctx.fillStyle = k < lit ? "#fff" : "rgba(255,255,255,0.32)";
        ctx.fillText(wd.w, padX + wd.x, y0 + wd.y);
      });
    }
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = `500 ${3.1 * u}px ${text}`;
    const foot = fitText(ctx, clip.it.deck.t + (label ? "  ·  " + label : ""), text, 500, maxW, 9 * u, 3.1 * u, 3.1 * u);
    foot.words.forEach((wd) => ctx.fillText(wd.w, padX + wd.x, H - 15 * u + wd.y));
  }

  function hush() {
    try { caps.tts && caps.tts.stop(); } catch {}
    try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch {}
  }
  function sizeWatch() {
    const box = $("#watch"), c = $("#watch-canvas"), stage = $("#watch-stage");
    const H = box.clientHeight, W = Math.min(box.clientWidth, Math.round((H * 9) / 16));
    stage.style.width = W + "px";
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
    V.cache = {};
  }
  function openWatch(items, i = 0) {
    if (!items.length) return;
    if (R.open) { stopSpeak(); R.open = false; $("#reader").hidden = true; }
    Object.assign(V, { items, open: true, paused: false, done: false, noVoice: false });
    $("#watch").hidden = false;
    document.body.classList.add("locked");
    sizeWatch();
    $("#w-export").hidden = !(window.MediaRecorder && HTMLCanvasElement.prototype.captureStream);
    startClip(i);
    cancelAnimationFrame(V.raf);
    V.raf = requestAnimationFrame(frame);
    $("#watch").focus();
  }
  function closeWatch() {
    V.open = false; V.token++; hush();
    cancelAnimationFrame(V.raf);
    $("#watch").hidden = true;
    document.body.classList.remove("locked");
    render();
  }
  function startClip(i) {
    V.i = i; V.clip = makeClip(V.items[i]); V.scene = 0; V.done = false;
    markSeen(V.items[i]);
    $("#watch-live").textContent = `${V.items[i].title}. ${V.items[i].body}`;
    syncWatchUi();
    playScene();
  }
  function playScene() {
    const seg = V.clip.segs[V.scene], token = ++V.token;
    V.t0 = performance.now(); V.dur = estDur(seg); V.spoken = false;
    if (state.muted || V.noVoice || V.paused) return;
    V.spoken = true;
    hush();
    speakText(seg).then(() => { if (token === V.token) advance(); })
      .catch(() => { if (token === V.token) { V.noVoice = true; V.spoken = false; V.t0 = performance.now(); syncWatchUi(); } });
  }
  function advance() {
    if (V.scene + 1 < V.clip.segs.length) { V.scene++; playScene(); }
    else if (V.i + 1 < V.items.length) startClip(V.i + 1);
    else { V.done = true; V.paused = true; V.token++; syncWatchUi(); }
  }
  function frame(now) {
    if (!V.open) return;
    V.raf = requestAnimationFrame(frame);
    if (V.rec) return;
    const c = $("#watch-canvas"), el = (now - V.t0) / 1000;
    let p = V.paused ? (V.done ? 1 : 0.02) : Math.min(1, el / V.dur);
    if (!V.paused && !V.spoken && el >= V.dur) { advance(); p = 0; }
    // if a voice stalls far past its estimate, move on
    if (!V.paused && V.spoken && el > V.dur * 2.5 + 4) advance();
    drawClip(c.getContext("2d"), c.width, c.height, V.clip, V.scene, p, now / 1000, `${V.i + 1} of ${V.items.length}`, V.cache);
  }
  function watchStep(d) {
    const n = V.i + d;
    if (n < 0 || n >= V.items.length) return;
    V.paused = false; hush(); startClip(n);
  }
  function togglePause() {
    if (V.done) { V.paused = false; startClip(0); return; }
    V.paused = !V.paused;
    if (V.paused) { V.token++; hush(); } else playScene();
    syncWatchUi();
  }
  function syncWatchUi() {
    const it = V.items[V.i], s = state.saved[it.id];
    $("#w-save").classList.toggle("on", !!s);
    $("#w-save .lbl").textContent = s ? "Saved" : "Save";
    const quiet = state.muted || V.noVoice;
    $("#w-sound .lbl").textContent = V.noVoice ? "No voice" : quiet ? "Sound off" : "Sound on";
    $("#w-sound").classList.toggle("on", !quiet);
    const pz = $("#watch-paused");
    pz.hidden = !V.paused;
    pz.textContent = V.done ? "That was the last clip. Tap to replay." : "Paused. Tap to play.";
  }
  async function exportClip() {
    if (V.rec) return;
    const type = ["video/mp4", "video/webm;codecs=vp9", "video/webm"].find((t) => MediaRecorder.isTypeSupported(t));
    if (!type) { toast("This browser cannot record video."); return; }
    if (!V.paused) togglePause();
    V.rec = true;
    const clip = V.clip, c = document.createElement("canvas");
    c.width = 720; c.height = 1280;
    const ctx = c.getContext("2d"), cache = {}, chunks = [];
    const rec = new MediaRecorder(c.captureStream(30), { mimeType: type, videoBitsPerSecond: 2500000 });
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const durs = clip.segs.map(estDur), total = durs.reduce((a, b) => a + b, 0) + 0.6;
    const lbl = $("#w-export .lbl");
    const stopped = new Promise((res) => (rec.onstop = res));
    rec.start();
    const t0 = performance.now();
    await new Promise((res) => {
      const tick = (now) => {
        const t = (now - t0) / 1000;
        if (t >= total || !V.open) return res();
        let k = 0, acc = 0;
        while (k < durs.length - 1 && t > acc + durs[k]) acc += durs[k++];
        drawClip(ctx, 720, 1280, clip, k, Math.min(1, (t - acc) / durs[k]), t, "", cache);
        lbl.textContent = Math.round((t / total) * 100) + "%";
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    rec.stop(); await stopped;
    V.rec = false; lbl.textContent = "Get video";
    if (!V.open) return;
    const name = clip.it.title.replace(/[^\w ]+/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "idea";
    saveFile(`${name}.${type.startsWith("video/mp4") ? "mp4" : "webm"}`, new Blob(chunks, { type: type.split(";")[0] }));
  }

  // ---------- actions ----------
  const act = {
    "watch-feed"() { openWatch(watchFeed(), 0); },
    "watch-deck"(el) {
      const d = deckById(el.dataset.id); if (!d) return;
      const items = ideasOf(d), first = items.findIndex((i) => !state.seen[i.id]);
      openWatch(items, first < 0 ? 0 : first);
    },
    "watch-here"() { openWatch(R.items.slice(), R.end ? 0 : R.i); },
    "watch-close": closeWatch,
    "watch-toggle": togglePause,
    "watch-prev"() { watchStep(-1); },
    "watch-next"() { watchStep(1); },
    "watch-save"() {
      const id = V.items[V.i].id;
      if (state.saved[id]) delete state.saved[id]; else { ensureSaved(id); toast("Saved. It will come up in Review tomorrow."); }
      save(); syncWatchUi();
    },
    "watch-sound"() {
      if (V.noVoice) { toast("This browser has no reading voice, so clips play with captions only."); return; }
      state.muted = !state.muted; save();
      if (!V.paused) { hush(); playScene(); }
      syncWatchUi();
    },
    "watch-export": () => exportClip(),
    "open-deck"(el) {
      const d = deckById(el.dataset.id); if (!d) return;
      const items = ideasOf(d);
      const firstUnread = items.findIndex((i) => !state.seen[i.id]);
      const pool = DECKS.filter((x) => x.id !== d.id && readCount(x) < ideasOf(x).length);
      const next = pool.find((x) => x.topic === d.topic) || pool[0] || null;
      openReader(items, firstUnread < 0 ? 0 : firstUnread, next);
    },
    "open-idea"(el) {
      const it = ideaById(el.dataset.id); if (!it) return;
      const items = ideasOf(it.deck);
      openReader(items, items.findIndex((i) => i.id === it.id));
    },
    "open-list"(el) { openReader(listItems.slice(), +el.dataset.i); },
    "close-reader": closeReader,
    prev() { step(-1); },
    next() { step(1); },
    "quick-save"(el) {
      const id = el.dataset.id;
      if (state.saved[id]) delete state.saved[id]; else ensureSaved(id);
      save(); render();
    },
    save() {
      const it = R.items[R.i];
      if (state.saved[it.id]) { delete state.saved[it.id]; toast("Removed from your stash."); }
      else { ensureSaved(it.id); toast("Saved. It will come up in Review tomorrow."); }
      save(); renderReader();
    },
    "toggle-stash"(el) {
      const s = ensureSaved(R.items[R.i].id), id = el.dataset.id;
      s.st = (s.st || []).includes(id) ? s.st.filter((x) => x !== id) : [...(s.st || []), id];
      save(); renderReader();
    },
    note() { R.note = true; ensureSaved(R.items[R.i].id); save(); renderReader(); const n = $("#note"); n && n.focus(); },
    listen() { if (R.listening) { stopSpeak(); renderReader(); } else speakCurrent(); },
    share() { $("#share-menu").hidden = !$("#share-menu").hidden; },
    "share-copy"() {
      const it = R.items[R.i];
      $("#share-menu").hidden = true;
      copy(`${it.title}\n\n${it.body}\n\n(${it.deck.t})`);
    },
    async "share-image"() {
      const it = R.items[R.i];
      $("#share-menu").hidden = true;
      saveFile(`${it.title.replace(/[^\w ]+/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "idea"}.png`, await shareImage(it));
    },
    "toggle-topic"(el) {
      const id = el.dataset.id;
      state.topics = state.topics.includes(id) ? state.topics.filter((t) => t !== id) : [...state.topics, id];
      save(); render();
    },
    "filter-topic"(el) { ui.topic = el.dataset.id; render(); },
    "pick-stash"(el) { ui.stash = el.dataset.id; render(); },
    compose(el) { ui.compose = el.dataset.id || null; ui.err = ""; render(); const f = $("#view form input"); f && f.focus(); },
    "del-stash"(el) {
      const id = el.dataset.id;
      state.stashes = state.stashes.filter((s) => s.id !== id);
      for (const k in state.saved) state.saved[k].st = (state.saved[k].st || []).filter((x) => x !== id);
      ui.stash = "all"; save(); render(); toast("Stash deleted.");
    },
    "del-deck"(el) {
      const id = el.dataset.id;
      if (el.dataset.armed !== "1") { el.dataset.armed = "1"; el.classList.add("armed"); toast("Press the bin again to delete this set."); return; }
      state.decks = state.decks.filter((d) => d.id !== id);
      for (const k of Object.keys(state.saved)) if (k.startsWith(id + "~")) delete state.saved[k];
      save(); render();
    },
    "start-review"(el) {
      let q = el.dataset.id === "due" ? dueIdeas() : Object.keys(state.saved).map(ideaById).filter(Boolean);
      q = q.sort(() => Math.random() - 0.5).slice(0, 20);
      ui.review = { queue: q, shown: false, done: 0 };
      render();
    },
    reveal() { ui.review.shown = true; render(); },
    grade(el) {
      const g = +el.dataset.id, r = ui.review, it = r.queue.shift(), s = state.saved[it.id];
      if (s) {
        if (g === 0) { s.ivl = 0; s.due = dayNum() + 1; r.queue.push(it); }
        else {
          s.ivl = g === 1 ? (s.ivl ? Math.round(s.ivl * 2.3) : 3) : (s.ivl ? Math.round(s.ivl * 3.5) : 7);
          s.due = dayNum() + s.ivl; r.done++;
        }
      }
      r.shown = false; save(); render();
    },
    "set-goal"(el) { state.goal = +el.dataset.id; save(); render(); },
    "set-theme"(el) { state.theme = el.dataset.id; applyTheme(); save(); render(); },
    "set-rate"(el) { state.rate = +el.dataset.id; save(); render(); },
    export(el) {
      if (el.dataset.id === "json") return saveFile(`lantern-backup-${dstr()}.json`, JSON.stringify(state, null, 2), "application/json");
      const ids = Object.keys(state.saved).filter(ideaById);
      const md = ["# Saved ideas", ""].concat(ids.map((id) => {
        const it = ideaById(id), n = state.saved[id].note;
        return `## ${it.title}\n\n${it.body}\n\n*${it.deck.t}${it.deck.by ? " · " + it.deck.by : ""}*${n ? `\n\n> ${n}` : ""}\n`;
      })).join("\n");
      saveFile(`lantern-ideas-${dstr()}.md`, md, "text/markdown");
    },
    reset() {
      if (!ui.confirmReset) { ui.confirmReset = true; render(); return; }
      state = blank(); ui.confirmReset = false; save(); applyTheme(); render(); toast("Everything erased.");
    },
  };

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-a]");
    if (!el) {
      if (!e.target.closest("#share-menu")) $("#share-menu").hidden = true;
      return;
    }
    if (el.dataset.a !== "reset" && ui.confirmReset) ui.confirmReset = false;
    const fn = act[el.dataset.a];
    if (fn) fn(el, e);
  });

  document.addEventListener("submit", async (e) => {
    const kind = e.target.dataset.form;
    if (!kind) return;
    e.preventDefault();
    if (kind === "stash") {
      const s = { id: "s-" + uid(), name: $("#stash-name").value.trim() };
      if (!s.name) return;
      state.stashes.push(s); ui.compose = null; ui.stash = s.id; save(); render();
    } else if (kind === "idea") {
      let mine = state.decks.find((d) => d.id === "u-mine");
      if (!mine) { mine = { id: "u-mine", topic: "", t: "My own ideas", by: "", ideas: [], mine: true }; state.decks.unshift(mine); }
      const src = $("#idea-src").value.trim();
      mine.ideas.push([$("#idea-title").value.trim(), $("#idea-body").value.trim() + (src ? ` (${src})` : "")]);
      ensureSaved(`u-mine~${mine.ideas.length - 1}`);
      ui.compose = null; save(); render(); toast("Idea saved to your stash.");
    } else if (kind === "learn" || kind === "paste") {
      if (ui.busy) return;
      const topic = kind === "learn" ? $("#learn-topic").value.trim() : "";
      const title = kind === "paste" ? $("#paste-title").value.trim() : "", text = kind === "paste" ? $("#paste-text").value : "";
      ui.busy = kind; ui.err = ""; render();
      try {
        const deck = kind === "paste" ? await pasteToDeck(title, text)
          : caps.sample ? await learnFromClaude(topic) : await learnFromWikipedia(topic);
        ui.busy = ""; ui.compose = null; render();
        openReader(ideasOf(deck), 0);
      } catch (err) {
        ui.busy = "";
        ui.err = err.message === "notfound" ? `No article found for “${topic}”. Try a more common name for it.`
          : err.message === "short" ? "That text is too short to make cards from. Paste at least a full paragraph."
          : kind === "learn" && !caps.sample ? "Could not reach Wikipedia. Check your connection and try again."
          : "That did not work this time. Try again in a moment.";
        render();
        if (kind === "paste") { $("#paste-title").value = title; $("#paste-text").value = text; }
        else $("#learn-topic").value = topic;
      }
    }
  });

  document.addEventListener("input", (e) => {
    if (e.target.id === "q") { ui.q = e.target.value; render(); }
    if (e.target.id === "note" && R.open) { ensureSaved(R.items[R.i].id).note = e.target.value; save(); }
  });
  document.addEventListener("change", (e) => {
    if (e.target.id !== "restore" || !e.target.files[0]) return;
    const fr = new FileReader();
    fr.onload = () => {
      try {
        const data = JSON.parse(fr.result);
        if (!data || typeof data.seen !== "object" || typeof data.saved !== "object") throw 0;
        state = Object.assign(blank(), data); save(); applyTheme(); render(); toast("Backup restored.");
      } catch { toast("That file is not a Lantern backup."); }
    };
    fr.readAsText(e.target.files[0]);
  });

  document.addEventListener("keydown", (e) => {
    if (V.open) {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); watchStep(1); }
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); watchStep(-1); }
      else if (e.key === " " && e.target.tagName !== "BUTTON") { e.preventDefault(); togglePause(); }
      else if (e.key.toLowerCase() === "m") act["watch-sound"]();
      else if (e.key === "Escape") closeWatch();
      return;
    }
    if (!R.open || /TEXTAREA|INPUT/.test(e.target.tagName)) return;
    if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); step(1); }
    else if (e.key === "ArrowLeft") step(-1);
    else if (e.key === "Escape") closeReader();
    else if (e.key.toLowerCase() === "s" && !R.end) act.save();
  });
  let tx = null, ty = 0;
  $("#reader").addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  $("#reader").addEventListener("touchend", (e) => {
    if (tx === null || /TEXTAREA|BUTTON/.test(e.target.tagName)) return;
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
    tx = null;
  });

  let wy = null;
  $("#watch").addEventListener("touchstart", (e) => { wy = e.touches[0].clientY; }, { passive: true });
  $("#watch").addEventListener("touchend", (e) => {
    if (wy === null) return;
    const dy = e.changedTouches[0].clientY - wy; wy = null;
    if (Math.abs(dy) > 60) watchStep(dy < 0 ? 1 : -1);
  });
  window.addEventListener("resize", () => { if (V.open) sizeWatch(); });

  window.addEventListener("hashchange", () => { ui.err = ""; ui.confirmReset = false; render(); window.scrollTo(0, 0); });
  applyTheme();
  render();
  initCaps();
})();
