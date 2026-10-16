// Which key moves the selected unit in each direction, and which keys are held to plan a route.
//
// The choice lives in the shared "modSettings" localStorage entry under this mod's id, the store Tower's other mods
// use (settings-keeper.js keeps that entry readable). It is the player's, not the save's. That entry holds every
// mod's data and runs to half a megabyte or more, so one read costs several milliseconds: the bindings are read once
// and kept here. A write here updates them and sends BINDINGS_CHANGED_EVENT on the window; Options opening and that
// event make the next getBindings() read the store again. The main menu and a game are separate pages, each with its
// own copy of this module, and a game reads the store when it loads. In a game, Options opens in the game's own page
// (the pause menu pushes it through ContextManager), so a change there reaches the key handler on the next press.

export const MOD_ID = "tmt-numpad-unit-movement";

// Keys a player can pick, by KeyboardEvent.code. Only keys whose code the game was seen to send: punctuation is left
// out because the game names it its own way ("SemiColon"). The letters are hotkeys in the unmodded game, so pressing
// one also does the game's action; they are offered for players who have moved the game's keys elsewhere.
const GAME_KEYS = new Set([..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((l) => "Key" + l));
export const KEYS = [
  { code: "", label: "LOC_NUMPAD_MOVE_KEY_NONE" },
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n) => ({ code: "Numpad" + n, label: "Numpad " + n })),
  // Numpad ., - and / are left out: on a Mac the game reports . as - and - with no code.
  { code: "NumpadAdd", label: "Numpad +" },
  { code: "NumpadMultiply", label: "Numpad *" },
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n) => ({ code: "Digit" + n, label: String(n) })),
  { code: "Home", label: "Home" },
  { code: "End", label: "End" },
  { code: "PageUp", label: "Page Up" },
  { code: "PageDown", label: "Page Down" },
  { code: "Delete", label: "Delete" },
  ...[..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((l) => ({ code: "Key" + l, label: l })),
].map((k) => ({ ...k, gameKey: GAME_KEYS.has(k.code) }));

// Keys that can be held to plan a route: the modifiers the game passes on as a key-down and a key-up (Ctrl is
// "Control" on either side; Backquote and Caps Lock send no usable key-down), then the same keys as above. Shift
// carries a note: on Windows it makes the keypad send Home, the arrows and so on, which still steer the route but
// also pan the camera.
export const HOLD_KEYS = [
  KEYS[0],
  { code: "Control", label: "Ctrl", gameKey: false },
  { code: "Shift", label: "LOC_NUMPAD_MOVE_KEY_SHIFT", gameKey: false },
  { code: "Tab", label: "Tab", gameKey: false },
  ...KEYS.slice(1),
];

// The game's map rows are pointy-top hexes. "north" and "south" have no neighbour of their own: they take the
// diagonal that stays in the unit's column, which zigzags straight up or down the screen.
export const DIRECTIONS = [
  { id: "northwest", label: "LOC_NUMPAD_MOVE_NORTHWEST", key: "Numpad7", keys: KEYS },
  { id: "north", label: "LOC_NUMPAD_MOVE_NORTH", key: "Numpad8", keys: KEYS },
  { id: "northeast", label: "LOC_NUMPAD_MOVE_NORTHEAST", key: "Numpad9", keys: KEYS },
  { id: "west", label: "LOC_NUMPAD_MOVE_WEST", key: "Numpad4", keys: KEYS },
  { id: "east", label: "LOC_NUMPAD_MOVE_EAST", key: "Numpad6", keys: KEYS },
  { id: "southwest", label: "LOC_NUMPAD_MOVE_SOUTHWEST", key: "Numpad1", keys: KEYS },
  { id: "south", label: "LOC_NUMPAD_MOVE_SOUTH", key: "Numpad2", keys: KEYS },
  { id: "southeast", label: "LOC_NUMPAD_MOVE_SOUTHEAST", key: "Numpad3", keys: KEYS },
];

// Two keys for planning a route: one under the hand on the keypad, one for the other hand.
export const ROUTE_HOLDS = [
  { id: "route", label: "LOC_NUMPAD_MOVE_ROUTE_KEY", key: "Numpad5", keys: HOLD_KEYS },
  { id: "route-left", label: "LOC_NUMPAD_MOVE_ROUTE_KEY_LEFT", key: "Control", keys: HOLD_KEYS },
];

// The game's own Cancel action, the button that appears while a unit is carrying out an order.
export const CANCEL = { id: "cancel", label: "LOC_NUMPAD_MOVE_CANCEL", key: "Numpad0", keys: KEYS };

// Every setting, in the order the Options rows show them.
export const SETTINGS = [...DIRECTIONS, ...ROUTE_HOLDS, CANCEL];

export const BINDINGS_CHANGED_EVENT = "numpad-unit-movement-bindings-changed";

let cached = null;

function readRoot() {
  try {
    const parsed = JSON.parse(localStorage.getItem("modSettings") || "null");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch (_) {
    return null;
  }
}

// The saved keys with the defaults filled in; a key the list doesn't offer falls back to the default.
function bindingsFrom(saved) {
  const bindings = {};
  for (const setting of SETTINGS) {
    const code = saved?.[setting.id];
    bindings[setting.id] = typeof code === "string" && setting.keys.some((k) => k.code === code) ? code : setting.key;
  }
  return bindings;
}

/** @returns {Record<string, string>} setting id -> KeyboardEvent.code ("" for none), defaults filled in. */
export function getBindings() {
  cached ??= bindingsFrom(readRoot()?.[MOD_ID]?.bindings);
  return cached;
}

/** The next getBindings() reads the store again, for when something else may have written it. */
export function forgetBindings() {
  cached = null;
}

// The keys just saved become the kept ones, and the window hears of it.
function keepSaved(saved) {
  cached = bindingsFrom(saved);
  try {
    window.dispatchEvent(new CustomEvent(BINDINGS_CHANGED_EVENT));
  } catch (_) {
    /* no window */
  }
}

/** Saves one setting's key. A write goes ahead only over a store that reads back as a settings root. */
export function setBinding(settingId, code) {
  let root = {};
  try {
    const raw = localStorage.getItem("modSettings");
    if (raw) {
      root = readRoot();
      if (!root) {
        console.error("[NumpadUnitMovement] modSettings is not a settings object; key not saved");
        return;
      }
    }
  } catch (_) {
    return;
  }
  const section = root[MOD_ID] && typeof root[MOD_ID] === "object" ? root[MOD_ID] : {};
  section.bindings = { ...bindingsFrom(section.bindings), ...section.bindings, [settingId]: code };
  root[MOD_ID] = section;
  try {
    localStorage.setItem("modSettings", JSON.stringify(root));
  } catch (e) {
    console.error("[NumpadUnitMovement] key not saved: " + e);
    return;
  }
  keepSaved(section.bindings);
}
