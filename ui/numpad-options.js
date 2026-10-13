// The mod's rows in Options > Mods: one key per direction. Loaded in the main menu and in a game; a change applies
// to the next key press. Cancel puts back what was there on opening.

import { CategoryType, OptionType, Options } from "/core/ui/options/model-options.js";
import { CategoryData } from "/core/ui/options/options-helpers.js";
import { DIRECTIONS, KEYS, getBindings, setBinding } from "/tmt-numpad-unit-movement/ui/numpad-settings.js";

function keyLabel(key) {
  const name = key.label.startsWith("LOC_") ? Locale.compose(key.label) : key.label;
  return key.gameKey ? Locale.compose("LOC_NUMPAD_MOVE_KEY_GAME", name) : name;
}

// The shared "Mods" category, created the same way Tower's other mods and the community's create it. This also runs
// in the main menu, where a throw would take the menu down, so any failure only leaves the rows out.
try {
  if (!CategoryType.Mods) CategoryType.Mods = "mods";
  if (!CategoryData[CategoryType.Mods]) {
    CategoryData[CategoryType.Mods] = {
      title: "LOC_UI_CONTENT_MGR_SUBTITLE",
      description: "LOC_UI_CONTENT_MGR_SUBTITLE_DESCRIPTION"
    };
  }
  Options.addInitCallback(() => {
    const dropdownItems = KEYS.map((key) => ({ label: keyLabel(key) }));
    for (const direction of DIRECTIONS) {
      const indexOfCode = (code) => Math.max(0, KEYS.findIndex((key) => key.code === code));
      Options.addOption({
        category: CategoryType.Mods,
        // becomes the header key LOC_OPTIONS_GROUP_NUMPAD_UNIT_MOVEMENT
        group: "numpad_unit_movement",
        type: OptionType.Dropdown,
        id: "numpad-unit-movement-" + direction.id,
        label: direction.label,
        description: "LOC_NUMPAD_MOVE_OPTION_DESCRIPTION",
        dropdownItems,
        initListener: (info) => {
          info.selectedItemIndex = indexOfCode(getBindings()[direction.id]);
          info.valueOnOpen = info.selectedItemIndex;
        },
        updateListener: (info, index) => {
          info.selectedItemIndex = index;
          setBinding(direction.id, KEYS[index]?.code ?? "");
        },
        restoreListener: (info) => setBinding(direction.id, KEYS[info.valueOnOpen]?.code ?? "")
      });
    }
  });
} catch (e) {
  console.error("[NumpadUnitMovement] Options rows not added: " + e);
}
