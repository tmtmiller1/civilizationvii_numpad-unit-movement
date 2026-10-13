import WorldInput from '/base-standard/ui/world-input/world-input.js';
import { UnitMapDecorationSupport } from '/base-standard/ui/interface-modes/support-unit-map-decoration.js';
import { ContextManager } from '/core/ui/context-manager/context-manager.js';
import { InterfaceMode } from '/core/ui/interface-modes/interface-modes.js';
import ViewManager from '/core/ui/views/view-manager.js';
import { isIgnoredPress, keyCodeOf, routeDirectionFor, settingFor } from '/tmt-numpad-unit-movement/ui/numpad-keys.js';
import { DIRECTIONS, ROUTE_HOLDS, getBindings } from '/tmt-numpad-unit-movement/ui/numpad-settings.js';

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

// A route being planned: the key held down, the unit it is for and the tile the marker is on.
let route = null;

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

function onMap(plot) {
  return Boolean(plot) && plot.x >= 0 && plot.y >= 0 && plot.x < GameplayMap.getGridWidth()
    && plot.y < GameplayMap.getGridHeight();
}

function selectedUnit() {
  const unitId = UI.Player.getHeadSelectedUnit();
  if (!unitId || unitId.owner !== GameContext.localPlayerID) return null;
  return Units.get(unitId);
}

const samePlot = (a, b) => a.x === b.x && a.y === b.y;
const sameUnit = (a, b) => a.id === b.id && a.owner === b.owner;

// The game's own route preview, as drawn while a right-click is held: the dotted path, turn counts and a marker on
// the destination.
function showPreview(target) {
  UnitMapDecorationSupport.manager.showDesiredDestination = true;
  UnitMapDecorationSupport.manager.update(target);
}

function hidePreview() {
  UnitMapDecorationSupport.manager.showDesiredDestination = false;
  UnitMapDecorationSupport.manager.update(void 0);
}

function startRoute(holdCode) {
  const unit = canMoveNow() ? selectedUnit() : null;
  if (!unit) return;
  route = { holdCode, unitId: unit.id, target: { x: unit.location.x, y: unit.location.y } };
  showPreview(route.target);
}

function stepRoute(direction) {
  const next = neighbour(route.target, direction);
  if (!onMap(next)) return;
  route.target = next;
  showPreview(route.target);
}

// Releasing the held key sends the unit to the marker as one right-click would: the game finds the path, over
// several turns if it has to.
function finishRoute() {
  const { target, unitId } = route;
  route = null;
  hidePreview();
  const unit = selectedUnit();
  if (!unit || !sameUnit(unit.id, unitId) || samePlot(target, unit.location) || !canMoveNow()) return;
  WorldInput.doActionOnPlot(target);
}

function cancelRoute() {
  route = null;
  hidePreview();
}

// A key pressed while a route is being planned: Escape drops it, a direction key moves the marker.
function onRouteKey(code) {
  if (code === "Escape") return cancelRoute();
  const direction = routeDirectionFor(DIRECTIONS, getBindings(), code);
  if (direction) stepRoute(direction);
}

// A right-click on the next tile: moves, attacks, swaps places and asks before declaring war just as a click does.
function moveOneTile(direction) {
  if (!canMoveNow()) return;
  const unit = selectedUnit();
  if (!unit) return;
  const target = neighbour(unit.location, direction);
  if (onMap(target)) WorldInput.doActionOnPlot(target);
}

function onKeyDown(event) {
  if (event.repeat) return;
  const code = keyCodeOf(event);
  if (route) return onRouteKey(code);
  const bindings = getBindings();
  if (settingFor(ROUTE_HOLDS, bindings, code)) return startRoute(code);
  if (isIgnoredPress(event)) return;
  const direction = settingFor(DIRECTIONS, bindings, code);
  if (direction) moveOneTile(direction);
}

function onKeyUp(event) {
  if (route && keyCodeOf(event) === route.holdCode) finishRoute();
}

// Capture phase: with a unit selected the game stops key events before they bubble up to the window. The events are
// left to carry on, so the game and other mods still see them.
window.addEventListener("keydown", onKeyDown, true);
window.addEventListener("keyup", onKeyUp, true);
