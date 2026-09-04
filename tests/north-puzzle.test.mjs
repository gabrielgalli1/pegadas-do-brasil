import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

function createHarness(entry) {
  const hooks = []; let cursor = 0; let narration = "";
  const react = {
    useEffect() {},
    useState(initial) { const i = cursor++; if (!(i in hooks)) hooks[i] = initial; return [hooks[i], value => { hooks[i] = typeof value === "function" ? value(hooks[i]) : value; }]; },
    useRef(initial) { const i = cursor++; if (!(i in hooks)) hooks[i] = { current: initial }; return hooks[i]; },
  };
  const cache = new Map();
  function load(file) {
    file = path.resolve(file);
    if (cache.has(file)) return cache.get(file);
    if (file.endsWith(".json")) return JSON.parse(fs.readFileSync(file, "utf8"));
    const exports = {}; cache.set(file, exports);
    const code = ts.transpileModule(fs.readFileSync(file, "utf8"), { compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true,
    } }).outputText;
    vm.runInNewContext(code, { exports, require(name) {
      if (name === "react") return react;
      if (name === "react/jsx-runtime") return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }), Fragment: "fragment" };
      let local = path.resolve(path.dirname(file), name);
      if (!path.extname(local)) local += fs.existsSync(local + ".tsx") ? ".tsx" : ".ts";
      return load(local);
    }, window: { localStorage: { getItem() { return null; } }, speechSynthesis: { cancel() {}, speak(value) { narration = value.text; } } },
    SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } } });
    return exports;
  }
  const module = load(entry);
  return { hooks, module, load, render(props) { cursor = 0; return module.default(props); }, get narration() { return narration; } };
}
function nodes(tree, result = []) {
  if (Array.isArray(tree)) tree.forEach(item => nodes(item, result));
  else if (tree && typeof tree === "object") { result.push(tree); nodes(tree.props?.children, result); }
  return result;
}
function text(tree) {
  if (typeof tree === "string" || typeof tree === "number") return String(tree);
  if (Array.isArray(tree)) return tree.map(text).join("");
  return tree?.props ? text(tree.props.children) : "";
}
function puzzle() {
  const h = createHarness("app/NorthPuzzle.tsx"); const placements = [];
  let solved = false, finished = false;
  const target = { setPointerCapture() {}, hasPointerCapture() { return true; }, releasePointerCapture() {} };
  const slot = { getScreenCTM() { return null; }, ownerSVGElement: null, getBoundingClientRect() { return { left: 300, right: 400, top: 100, bottom: 160, width: 100, height: 60 }; } };
  function render() {
    const tree = h.render({ solved, onPlace(id) { placements.push(id); if (id === "acre") solved = true; }, onFinish() { finished = true; } });
    nodes(tree).find(n => n.props?.className === "north-puzzle-hole").props.ref.current = slot;
    return tree;
  }
  function button(id) { return nodes(render()).find(n => n.props?.["aria-label"] === "Selecionar peça: " + id); }
  function hole() { return nodes(render()).find(n => n.props?.role === "button"); }
  function event(x, y, extras = {}) { return { clientX: x, clientY: y, pointerId: 1, isPrimary: true, button: 0, currentTarget: target, preventDefault() {}, ...extras }; }
  function drag(id, x, y, extras = {}) {
    button(id).props.onPointerDown(event(100, 400, extras));
    button(id).props.onPointerMove(event(x, y, extras));
    button(id).props.onPointerUp(event(x, y, extras));
  }
  return { render, button, hole, event, drag, placements, get finished() { return finished; } };
}

test("The missing contour is exactly the Acre piece; all seven North states are represented", () => {
  const h = createHarness("app/north-puzzle-data.ts"), data = h.module;
  const original = JSON.parse(fs.readFileSync("app/brasil-cinco-regioes.json", "utf8"));
  assert.equal(data.northPuzzleStates.length, 6);
  assert.equal(data.northPuzzlePieces.find(p => p.id === "acre").d, data.acrePath);
  const north = original.regions.find(r => r.id === "norte").paths.map(p => p.d);
  const puzzlePaths = [...data.northPuzzleStates.flatMap(s => s.paths), data.acrePath];
  assert.equal(puzzlePaths.length, north.length);
  assert.ok(north.every(d => puzzlePaths.includes(d)));
  assert.deepEqual(Array.from(data.northPuzzlePieces, p => p.id), ["bahia", "acre", "parana", "goias"]);
});

test("Drop detection transforms screen coordinates into the geographic contour", () => {
  const { isOverPuzzleSlot } = createHarness("app/north-puzzle-data.ts").module;
  const p = { getScreenCTM() { return { inverse() { return {}; } }; },
    ownerSVGElement: { createSVGPoint() { return { x: 0, y: 0, matrixTransform() { return { x: (this.x - 100) / 2, y: (this.y - 50) / 2 }; } }; } },
    isPointInFill(point) { return point.x >= 10 && point.x <= 30 && point.y >= 10 && point.y <= 30; } };
  assert.equal(isOverPuzzleSlot(p, 140, 90), true);
  assert.equal(isOverPuzzleSlot(p, 300, 300), false);
  assert.equal(isOverPuzzleSlot(null, 140, 90), false);
});

