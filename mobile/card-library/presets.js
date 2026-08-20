(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.WavesDuelPresets = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const presets = Object.freeze({
    "rover-female-yangyang-chixia": Object.freeze({
      id: "rover-female-yangyang-chixia",
      name: "女漂泊者（预组）",
      heroIds: Object.freeze(["roverFemale", "yangyang", "chixia"]),
      roleCards: Object.freeze(["BP01-018", "SD01-002", "SD01-001", "BP01-024", "SD01-004", "SD01-003", "BP01-027", "SD01-006", "SD01-005"]),
      actions: Object.freeze([
        ["SD01-017", 2], ["SD01-019", 2], ["SD01-012", 2], ["SD01-014", 2], ["SD01-016", 2], ["SD01-010", 2], ["SD01-011", 2],
        ["SD01-018", 3], ["SD01-013", 3], ["SD01-020", 3], ["SD01-021", 3], ["SD01-015", 3],
        ["SD01-022", 2], ["SD01-023", 2], ["SD01-009", 2], ["SD01-007", 2], ["SD01-008", 3],
      ]),
    }),
    "rover-male-jinhsi-sanhua": Object.freeze({
      id: "rover-male-jinhsi-sanhua",
      name: "男漂泊者（预组）",
      heroIds: Object.freeze(["rover", "jinhsi", "sanhua"]),
      roleCards: Object.freeze(["BP01-021", "SD02-002", "SD02-001", "BP01-030", "SD02-006", "SD02-005", "BP01-033", "SD02-004", "SD02-003"]),
      actions: Object.freeze([
        ["SD02-017", 2], ["SD02-019", 2], ["SD02-012", 2], ["SD02-014", 2], ["SD02-015", 3], ["SD02-007", 2], ["SD02-009", 2], ["SD02-011", 2],
        ["SD02-018", 3], ["SD02-013", 3], ["SD02-008", 3], ["SD02-020", 3], ["SD02-021", 3],
        ["SD02-022", 2], ["SD02-023", 2], ["SD02-010", 2], ["SD02-016", 2],
      ]),
    }),
  });

  return Object.freeze({ schemaVersion: 1, presets });
});
