#!/bin/zsh
# step.sh <digit> [code-style]  : restore moves, select the first unit, press the keypad digit, report the move.
cd "$(dirname "$0")/../../../tools/tower-bench" || exit 1
digit=$1; style=${2:-code}
uid=$(node tower-bench.mjs eval "Players.get(GameContext.localPlayerID).Units.getUnitIds()[0].id" | tail -1)
node tower-bench.mjs do moves --unit "$(node tower-bench.mjs eval "(()=>{const u=Units.get(Players.get(GameContext.localPlayerID).Units.getUnitIds()[0]);return u.location.x+','+u.location.y})()" | tail -1 | tr -d '"')" --yes > /dev/null 2>&1
node tower-bench.mjs eval "(async()=>{
  const id = Players.get(GameContext.localPlayerID).Units.getUnitIds()[0];
  UI.Player.selectUnit(id);
  await new Promise(r=>setTimeout(r,400));
  const u0 = Units.get(id); const from = {x:u0.location.x, y:u0.location.y}; const p0 = WorldUI.getPlotLocation(from);
  const init = '$style'==='code' ? {code:'Numpad$digit', key:'$digit', location:3} : '$style'==='home' ? {code:'Home', key:'Home', location:0} : '$style'==='location' ? {key:'$digit', location:3} : {code:'Digit$digit', key:'$digit', location:0};
  const ev = new Event('keydown'); for (const [k,v] of Object.entries({repeat:false,ctrlKey:false,altKey:false,metaKey:false,...init})) Object.defineProperty(ev,k,{value:v}); window.dispatchEvent(ev);
  await new Promise(r=>setTimeout(r,2500));
  const u1 = Units.get(id); const to = {x:u1.location.x, y:u1.location.y}; const p1 = WorldUI.getPlotLocation(to);
  return JSON.stringify({digit:$digit, style:'$style', from, to, worldDx: Math.round(p1.x-p0.x), worldDy: Math.round(p1.y-p0.y), moves:u1.Movement.movementMovesRemaining, head: UI.Player.getHeadSelectedUnit()?.id});
})()" | tail -1
