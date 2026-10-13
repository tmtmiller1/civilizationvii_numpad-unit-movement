# Changelog

All notable changes to Numpad Unit Movement are documented here. This project follows semantic versioning.

## [1.0.0] - 2026-10-13

- First release. The number pad moves the selected unit one tile in eight directions, as a right-click on that tile
  would. 8 and 2 travel straight up and down the map.
- Route planning: hold Numpad 5 (or Ctrl, for the other hand) and press the direction keys to walk a marker across
  the map; the game draws the path and turn count as you go. Release the key and the unit is sent there as one
  right-click would, across several turns if needed. Escape while holding drops the route.
- Numpad 0 is the game's own Cancel action: a unit carrying out an order stops and waits.
- Each direction's key, both hold keys and Cancel can be changed in Options > Add-ons.
