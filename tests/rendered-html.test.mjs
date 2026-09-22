import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test, { after } from "node:test";
import { Miniflare } from "miniflare";
import { unstable_getMiniflareWorkerOptions } from "wrangler";

// The built Worker statically imports from "cloudflare:workers" (a Workers
// Runtime built-in), so it can no longer be loaded with a plain Node
// `import()` outside of a Workers-compatible runtime. Miniflare runs the
// real worker on the same runtime (workerd) that `wrangler dev`/`vinext dev`
// and the Cloudflare edge use, so this exercises production code faithfully.
const distServerDir = fileURLToPath(new URL("../dist/server", import.meta.url));
const wranglerConfigPath = path.join(distServerDir, "wrangler.json");

function listModules(dir) {
  const modules = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) modules.push(...listModules(full));
    else if (/\.m?js$/.test(entry.name)) modules.push({ type: "ESModule", path: full });
  }
  return modules;
}

let miniflare;

function getMiniflare() {
  if (miniflare) return miniflare;

  const { workerOptions, main, externalWorkers } =
    unstable_getMiniflareWorkerOptions(wranglerConfigPath);

  // Miniflare needs every module the entry can reach handed to it up front:
  // it can't follow the build's dynamically-computed `import()` paths the
  // way a real bundler or the Workers runtime's own loader can.
  const modules = listModules(distServerDir).sort((a, b) =>
    a.path === main ? -1 : b.path === main ? 1 : 0,
  );

  miniflare = new Miniflare({
    workers: [
      {
        ...workerOptions,
        // The build writes "nodejs_compat" into both wrangler.jsonc and the
        // generated dist/server config, producing a duplicate that Miniflare
        // rejects outright.
        compatibilityFlags: [...new Set(workerOptions.compatibilityFlags)],
        modules,
        modulesRoot: distServerDir,
      },
      ...externalWorkers,
    ],
  });
  after(() => miniflare.dispose());
  return miniflare;
}

async function render() {
  return getMiniflare().dispatchFetch("http://localhost/", {
    headers: { accept: "text/html" },
  });
}

test("server-renders the Pegadas do Brasil menu", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="pt-BR"/i);
  assert.match(html, /<title>Pegadas do Brasil/);
  assert.match(html, /aria-label="Menu principal"/);
  assert.match(html, /INICIAR/);
  assert.match(html, /AVENTURA/);
});

test("keeps the QA regressions covered in source", async () => {
  const [page, css, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /completedRegions\.length >= 5/);
  assert.match(page, /unlocked: initialPhasePerfect/);
  assert.match(page, /if \(sound\) speak\(text\)/);
  assert.match(page, /if \(feedback !== "idle"\) return/);
  assert.match(css, /\.northeast-map-card\{height:430px!important;min-height:430px!important\}/);
  assert.match(css, /\.arraia-options\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /\.screen:has\(> \.feedback\)>\*:not\(\.feedback\)\{pointer-events:none\}/);
  assert.doesNotMatch(packageJson, /NODE_ENV=|VINEXT_ENV=/);
});
