// Bundles src/ into one self-contained index.html (no server or build tools needed to run it).
// Usage: node build.mjs [--fragment out.html]   (the fragment has no <html>/<head> wrapper)
import { readFileSync, writeFileSync } from "node:fs";
const dir = new URL("./src/", import.meta.url);
const read = (f) => readFileSync(new URL(f, dir), "utf8");
const inner = `<title>Lantern</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Instrument+Sans:wght@400..700&display=swap">
<style>
${read("style.css")}</style>
${read("body.html")}
<script>
${read("content.js")}
${read("app.js")}</script>
`;
const full = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="Lantern: free bite-sized idea cards with unlimited saving, listening, and spaced review.">
<meta name="theme-color" content="#f0a500">
<style>html,body{margin:0}[hidden]{display:none!important}:root{padding:env(safe-area-inset-top,0) 0 env(safe-area-inset-bottom,0)}</style>
</head>
<body>
${inner}</body>
</html>
`;
writeFileSync(new URL("./index.html", import.meta.url), full);
const i = process.argv.indexOf("--fragment");
if (i > 0) writeFileSync(process.argv[i + 1], inner);
console.log("built", (full.length / 1024).toFixed(0) + " KB");
