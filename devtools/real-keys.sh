#!/bin/zsh
# Presses each number pad key through macOS (devtools/keypad.swift) in the running game and reports, per key, what
# the game's UI received and where the selected unit went. Restores the unit's moves before each key.
#
#   devtools/real-keys.sh
#
# Needs the game running with its UI debugger on port 9444, Tower Bench at ../../tools/tower-bench, and the keypad
# helper allowed to send key presses (see keypad.swift).
here=${0:A:h}
bench() { node "$here/../../../tools/tower-bench/tower-bench.mjs" "$@"; }
helper=${TMPDIR:-/tmp}/numpad-keypad
[[ $helper -nt $here/keypad.swift ]] || swiftc -O "$here/keypad.swift" -o "$helper" || exit 1
pid=$(pgrep -f "CivilizationVII.app/Contents/MacOS/CivilizationVII" | head -1)
[[ -n $pid ]] || { echo "game not running" >&2; exit 1; }

bench eval "window.__numpadKeys = []; if (!window.__numpadRecorder) { window.__numpadRecorder = true;
  window.addEventListener('keydown', (e) => window.__numpadKeys.push({ code: e.code, key: e.key, keyCode: e.keyCode, location: e.location }), true); } 'on'" > /dev/null

# label:mac key code
for pair in 6:88 4:86 9:92 1:83 7:89 3:85 8:91 8:91 2:84 2:84 row6:22; do
  label=${pair%%:*}; mac=${pair##*:}
  where=$(bench eval "(()=>{const u=Units.get(Players.get(GameContext.localPlayerID).Units.getUnitIds()[0]);return u.location.x+','+u.location.y})()" | tail -1 | tr -d '"')
  bench do moves --unit "$where" --yes > /dev/null 2>&1
  bench eval "(()=>{const id=Players.get(GameContext.localPlayerID).Units.getUnitIds()[0]; UI.Player.selectUnit(id);
    window.__numpadKeys = []; const u=Units.get(id); window.__numpadFrom={x:u.location.x,y:u.location.y}; 'ok'})()" > /dev/null
  "$helper" "$pid" "$mac" || exit 1
  bench eval "(()=>{const u=Units.get(Players.get(GameContext.localPlayerID).Units.getUnitIds()[0]);
    const f=window.__numpadFrom, t={x:u.location.x,y:u.location.y}, a=WorldUI.getPlotLocation(f), b=WorldUI.getPlotLocation(t);
    return JSON.stringify({key:'$label', received:window.__numpadKeys, from:f, to:t, screenDx:Math.round(b.x-a.x), screenDy:Math.round(b.y-a.y)})})()" | tail -1
done
