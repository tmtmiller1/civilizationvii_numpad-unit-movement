# Changelog

All notable changes to Numpad Unit Movement are documented here. This project follows semantic versioning.

## [Unreleased]

- Carries Civilopedia History Corrections. With Civilopedia Expanded: Independents on, six East Asian history pages
  in the Civilopedia (Goguryeo, the Oirat, two Ryukyu pages, Nanzhao and Balhae) give each side where historians in
  different countries disagree, and a few factual errors are fixed. With it off, the game's pages stay as they are.

## [1.0.2] - 2026-10-16

- A key pressed while Shift, Alt (Option) or Cmd is held is left to the game and other mods, as it was always meant
  to be. The game leaves the modifier flags off every key press, so the old check never fired and Shift with a bound
  key moved the unit like the key alone. The mod now follows the modifier keys going down and coming up itself. Ctrl
  counts too, unless it's one of your route keys, as it is out of the box, so holding it still plans a route.
- Your keys are read once when the game loads and kept, so a key press no longer reads every mod's saved settings.
  With a large settings store (Demographics' records, for one) that read cost about 7 ms on every press. A change in
  Options still applies to the next key press.

## [1.0.1] - 2026-10-14

- The license now says that Civilization VII and its art and data belong to Firaxis and 2K. The mod itself plays
  exactly as in 1.0.0.

## [1.0.0] - 2026-10-13

- First release. The number pad moves the selected unit one tile in eight directions, as a right-click on that tile
  would. 8 and 2 travel straight up and down the map.
- Route planning: hold Numpad 5 (or Ctrl, for the other hand) and press the direction keys to walk a marker across
  the map; the game draws the path and turn count as you go. Release the key and the unit is sent there as one
  right-click would, across several turns if needed. Escape while holding drops the route.
- Numpad 0 is the game's own Cancel action: a unit carrying out an order stops and waits.
- Each direction's key, both hold keys and Cancel can be changed in Options > Add-ons.
