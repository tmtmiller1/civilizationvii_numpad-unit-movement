import WorldInput from '/base-standard/ui/world-input/world-input.js';
import { ContextManager } from '/core/ui/context-manager/context-manager.js';
import { InterfaceMode } from '/core/ui/interface-modes/interface-modes.js';
import ViewManager from '/core/ui/views/view-manager.js';
import { directionFor, isIgnoredPress, keyCodeOf } from '/tmt-numpad-unit-movement/ui/numpad-keys.js';
import { DIRECTIONS, getBindings } from '/tmt-numpad-unit-movement/ui/numpad-settings.js';

// The map is rows of pointy-top hexes, so a tile has no neighbour straight above or below it. "north" and "south"
// take the diagonal neighbour that stays in the same column; pressed again from the next row, that is the other
// diagonal, so the unit zigzags straight up or down the screen.
const HEX_DIRECTION = {
  northwest: DirectionTypes.DIRECTION_NORTHWEST,
  northeast: DirectionTypes.DIRECTION_NORTHEAST,
  west: DirectionTypes.DIRECTION_WEST,
  east: DirectionTypes.DIRECTION_EAST,
  southwest: DirectionTypes.DIRECTION_SOUTHWEST,
  southeast: DirectionTypes.DIRECTION_SOUTHEAST,
};
const DIAGONALS = {
  north: [DirectionTypes.DIRECTION_NORTHWEST, DirectionTypes.DIRECTION_NORTHEAST],
  south: [DirectionTypes.DIRECTION_SOUTHWEST, DirectionTypes.DIRECTION_SOUTHEAST],
};

function isTyping() {
  const element = document.activeElement;
  if (!element) return false;
  return element.tagName === "INPUT" || element.tagName === "TEXTAREA" || element.isContentEditable;
}

// Only on the plain map with a unit selected: targeting modes (ranged attack, placing a building, choosing a plot),
// city screens and menus keep the keys to themselves. The rest are the checks the game makes before a right-click on
// the map.
function canMoveNow() {
  if (isTyping()) return false;
  if (!InterfaceMode.isInInterfaceMode("INTERFACEMODE_UNIT_SELECTED")) return false;
  return ContextManager.canUseInput("world-input", "action-target") && ViewManager.isWorldInputAllowed;
}

function neighbour(location, direction) {
  if (!DIAGONALS[direction]) {
    return GameplayMap.getAdjacentPlotLocation(location, HEX_DIRECTION[direction]);
  }
  const [left, right] = DIAGONALS[direction].map((d) => GameplayMap.getAdjacentPlotLocation(location, d));
  return left.x === location.x ? left : right;
}

function selectedUnit() {
  const unitId = UI.Player.getHeadSelectedUnit();
  if (!unitId || unitId.owner !== GameContext.localPlayerID) return null;
  return Units.get(unitId);
}

function onKeyDown(event) {
  if (isIgnoredPress(event)) return;
  const direction = directionFor(DIRECTIONS, getBindings(), keyCodeOf(event));
  if (!direction || !canMoveNow()) return;
  const unit = selectedUnit();
  if (!unit) return;
  const target = neighbour(unit.location, direction);
  if (!target || target.x < 0 || target.y < 0) return;
  // A right-click on the tile: moves, attacks, swaps places and asks before declaring war just as a click does.
  WorldInput.doActionOnPlot(target);
}

// Capture phase: with a unit selected the game stops key events before they bubble up to the window. The event is
// left to carry on, so the game and other mods still see it.
window.addEventListener("keydown", onKeyDown, true);