test("Tap selection, wrong piece retry, correct snap and single completion", () => {
  const p = puzzle();
  p.hole().props.onClick(); assert.equal(p.placements.length, 0);
  assert.match(text(p.render()), /Escolha uma peça primeiro/);
  p.button("Bahia").props.onClick({ detail: 1 });
  assert.equal(p.button("Bahia").props["aria-pressed"], true);
  p.hole().props.onClick(); assert.deepEqual(p.placements, ["bahia"]);
  assert.match(text(p.render()), /Essa peça não encaixa/);
  p.button("Acre").props.onClick({ detail: 1 });
  p.hole().props.onClick(); assert.deepEqual(p.placements, ["bahia", "acre"]);
  assert.match(text(p.render()), /Mapa completo/);
  p.hole().props.onClick(); assert.equal(p.placements.length, 2);
  const finish = nodes(p.render()).find(n => n.type === "button" && text(n) === "CONCLUIR REGIÃO NORTE");
  finish.props.onClick(); assert.equal(p.finished, true);
});

test("Mouse and touch dragging show ghost then snap only inside the slot", () => {
  for (const pointerType of ["mouse", "touch"]) {
    const p = puzzle();
    p.button("Acre").props.onPointerDown(p.event(100, 400, { pointerType }));
    p.button("Acre").props.onPointerMove(p.event(350, 130, { pointerType }));
    assert.ok(nodes(p.render()).some(n => n.props?.className === "north-puzzle-ghost"));
    p.button("Acre").props.onPointerUp(p.event(350, 130, { pointerType }));
    assert.deepEqual(p.placements, ["acre"]);
    assert.equal(nodes(p.render()).some(n => n.props?.className === "north-puzzle-ghost"), false);
  }
});

test("Outside drops return the piece without attempts; wrong shapes do not solve", () => {
  const p = puzzle();
  p.drag("Acre", 800, 800); assert.equal(p.placements.length, 0);
  assert.match(text(p.render()), /voltou ao lugar/);
  p.button("Acre").props.onClick({ detail: 1 }); // Suppress native click following drag.
  assert.equal(p.button("Acre").props["aria-pressed"], false);
  p.drag("Goiás", 350, 130); assert.deepEqual(p.placements, ["goias"]);
  assert.ok(p.button("Acre"));
  p.drag("Acre", 350, 130); assert.deepEqual(p.placements, ["goias", "acre"]);
});

test("Cancelled/lost/multi-pointer drags and Escape never place a piece", () => {
  for (const cancellation of ["onPointerCancel", "onLostPointerCapture"]) {
    const p = puzzle();
    p.button("Acre").props.onPointerDown(p.event(100, 400));
    p.button("Acre").props.onPointerMove(p.event(350, 130));
    p.button("Acre").props[cancellation](p.event(350, 130));
    p.button("Acre").props.onPointerUp(p.event(350, 130));
    assert.equal(p.placements.length, 0);
  }
  const p = puzzle();
  p.drag("Acre", 350, 130, { isPrimary: false, pointerId: 2 }); assert.equal(p.placements.length, 0);
  p.button("Acre").props.onClick({ detail: 0 });
  p.render().props.onKeyDown({ key: "Escape" });
  assert.equal(p.button("Acre").props["aria-pressed"], false);
});

test("Keyboard selection and Enter/Space placement work without dragging", () => {
  for (const key of ["Enter", " "]) {
    const p = puzzle();
    p.button("Acre").props.onClick({ detail: 0 });
    let prevented = false;
    p.hole().props.onKeyDown({ key, preventDefault() { prevented = true; } });
    assert.equal(prevented, true); assert.deepEqual(p.placements, ["acre"]);
  }
});

test("Challenge 5 advances to puzzle, preserves scoring and completes the North journey", () => {
  const h = createHarness("app/page.tsx");
  const names = [...fs.readFileSync("app/page.tsx", "utf8").matchAll(/const \[(\w+), \w+\] = useState/g)].map(m => m[1]);
  const seed = (key, value) => { h.hooks[names.indexOf(key)] = value; };
  const get = key => h.hooks[names.indexOf(key)];
  const button = label => nodes(h.render()).find(n => n.type === "button" && text(n) === label);
  const child = () => nodes(h.render()).find(n => typeof n.type === "function" && n.type.name === "NorthPuzzle");
  h.render(); seed("screen", "north"); seed("northChallenge", 5); seed("sound", false);
  button("Vitória-régia").props.onClick(); button("PRÓXIMO DESAFIO").props.onClick();
  assert.equal(get("northChallenge"), 6); assert.equal(get("feedback"), "idle");
  assert.equal(get("attempts"), 0);
  const before = get("score");
  child().props.onPlace("bahia"); assert.equal(get("score"), before); assert.equal(get("feedback"), "idle");
  child().props.onPlace("acre"); assert.equal(get("score"), before + 60);
  assert.equal(get("unlockedLevel"), 2); assert.equal(get("feedback"), "correct");
  assert.equal(nodes(h.render()).some(n => n.props?.role === "dialog"), false, "Show the snapped map before the completion dialog");
  child().props.onPlace("acre"); assert.equal(get("score"), before + 60);
  button("🔊 OUVIR INSTRUÇÕES").props.onClick(); assert.match(h.narration, /Bahia, Acre, Paraná e Goiás/);
  child().props.onFinish(); assert.equal(get("feedback"), "finished");
  assert.match(text(h.render()), /Região Norte concluída/);
  button("VOLTAR À JORNADA").props.onClick(); assert.equal(get("screen"), "journey");
  // Fresh first-attempt completion earns 100, and finishing never lowers existing unlocks.
  seed("screen", "north"); seed("northChallenge", 6); seed("unlockedLevel", 4);
  const again = get("score"); child().props.onPlace("acre");
  assert.equal(get("score"), again + 100); assert.equal(get("unlockedLevel"), 4);
});
