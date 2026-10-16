import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";

// A plain in-memory localStorage; the game's own store is patched by settings-keeper.js, which has its own tests.
const store = new Map();
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key)
};

// The game's window, for the event a write sends.
globalThis.window = new EventTarget();

const {
  BINDINGS_CHANGED_EVENT, DIRECTIONS, HOLD_KEYS, KEYS, MOD_ID, ROUTE_HOLDS, forgetBindings, getBindings, setBinding
} = await import("../ui/numpad-settings.js");
const silenceErrors = (t) => t.mock.method(console, "error", () => {});

// The tests change the store behind the module's back, as another script context would.
beforeEach(() => {
  store.clear();
  forgetBindings();
});

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
  const holdCodes = HOLD_KEYS.map((k) => k.code);
  for (const h of ROUTE_HOLDS) assert.ok(holdCodes.includes(h.key), h.key);
  assert.equal(new Set(holdCodes).size, holdCodes.length);
});

test("the cancel key defaults to Numpad 0 and is offered the same keys as a direction", () => {
  assert.equal(getBindings().cancel, "Numpad0");
  setBinding("cancel", "Delete");
  assert.equal(getBindings().cancel, "Delete");
});

test("the route hold keys are saved and read back like the directions", () => {
  assert.equal(getBindings().route, "Numpad5");
  assert.equal(getBindings()["route-left"], "Control");
  setBinding("route-left", "Tab");
  assert.equal(getBindings()["route-left"], "Tab");
  assert.equal(getBindings().route, "Numpad5");
});

test("a direction cannot be given a modifier and a hold key cannot be given an unknown code", () => {
  store.set("modSettings", JSON.stringify({ [MOD_ID]: { bindings: { east: "Control", route: "Semicolon" } } }));
  assert.equal(getBindings().east, "Numpad6");
  assert.equal(getBindings().route, "Numpad5");
});

test("many key presses read the store once", (t) => {
  setBinding("east", "Home");
  const getItem = t.mock.method(globalThis.localStorage, "getItem");
  for (let press = 0; press < 20; press++) assert.equal(getBindings().east, "Home");
  assert.ok(getItem.mock.callCount() <= 1, `${getItem.mock.callCount()} reads`);
});

test("a write changes the kept keys at once and tells the window", (t) => {
  getBindings();
  let told = 0;
  const listener = () => told++;
  window.addEventListener(BINDINGS_CHANGED_EVENT, listener);
  t.after(() => window.removeEventListener(BINDINGS_CHANGED_EVENT, listener));
  setBinding("west", "End");
  const getItem = t.mock.method(globalThis.localStorage, "getItem");
  assert.equal(getBindings().west, "End");
  assert.equal(getItem.mock.callCount(), 0);
  assert.equal(told, 1);
});

test("a change written elsewhere shows once the kept keys are forgotten, with one read", (t) => {
  assert.equal(getBindings().east, "Numpad6");
  store.set("modSettings", JSON.stringify({ [MOD_ID]: { bindings: { east: "PageDown" } } }));
  assert.equal(getBindings().east, "Numpad6");
  const getItem = t.mock.method(globalThis.localStorage, "getItem");
  forgetBindings();
  for (let press = 0; press < 5; press++) assert.equal(getBindings().east, "PageDown");
  assert.equal(getItem.mock.callCount(), 1);
});

test("a write that doesn't go ahead leaves the kept keys and the window alone", (t) => {
  silenceErrors(t);
  assert.equal(getBindings().east, "Numpad6");
  let told = 0;
  const listener = () => told++;
  window.addEventListener(BINDINGS_CHANGED_EVENT, listener);
  t.after(() => window.removeEventListener(BINDINGS_CHANGED_EVENT, listener));
  store.set("modSettings", "[1,2,3]");
  setBinding("east", "End");
  assert.equal(getBindings().east, "Numpad6");
  assert.equal(told, 0);
});

test("only letters are marked as game hotkeys", () => {
  for (const key of [...KEYS, ...HOLD_KEYS]) assert.equal(key.gameKey, /^Key[A-Z]$/.test(key.code), key.code);
});
