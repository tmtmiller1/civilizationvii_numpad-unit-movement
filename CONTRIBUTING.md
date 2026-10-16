# Contributing

Numpad Unit Movement is small: a key press becomes a right-click on the neighbouring tile. Keep it that size.

## Ground rules

- Every move goes through the game's own right-click handler (`WorldInput.doActionOnPlot`), so attacks, swaps and
  the declare-war prompt behave exactly as a click does. Never send unit operations directly.
- Never take a key away from anyone: no `preventDefault`, no `stopPropagation`. The listener is in the capture phase
  only because the game stops key events before they bubble to the window when a unit is selected.
- Act only in `INTERFACEMODE_UNIT_SELECTED`, with no text box focused, and only when the game's own right-click
  checks pass.
- The game's key events are not a browser's: a keypad 7 arrives as code `NumPad7`, key `g`. Read keys through
  `keyCodeOf`, and offer a key in Options only after its real code has been recorded (README test record).
- No base-game files replaced. No gameplay effect, nothing in the save.

## Layout

- `ui/numpad-unit-movement.js` listens for keys and moves the selected unit.
- `ui/numpad-keys.js` turns a key press into a direction; no engine objects, so the tests import it.
- `ui/numpad-settings.js` holds the directions, the keys on offer and the saved bindings.
- `ui/numpad-options.js` adds the rows in Options > Add-ons.
- `ui/settings-keeper.js` is the Tower Settings Keeper file, copied unchanged; it is linted and tested in its own repo.
- `numpad-unit-movement.modinfo` loads the options in the shell and game scopes and the movement script in the game.
- `text/en_us/ModText.xml` holds the text.
- `images/` holds the icon (`numpad-unit-movement-icon.svg`, rendered to the PNG with
  `rsvg-convert -w 512 -h 512`); `docs/workshop-preview.png` is the same art at 1024 for the Workshop and the GitHub
  release, and `docs/screenshots/` holds the captures the README and the release show.
- `docs/windows-checklist.md` lists the checks to run on Windows, where the mod hasn't been tried yet.
- `tests/`, `eslint.config.js` and `package.json` are the dev gate; `npm run verify` runs lint, a syntax check and
  the unit tests. `./release.sh` runs the gate and builds the mod zip plus the `-logos` and `-screenshots` zips that
  go on the GitHub release.
- `devtools/` drives a running game through Tower Bench: `step.sh` sends one key event into the page,
  `real-keys.sh` presses each number pad key through macOS with `keypad.swift`, and `mouse.swift` moves and clicks
  the real mouse. Both need Accessibility permission and refuse to send anything unless the game is the frontmost
  app. The game updates its plot cursor only on mouse motion, so `mouse.swift` steps the pointer away and back
  before every click.
