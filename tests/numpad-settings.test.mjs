import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";

// A plain in-memory localStorage; the game's own store is patched by settings-keeper.js, which has its own tests.
const store = new Map();
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key)
};

const { DIRECTIONS, KEYS, MOD_ID, getBindings, setBinding } = await import("../ui/numpad-settings.js");
const silenceErrors = (t) => t.mock.method(console, "error", () => {});

beforeEach(() => store.clear());

test("with nothing stored, every direction has its default key", () => {
  const bindings = getBindings();
  for (const d of DIRECTIONS) assert.equal(bindings[d.id], d.key);
});

test("a saved key is read back and the others keep their defaults", () => {
  setBinding("east", "Home");
  const bindings = getBindings();
  assert.equal(bindings.east, "Home");
  assert.equal(bindings.west, "Numpad4");
});

test("None is stored as an empty code and switches the direction off", () => {
  setBinding("north", "");
  assert.equal(getBindings().north, "");
});

test("other mods' sections in modSettings are kept", () => {
  store.set("modSettings", JSON.stringify({ "other-mod": { a: 1 } }));
  setBinding("east", "End");
  const root = JSON.parse(store.get("modSettings"));
  assert.deepEqual(root["other-mod"], { a: 1 });
  assert.equal(root[MOD_ID].bindings.east, "End");
});

test("a store that is not a settings object is never overwritten", (t) => {
  silenceErrors(t);
  store.set("modSettings", "[1,2,3]");
  setBinding("east", "End");
  assert.equal(store.get("modSettings"), "[1,2,3]");
  assert.equal(getBindings().east, "Numpad6");
});

test("a stored key the list does not offer falls back to the default", () => {
  store.set("modSettings", JSON.stringify({ [MOD_ID]: { bindings: { east: "Semicolon", west: 7 } } }));
  const bindings = getBindings();
  assert.equal(bindings.east, "Numpad6");
  assert.equal(bindings.west, "Numpad4");
});

test("every default key is offered in Options, and no code is listed twice", () => {
  const codes = KEYS.map((k) => k.code);
  for (const d of DIRECTIONS) assert.ok(codes.includes(d.key), d.key);
  assert.equal(new Set(codes).size, codes.length);
});

test("only letters are marked as game hotkeys", () => {
  for (const key of KEYS) assert.equal(key.gameKey, /^Key[A-Z]$/.test(key.code), key.code);
});
