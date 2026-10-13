// Sends real mouse events to the game through macOS, for checking that the mod leaves the mouse alone. Needs the
// same Accessibility permission as keypad.swift.
//
//   swiftc -O devtools/mouse.swift -o /tmp/mouse
//   /tmp/mouse <game pid> bounds              prints the game window's screen rectangle: x y width height
//   /tmp/mouse <game pid> move <x> <y>        screen coordinates, origin top-left
//   /tmp/mouse <game pid> left <x> <y>        click
//   /tmp/mouse <game pid> right <x> <y>       click
import AppKit
import CoreGraphics
import Foundation

let args = Array(CommandLine.arguments.dropFirst())
let pid = pid_t(args[0])!
// A full-screen game lives on its own space, so bring it forward before looking for its window.
NSRunningApplication(processIdentifier: pid)?.activate(options: [.activateAllWindows, .activateIgnoringOtherApps])
for _ in 0..<50 where NSWorkspace.shared.frontmostApplication?.processIdentifier != pid { usleep(100_000) }
let list = CGWindowListCopyWindowInfo([.optionOnScreenOnly], kCGNullWindowID) as! [[String: Any]]
let mine = list.filter { ($0[kCGWindowOwnerPID as String] as? Int) == Int(pid) }
  .compactMap { $0[kCGWindowBounds as String] as? [String: CGFloat] }
guard let b = mine.max(by: { $0["Width"]! * $0["Height"]! < $1["Width"]! * $1["Height"]! }) else {
  print("no window for pid \(pid)"); exit(1)
}
if args[1] == "bounds" { print(Int(b["X"]!), Int(b["Y"]!), Int(b["Width"]!), Int(b["Height"]!)); exit(0) }
guard CGPreflightPostEventAccess() else { print("not allowed to send input; allow it in System Settings > Accessibility"); exit(2) }
guard NSWorkspace.shared.frontmostApplication?.processIdentifier == pid else { print("the game is not the frontmost app"); exit(3) }
let p = CGPoint(x: Double(args[2])!, y: Double(args[3])!)
func post(_ type: CGEventType, _ button: CGMouseButton, at point: CGPoint = p) {
  CGEvent(mouseEventSource: nil, mouseType: type, mouseCursorPosition: point, mouseButton: button)!.post(tap: .cghidEventTap)
  usleep(80_000)
}
// The game updates its plot cursor only on mouse motion, so step away and back before settling on the point.
post(.mouseMoved, .left, at: CGPoint(x: p.x + 60, y: p.y + 40))
usleep(200_000)
post(.mouseMoved, .left)
usleep(400_000)
switch args[1] {
case "left": post(.leftMouseDown, .left); post(.leftMouseUp, .left)
case "right": post(.rightMouseDown, .right); post(.rightMouseUp, .right)
default: break
}
