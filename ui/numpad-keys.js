// Turning a key press into a direction or a route hold. No engine objects, so it runs under node for the tests.

const NUMPAD_LOCATION = 3;

// Windows virtual key codes for the keypad, which the game sends whatever the platform.
const KEYPAD_BY_KEYCODE = { 106: "NumpadMultiply", 107: "NumpadAdd" };
for (let n = 0; n <= 9; n++) KEYPAD_BY_KEYCODE[96 + n] = "Numpad" + n;

// With Shift held, a Windows keypad sends these instead of its digits (Num Lock is overridden), so while a route is
// being planned they count as the keys they stand in for.
const NAV_KEY_DIRECTION = {
  Home: "northwest",
  ArrowUp: "north",
  PageUp: "northeast",
  ArrowLeft: "west",
  ArrowRight: "east",
  End: "southwest",
  ArrowDown: "south",
  PageDown: "southeast",
};

// The game's page leaves shiftKey, ctrlKey, altKey and metaKey false on every key event, even with the modifier
// held, but the modifiers arrive as key events of their own. So the movement script keeps the set held right now.
export const MODIFIERS = ["Control", "Alt", "Shift", "Meta"];
const MODIFIER_FLAG = { Control: "ctrlKey", Alt: "altKey", Shift: "shiftKey", Meta: "metaKey" };

/**
 * The pressed key as a standard KeyboardEvent.code. The game's own key events differ from a browser's: a keypad 7
 * arrives as code "NumPad7", key "g" (the letter for its key code 103) and location 0, and Ctrl arrives as
 * "Control" with no left or right. The keypad is read from the code or the key code, never from `key`. With Num
 * Lock off a Windows keypad sends Home, the arrows and so on, and those count as Home, the arrows and so on.
 */
export function keyCodeOf(event) {
  const code = (event.code ?? "").replace(/^numpad/i, "Numpad")
    .replace(/^(?:(?:Left|Right)(Control|Shift|Alt|Meta)|(Control|Shift|Alt|Meta)(?:Left|Right))$/, "$1$2");
  if (code) return code;
  if (KEYPAD_BY_KEYCODE[event.keyCode]) return KEYPAD_BY_KEYCODE[event.keyCode];
  const key = event.key ?? "";
  if (/^[0-9]$/.test(key)) return (event.location === NUMPAD_LOCATION ? "Numpad" : "Digit") + key;
  if (/^[a-z]$/i.test(key)) return "Key" + key.toUpperCase();
  return key;
}

/** Notes a modifier going down or coming up in `held`, from that modifier's own key event. Other keys are skipped. */
export function trackModifier(held, code, down) {
  if (!MODIFIERS.includes(code)) return;
  if (down) held.add(code);
  else held.delete(code);
}

/**
 * Whether the press should be left alone: held down, or made with a modifier held (Shift+E and the like belong to
 * others). `held` comes from trackModifier; the event's own flags count as well, for a page that sets them. A
 * modifier in `holdCodes` doesn't count, since holding a route key is how a route is planned.
 */
export function isIgnoredPress(event, held = new Set(), holdCodes = []) {
  if (event.repeat) return true;
  return MODIFIERS.some((m) => (held.has(m) || Boolean(event[MODIFIER_FLAG[m]])) && !holdCodes.includes(m));
}

/** The id of the first setting in `settings` bound to `code`, or null. */
export function settingFor(settings, bindings, code) {
  if (!code) return null;
  return settings.find((s) => bindings[s.id] === code)?.id ?? null;
}

/**
 * The direction for a key pressed while a route is being planned: a bound direction key, or one of the keys a
 * Windows keypad sends in place of its digits while Shift is held.
 */
export function routeDirectionFor(directions, bindings, code) {
  return settingFor(directions, bindings, code) ?? NAV_KEY_DIRECTION[code] ?? null;
}
