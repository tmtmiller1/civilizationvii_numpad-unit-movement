// The mod's rows in Options > Add-ons: one key per direction, then the two keys held to plan a route. Loaded in the
// main menu and in a game; a change applies to the next key press. Cancel puts back what was there on opening.

import { CategoryType, OptionType, Options } from "/core/ui/options/model-options.js";
import { CategoryData } from "/core/ui/options/options-helpers.js";
import { SETTINGS, forgetBindings, getBindings, setBinding } from "/tmt-numpad-unit-movement/ui/numpad-settings.js";

function keyLabel(key) {
  const name = key.label.startsWith("LOC_") ? Locale.compose(key.label) : key.label;
  return key.gameKey ? Locale.compose("LOC_NUMPAD_MOVE_KEY_GAME", name) : name;
}

function addRow(setting) {
  const keys = setting.keys;
  const indexOfCode = (code) => Math.max(0, keys.findIndex((key) => key.code === code));
  Options.addOption({
    category: CategoryType.Mods,
    // becomes the header key LOC_OPTIONS_GROUP_NUMPAD_UNIT_MOVEMENT
    group: "numpad_unit_movement",
    type: OptionType.Dropdown,
    id: "numpad-unit-movement-" + setting.id,
    label: setting.label,
    description: setting.label + "_DESCRIPTION",
    dropdownItems: keys.map((key) => ({ label: keyLabel(key) })),
    initListener: (info) => {
      // Each time Options opens, every row's initListener runs in order: the first row reads the store again, in
      // case something else wrote it, and the rest use what it read.
      if (setting === SETTINGS[0]) forgetBindings();
      info.selectedItemIndex = indexOfCode(getBindings()[setting.id]);
      info.valueOnOpen = info.selectedItemIndex;
    },
    updateListener: (info, index) => {
      info.selectedItemIndex = index;
      setBinding(setting.id, keys[index]?.code ?? "");
    },
    restoreListener: (info) => setBinding(setting.id, keys[info.valueOnOpen]?.code ?? "")
  });
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
    for (const setting of SETTINGS) addRow(setting);
  });
} catch (e) {
  console.error("[NumpadUnitMovement] Options rows not added: " + e);
}
