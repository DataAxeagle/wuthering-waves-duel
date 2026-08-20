await import("../../../mobile/card-library/catalog.js");
await import("../../../mobile/card-library/presets.js");
await import("../../../mobile/core.js");

type CoreRuntime = {
  DuelGame: new (options?: Record<string, unknown>) => any;
  RULESET_VERSION: string;
  validatePresetConstruction: (preset: Record<string, unknown>) => true;
};

export const gameCore = (globalThis as typeof globalThis & { WavesDuelCore: CoreRuntime }).WavesDuelCore;
if (!gameCore?.DuelGame) throw new Error("game_core_not_loaded");
