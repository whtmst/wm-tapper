import { cpSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");

const entries = [
    "index.html",
    "manifest.webmanifest",
    "sw.js",
    "js",
    "src",
    "assets",
    "lib",
];

if (existsSync(dist)) {
    rmSync(dist, { recursive: true, force: true });
}

mkdirSync(dist, { recursive: true });

for (const entry of entries) {
    const from = join(root, entry);
    const to = join(dist, entry);

    if (!existsSync(from)) {
        console.warn(`WM Tapper: skip missing path: ${entry}`);
        continue;
    }

    cpSync(from, to, { recursive: true });
}

console.log("WM Tapper: frontend prepared in /dist");
