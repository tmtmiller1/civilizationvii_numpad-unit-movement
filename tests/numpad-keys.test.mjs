import test from "node:test";
import assert from "node:assert/strict";

import { isIgnoredPress, keyCodeOf, routeDirectionFor, settingFor, trackModifier } from "../ui/numpad-keys.js";
import { DIRECTIONS, ROUTE_HOLDS, SETTINGS } from "../ui/numpad-settings.js";

// Fields as the game delivered them on a Mac, recorded 2026-10-13 (see README test record).
const GAME_NUMPAD_7 = { code: "NumPad7", key: "g", keyCode: 103, location: 0 };
const GAME_DIGIT_6 = { code: "Digit6", key: "6", keyCode: 54, location: 0 };
const GAME_CTRL = { code: "Control", key: "", keyCode: 17, location: 0 };
const GAME_NUMPAD_5 = { code: "NumPad5", key: "e", keyCode: 101, location: 0 };
// The game leaves shiftKey, ctrlKey, altKey and metaKey false on every key event, even with the modifier held; the
// modifiers arrive as key events of their own (recorded 2026-10-15 on 1.5.0).
const GAME_SHIFT = { code: "Shift", key: "", keyCode: 16, location: 0 };
const GAME_KEY_E = { code: "KeyE", key: "E", keyCode: 69, location: 0, shiftKey: false, ctrlKey: false };
const GAME_NUMPAD_9 = { code: "NumPad9", key: "i", keyCode: 105, location: 0, shiftKey: false, ctrlKey: false };

const DEFAULTS = Object.fromEntries(SETTINGS.map((s) => [s.id, s.key]));

test("the game's keypad codes read as standard codes", () => {
  assert.equal(keyCodeOf(GAME_NUMPAD_7), "Numpad7");
  assert.equal(keyCodeOf({ code: "Numpad7" }), "Numpad7");
  assert.equal(keyCodeOf(GAME_DIGIT_6), "Digit6");
  assert.equal(keyCodeOf({ code: "Home", keyCode: 36 }), "Home");
});

test("the modifiers read the same whichever side and however the game names them", () => {
  assert.equal(keyCodeOf(GAME_CTRL), "Control");
  assert.equal(keyCodeOf(GAME_SHIFT), "Shift");
  assert.equal(keyCodeOf({ code: "LeftControl" }), "Control");
  assert.equal(keyCodeOf({ code: "RightShift" }), "Shift");
  assert.equal(keyCodeOf({ code: "AltLeft" }), "Alt");
  assert.equal(keyCodeOf({ code: "MetaRight" }), "Meta");
  assert.equal(keyCodeOf({ code: "Meta" }), "Meta");
});

test("a keypad key with no code is read from its key code, never from key", () => {
  assert.equal(keyCodeOf({ code: "", key: "g", keyCode: 103 }), "Numpad7");
  assert.equal(keyCodeOf({ code: "", key: "`", keyCode: 96 }), "Numpad0");
  assert.equal(keyCodeOf({ code: "", key: "j", keyCode: 106 }), "NumpadMultiply");
  assert.equal(keyCodeOf({ code: "", key: "k", keyCode: 107 }), "NumpadAdd");
});

test("with neither code nor keypad key code, key and location decide", () => {
  assert.equal(keyCodeOf({ key: "7", location: 3 }), "Numpad7");
  assert.equal(keyCodeOf({ key: "7", location: 0 }), "Digit7");
  assert.equal(keyCodeOf({ key: "q" }), "KeyQ");
  assert.equal(keyCodeOf({}), "");
});

test("held keys are ignored, and so are presses whose event carries a modifier flag", () => {
  assert.equal(isIgnoredPress({ repeat: true }), true);
  for (const modifier of ["ctrlKey", "altKey", "metaKey", "shiftKey"]) {
    assert.equal(isIgnoredPress({ [modifier]: true }), true, modifier);
  }
  assert.equal(isIgnoredPress(GAME_NUMPAD_7), false);
});

