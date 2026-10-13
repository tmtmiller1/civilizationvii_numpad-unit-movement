// Sends number pad key presses to the game through macOS, the same events a physical number pad produces, for testing
// on a Mac keyboard that has none. Needs the app running it (the terminal or editor) allowed under System Settings >
// Privacy & Security > Accessibility; "--request" asks macOS for that.
//
//   swiftc -O devtools/keypad.swift -o /tmp/keypad
//   /tmp/keypad --request
//   /tmp/keypad <game pid> 89 91 92      (keypad 7, 8, 9)
//
// Mac virtual key codes: keypad 0-9 are 82 83 84 85 86 87 88 89 91 92; the number row 6 is 22.
import AppKit
import CoreGraphics
import Foundation

let args = Array(CommandLine.arguments.dropFirst())
if args.first == "--request" {
  print("allowed:", CGRequestPostEventAccess())
  exit(0)
}
guard CGPreflightPostEventAccess() else {
  print("not allowed to send key presses; run with --request, then allow it in System Settings")
  exit(2)
}
let pid = pid_t(args[0])!
NSRunningApplication(processIdentifier: pid)?.activate(options: [.activateAllWindows, .activateIgnoringOtherApps])
for _ in 0..<50 where NSWorkspace.shared.frontmostApplication?.processIdentifier != pid { usleep(100_000) }
for arg in args.dropFirst() {
  // Key presses go to whichever app is in front, so stop the moment the game is not.
  guard NSWorkspace.shared.frontmostApplication?.processIdentifier == pid else {
    print("stopped before key \(arg): the game is no longer the frontmost app")
    exit(3)
  }
  let code = CGKeyCode(arg)!
  let source = CGEventSource(stateID: .hidSystemState)
  let down = CGEvent(keyboardEventSource: source, virtualKey: code, keyDown: true)!
  let up = CGEvent(keyboardEventSource: source, virtualKey: code, keyDown: false)!
  if (65...92).contains(code) {
    down.flags.insert(.maskNumericPad)
    up.flags.insert(.maskNumericPad)
  }
  down.post(tap: .cghidEventTap)
  usleep(60_000)
  up.post(tap: .cghidEventTap)
  usleep(2_500_000)
}
