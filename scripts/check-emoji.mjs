// Echoue si un emoji est present dans le code source du frontend (regle : zero emoji).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const EMOJI = /\p{Extended_Pictographic}|\u{FE0F}|\u{200D}/u;
const exts = [".ts", ".tsx", ".css", ".html", ".svg"];
const hits = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (exts.some((e) => p.endsWith(e))) {
      readFileSync(p, "utf8").split("\n").forEach((line, i) => {
        if (EMOJI.test(line)) hits.push(`${p}:${i + 1}: ${line.trim()}`);
      });
    }
  }
}
for (const d of ["src", "public", "index.html"]) {
  try { statSync(d).isDirectory() ? walk(d) : (EMOJI.test(readFileSync(d, "utf8")) && hits.push(d)); } catch {}
}
if (hits.length) { console.error("Emojis detectes :\n" + hits.join("\n")); process.exit(1); }
console.log("Aucun emoji detecte.");