test("a press made with Shift held is ignored, though the game leaves shiftKey false", () => {
  const held = new Set();
  trackModifier(held, keyCodeOf(GAME_SHIFT), true);
  assert.equal(isIgnoredPress(GAME_KEY_E, held, []), true);
  trackModifier(held, keyCodeOf(GAME_SHIFT), false);
  assert.equal(isIgnoredPress(GAME_KEY_E, held, []), false);
});

test("only the modifiers' own key events change the held set", () => {
  const held = new Set();
  for (const event of [GAME_NUMPAD_7, GAME_KEY_E, GAME_NUMPAD_5]) trackModifier(held, keyCodeOf(event), true);
  assert.equal(held.size, 0);
  trackModifier(held, keyCodeOf(GAME_CTRL), true);
  trackModifier(held, keyCodeOf({ code: "Alt" }), true);
  assert.deepEqual([...held].sort(), ["Alt", "Control"]);
  trackModifier(held, keyCodeOf(GAME_CTRL), false);
  assert.deepEqual([...held], ["Alt"]);
});

test("a modifier bound as a route key doesn't stop the keys, and the others still do", () => {
  const holdCodes = ROUTE_HOLDS.map((h) => DEFAULTS[h.id]);
  const held = new Set();
  trackModifier(held, keyCodeOf(GAME_CTRL), true);
  assert.equal(isIgnoredPress(GAME_NUMPAD_9, held, holdCodes), false);
  trackModifier(held, keyCodeOf(GAME_SHIFT), true);
  assert.equal(isIgnoredPress(GAME_NUMPAD_9, held, holdCodes), true);
  assert.equal(isIgnoredPress(GAME_NUMPAD_9, held, ["Numpad5", "Shift", "Control"]), false);
});

test("the default keys map to the eight directions like the keypad's layout", () => {
  const expected = {
    Numpad7: "northwest", Numpad8: "north", Numpad9: "northeast",
    Numpad4: "west", Numpad6: "east",
    Numpad1: "southwest", Numpad2: "south", Numpad3: "southeast"
  };
  for (const [code, direction] of Object.entries(expected)) {
    assert.equal(settingFor(DIRECTIONS, DEFAULTS, code), direction, code);
  }
  assert.equal(settingFor(DIRECTIONS, DEFAULTS, "Numpad5"), null);
  assert.equal(settingFor(DIRECTIONS, DEFAULTS, "Digit6"), null);
  assert.equal(settingFor(DIRECTIONS, DEFAULTS, ""), null);
});

test("a key bound twice goes to the first setting in the list", () => {
  const bindings = Object.fromEntries(SETTINGS.map((s) => [s.id, ""]));
  bindings.east = "Home";
  bindings.northwest = "Home";
  assert.equal(settingFor(DIRECTIONS, bindings, "Home"), "northwest");
});

test("by default a route is planned with Numpad 5 or Ctrl held, and no direction key is a hold key", () => {
  assert.equal(settingFor(ROUTE_HOLDS, DEFAULTS, keyCodeOf(GAME_NUMPAD_5)), "route");
  assert.equal(settingFor(ROUTE_HOLDS, DEFAULTS, keyCodeOf(GAME_CTRL)), "route-left");
  for (const d of DIRECTIONS) assert.equal(settingFor(ROUTE_HOLDS, DEFAULTS, d.key), null, d.key);
});

test("while planning, the direction keys steer, and so do the keys a Windows keypad sends with Shift held", () => {
  assert.equal(routeDirectionFor(DIRECTIONS, DEFAULTS, "Numpad9"), "northeast");
  assert.equal(routeDirectionFor(DIRECTIONS, DEFAULTS, "PageUp"), "northeast");
  assert.equal(routeDirectionFor(DIRECTIONS, DEFAULTS, "ArrowUp"), "north");
  assert.equal(routeDirectionFor(DIRECTIONS, DEFAULTS, "End"), "southwest");
  assert.equal(routeDirectionFor(DIRECTIONS, DEFAULTS, "Numpad5"), null);
  assert.equal(routeDirectionFor(DIRECTIONS, DEFAULTS, "KeyQ"), null);
});
