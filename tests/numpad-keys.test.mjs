import test from "node:test";
import assert from "node:assert/strict";

import { directionFor, isIgnoredPress, keyCodeOf } from "../ui/numpad-keys.js";
import { DIRECTIONS } from "../ui/numpad-settings.js";

// Fields as the game delivered them on a Mac, recorded 2026-10-13 (see README test record).
const GAME_NUMPAD_7 = { code: "NumPad7", key: "g", keyCode: 103, location: 0 };
const GAME_DIGIT_6 = { code: "Digit6", key: "6", keyCode: 54, location: 0 };

test("the game's keypad codes read as standard codes", () => {
  assert.equal(keyCodeOf(GAME_NUMPAD_7), "Numpad7");
  assert.equal(keyCodeOf({ code: "Numpad7" }), "Numpad7");
  assert.equal(keyCodeOf(GAME_DIGIT_6), "Digit6");
  assert.equal(keyCodeOf({ code: "Home", keyCode: 36 }), "Home");
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

test("held keys and modified presses are ignored", () => {
  assert.equal(isIgnoredPress({ repeat: true }), true);
  for (const modifier of ["ctrlKey", "altKey", "metaKey", "shiftKey"]) {
    assert.equal(isIgnoredPress({ [modifier]: true }), true, modifier);
  }
  assert.equal(isIgnoredPress(GAME_NUMPAD_7), false);
});

test("the default keys map to the eight directions like the keypad's layout", () => {
  const defaults = Object.fromEntries(DIRECTIONS.map((d) => [d.id, d.key]));
  const expected = {
    Numpad7: "northwest", Numpad8: "north", Numpad9: "northeast",
    Numpad4: "west", Numpad6: "east",
    Numpad1: "southwest", Numpad2: "south", Numpad3: "southeast"
  };
  for (const [code, direction] of Object.entries(expected)) {
    assert.equal(directionFor(DIRECTIONS, defaults, code), direction, code);
  }
  assert.equal(directionFor(DIRECTIONS, defaults, "Numpad5"), null);
  assert.equal(directionFor(DIRECTIONS, defaults, "Digit6"), null);
  assert.equal(directionFor(DIRECTIONS, defaults, ""), null);
});

test("a key bound twice goes to the first direction in the list", () => {
  const bindings = Object.fromEntries(DIRECTIONS.map((d) => [d.id, ""]));
  bindings.east = "Home";
  bindings.northwest = "Home";
  assert.equal(directionFor(DIRECTIONS, bindings, "Home"), "northwest");
});
