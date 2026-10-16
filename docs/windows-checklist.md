# Windows checklist

Everything in the README's test record was watched on a Mac. This is the short list to run on a Windows PC with a
number pad. Each step says what to do and what the Mac did; write down what Windows does where it's different.

Run it once with every other mod switched off, then once with your usual mods. Start any game, select a unit with
moves left, and stand it on open land.

## Num Lock on

1. Press keypad 1 to 4 and 6 to 9, one at a time. On the Mac the unit stepped one tile each way: 7 up-left, 8 up,
   9 up-right, 4 left, 6 right, 1 down-left, 2 down, 3 down-right.
2. Hold keypad 6 for two seconds. The unit should move one tile, not one per repeat.
3. Press 6 on the number row. The unit should stay where it is.
4. Hold keypad 5, press 4 three times and let go. The marker should walk three tiles left with the path drawn, and
   the unit sets off when you let go.
5. Do the same holding the left Ctrl, then the right Ctrl, pressing 9 twice. On the Mac the game calls either Ctrl
   plain "Control". If Windows names the side, the hold won't start, and that's worth writing down.
6. With a route queued, press keypad 0. The order should be cancelled, and the unit waits where it is.
7. In Options > Add-ons > Numpad Unit Movement, set "Move right" to E, then press Shift+E with a unit selected. The
   unit should stay where it is, since the mod leaves a key alone while Shift is held. If it moves, write it down:
   the mod didn't see Shift go down. Press E alone to check it still moves the unit, then set the row back to Numpad 6.

## Num Lock off

8. Press keypad 7, 8, 9, 4, 6, 1, 2 and 3. The README expects these to arrive as Home, the arrow keys, Page Up and so
   on, so the arrows pan the camera and the unit stays put. Write down which keys move the unit and which pan the
   camera. If every key still moves the unit, the game reports the keypad by position, and the Num Lock line in the
   README's Known limits can go.
9. Set "Move up-left" to Home and press keypad 7, Num Lock still off. The unit should step up-left. Set it back to
   Numpad 7 afterwards.

## Shift

10. Set "Plan a route: hold" to Shift, turn Num Lock on, hold Shift and press keypad 4 three times, then let go.
    With Shift held, Windows turns the keypad into Home, the arrows and so on, and the mod counts those as directions
    while a route is planned, so the marker should walk three tiles (the camera may pan as well). Windows can also
    send a Shift key-up just before each of those keys. If the unit sets off after the first press, that's the
    likely cause. Set the row back to Numpad 5 afterwards.
11. Zoom, Tilt, & Rotate: switch it on as well and hold Shift while pressing keypad 8, 2, 4 and 6. Windows sends the
    arrow keys for these, and Zoom, Tilt, & Rotate's default Shift plus an arrow tilts or turns the camera. Write
    down whether the camera tilts or turns, and whether the unit moves. Then set "Plan a route: hold" to Shift and
    try again: does the marker move, the camera, or both?

## Afterwards

12. Change one key, quit the game, start it again, and check the key you chose is still set.
13. Look in `%LOCALAPPDATA%\Firaxis Games\Sid Meier's Civilization VII\Logs\UI.log` for lines with
    `NumpadUnitMovement`, and for script errors around the time you pressed the keys.
