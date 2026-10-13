// Which key moves the selected unit in each direction, and which keys are held to plan a route.
//
// The choice lives in the shared "modSettings" localStorage entry under this mod's id, the store Tower's other mods
// use (settings-keeper.js keeps that entry readable). It is the player's, not the save's. No caching: the Options
// screen and the game run in separate script contexts, so every read goes to the store.

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

// Every setting, in the order the Options rows show them.
export const SETTINGS = [...DIRECTIONS, ...ROUTE_HOLDS];

function readRoot() {
  try {
    const parsed = JSON.parse(localStorage.getItem("modSettings") || "null");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch (_) {
    return null;
  }
}

/** @returns {Record<string, string>} setting id -> KeyboardEvent.code ("" for none), defaults filled in. */
export function getBindings() {
  const saved = readRoot()?.[MOD_ID]?.bindings ?? {};
  const bindings = {};
  for (const setting of SETTINGS) {
    const code = saved[setting.id];
    bindings[setting.id] = typeof code === "string" && setting.keys.some((k) => k.code === code) ? code : setting.key;
  }
  return bindings;
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
  section.bindings = { ...getBindings(), ...section.bindings, [settingId]: code };
  root[MOD_ID] = section;
  try {
    localStorage.setItem("modSettings", JSON.stringify(root));
  } catch (e) {
    console.error("[NumpadUnitMovement] key not saved: " + e);
  }
}
