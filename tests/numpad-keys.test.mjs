import test from "node:test";
import assert from "node:assert/strict";

import { isIgnoredPress, keyCodeOf, routeDirectionFor, settingFor } from "../ui/numpad-keys.js";
import { DIRECTIONS, ROUTE_HOLDS, SETTINGS } from "../ui/numpad-settings.js";

// Fields as the game delivered them on a Mac, recorded 2026-10-13 (see README test record).
const GAME_NUMPAD_7 = { code: "NumPad7", key: "g", keyCode: 103, location: 0 };
const GAME_DIGIT_6 = { code: "Digit6", key: "6", keyCode: 54, location: 0 };
const GAME_CTRL = { code: "Control", key: "", keyCode: 17, location: 0 };
const GAME_NUMPAD_5 = { code: "NumPad5", key: "e", keyCode: 101, location: 0 };

const DEFAULTS = Object.fromEntries(SETTINGS.map((s) => [s.id, s.key]));

test("the game's keypad codes read as standard codes", () => {
  assert.equal(keyCodeOf(GAME_NUMPAD_7), "Numpad7");
  assert.equal(keyCodeOf({ code: "Numpad7" }), "Numpad7");
  assert.equal(keyCodeOf(GAME_DIGIT_6), "Digit6");
  assert.equal(keyCodeOf({ code: "Home", keyCode: 36 }), "Home");
});

test("Ctrl and Shift read the same whichever side and however the game names them", () => {
  assert.equal(keyCodeOf(GAME_CTRL), "Control");
  assert.equal(keyCodeOf({ code: "LeftControl" }), "Control");
  assert.equal(keyCodeOf({ code: "RightShift" }), "Shift");
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
