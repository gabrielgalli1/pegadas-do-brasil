import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
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
