(function () {
  "use strict";

  const { DuelGame, TONES, HEROES } = window.WavesDuelCore;
  const CARD_LIBRARY = window.WavesDuelCardLibrary;
  const $ = (selector) => document.querySelector(selector);
  const elements = {
    aiModeBadge: $("#aiModeBadge"),
    menuButton: $("#menuButton"),
    animationLayer: $("#animationLayer"),
    upgradeGuide: $("#upgradeGuide"),
    upgradeGuideTitle: $("#upgradeGuideTitle"),
    upgradeGuideDetail: $("#upgradeGuideDetail"),
    upgradeGuideSummary: $("#upgradeGuideSummary"),
    confirmUpgrade: $("#confirmUpgradeButton"),
    cancelUpgrade: $("#cancelUpgradeButton"),
    arenaContestStage: $("#arenaContestStage"),
    turnNumber: $("#turnNumber"),
    turnOwner: $("#turnOwner"),
    aiZone: $("#aiZone"),
    playerZone: $("#playerZone"),
    aiDeck: $("#aiDeckReadout"),
    playerDeck: $("#playerDeckReadout"),
    hand: $("#hand"),
    handCount: $("#handCount"),
    logs: $("#logList"),
    logCardTooltip: $("#logCardTooltip"),
    selection: $("#selectionPreview"),
    resonanceBadge: $("#resonanceBadge"),
    charge: $("#chargeButton"),
    upgrade: $("#upgradeButton"),
    switch: $("#switchButton"),
    play: $("#playButton"),
    endTurn: $("#endTurnButton"),
    statusTitle: $("#statusTitle"),
    statusDetail: $("#statusDetail"),
    setupOverlay: $("#setupOverlay"),
    setupHeroes: $("#setupHeroes"),
    coinResult: $("#coinResult"),
    confirmSetup: $("#confirmSetupButton"),
    mulligan: $("#mulliganButton"),
    setupMulliganCards: $("#setupMulliganCards"),
    setupSelectionDetail: $("#setupSelectionDetail"),
    initiativeChoices: $("#initiativeChoices"),
    chooseFirst: $("#chooseFirstButton"),
    chooseSecond: $("#chooseSecondButton"),
    responseOverlay: $("#responseOverlay"),
    responseEyebrow: $("#responseEyebrow"),
    responseTitle: $("#responseTitle"),
    responseDetail: $("#responseDetail"),
    responseCards: $("#responseCards"),
    responseSelectionDetail: $("#responseSelectionDetail"),
    passDefense: $("#passDefenseButton"),
    confirmChoice: $("#confirmChoiceButton"),
    cancelChoice: $("#cancelChoiceButton"),
    actionSelectOverlay: $("#actionSelectOverlay"),
    actionSelectEyebrow: $("#actionSelectEyebrow"),
    actionSelectTitle: $("#actionSelectTitle"),
    actionSelectDetail: $("#actionSelectDetail"),
    actionSelectIntro: $("#actionSelectIntro"),
    actionSelectCards: $("#actionSelectCards"),
    actionSelectEffect: $("#actionSelectEffect"),
    actionSelectConfirm: $("#actionSelectConfirmButton"),
    actionSelectCancel: $("#actionSelectCancelButton"),
    rulesOverlay: $("#rulesOverlay"),
    gameOverOverlay: $("#gameOverOverlay"),
    gameOverTitle: $("#gameOverTitle"),
    gameOverDetail: $("#gameOverDetail"),
    resultGlyph: $("#resultGlyph"),
    mainMenuOverlay: $("#mainMenuOverlay"),
    pauseMenuOverlay: $("#pauseMenuOverlay"),
    resumeGame: $("#resumeGameButton"),
    pauseSave: $("#pauseSaveButton"),
    pauseRules: $("#pauseRulesButton"),
    pauseCodex: $("#pauseCodexButton"),
    returnHome: $("#returnHomeButton"),
    pauseExit: $("#pauseExitButton"),
    menuBackgroundVideo: $("#menuBackgroundVideo"),
    menuSoundToggle: $("#menuSoundToggle"),
    startGame: $("#startGameButton"),
    tutorialChoiceOverlay: $("#tutorialChoiceOverlay"),
    startTutorial: $("#startTutorialButton"),
    skipTutorial: $("#skipTutorialButton"),
    tutorialHint: $("#tutorialHint"),
    tutorialScrim: $("#tutorialScrim"),
    tutorialFocusFrame: $("#tutorialFocusFrame"),
    tutorialExplainOverlay: $("#tutorialExplainOverlay"),
    tutorialExplainTitle: $("#tutorialExplainTitle"),
    tutorialExplainRule: $("#tutorialExplainRule"),
    tutorialExplainNext: $("#tutorialExplainNext"),
    tutorialExplainConfirm: $("#tutorialExplainConfirmButton"),
    playerNameInput: $("#playerNameInput"),
    playerNameSettingsInput: $("#playerNameSettingsInput"),
    savePlayerName: $("#savePlayerNameButton"),
    returnToGame: $("#returnToGameButton"),
    saveGame: $("#saveGameButton"),
    loadGame: $("#loadGameButton"),
    deleteSave: $("#deleteSaveButton"),
    saveSlotInfo: $("#saveSlotInfo"),
    apiKeyInput: $("#apiKeyInput"),
    apiConfigStatus: $("#apiConfigStatus"),
    saveApi: $("#saveApiButton"),
    useLocalAi: $("#useLocalAiButton"),
    apiOnboardingOverlay: $("#apiOnboardingOverlay"),
    onboardingApiKeyInput: $("#onboardingApiKeyInput"),
    onboardingSaveApi: $("#onboardingSaveApiButton"),
    onboardingSkipApi: $("#onboardingSkipApiButton"),
    exitGame: $("#exitGameButton"),
    playerPreset: $("#playerPresetSelect"),
    aiPreset: $("#aiPresetSelect"),
    deckBuilderFilter: $("#deckBuilderFilter"),
    deckBuilderAttribute: $("#deckBuilderAttributeFilter"),
    deckBuilderLibrary: $("#deckBuilderLibrary"),
    deckBuilderRoles: $("#deckBuilderRoles"),
    deckBuilderActions: $("#deckBuilderActions"),
    deckBuilderSummary: $("#deckBuilderSummary"),
    deckBuilderPreview: $("#deckBuilderPreview"),
    customDeckName: $("#customDeckNameInput"),
    saveCustomDeck: $("#saveCustomDeckButton"),
    clearCustomDeck: $("#clearCustomDeckButton"),
    customDeckSavedList: $("#customDeckSavedList"),
    menuStats: $("#menuStats"),
    gameOverStats: $("#gameOverStats"),
    clearStats: $("#clearStatsButton"),
    testPlayerCard: $("#testPlayerCardSelect"),
    testAiCard: $("#testAiCardSelect"),
    testPlayerCategory: $("#testPlayerCategorySelect"),
    testPlayerAttribute: $("#testPlayerAttributeSelect"),
    testAiCategory: $("#testAiCategorySelect"),
    testLabPreview: $("#testLabPreview"),
    testLabHint: $("#testLabHint"),
    startTestLab: $("#startTestLabButton"),
    codexCategory: $("#codexCategorySelect"),
    codexAttribute: $("#codexAttributeSelect"),
    codexCard: $("#codexCardSelect"),
    codexCardVisual: $("#codexCardVisual"),
    codexCardInfo: $("#codexCardInfo"),
    duelCodexOverlay: $("#duelCodexOverlay"),
    duelCodexCategory: $("#duelCodexCategorySelect"),
    duelCodexCard: $("#duelCodexCardSelect"),
    duelCodexCardVisual: $("#duelCodexCardVisual"),
    duelCodexCardInfo: $("#duelCodexCardInfo"),
    closeDuelCodex: $("#closeDuelCodexButton"),
    roleDeckOverlay: $("#roleDeckOverlay"),
    roleDeckTitle: $("#roleDeckTitle"),
    roleDeckLead: $("#roleDeckLead"),
    roleDeckCards: $("#roleDeckCards"),
    roleDeckDetail: $("#roleDeckDetail"),
    closeRoleDeck: $("#closeRoleDeckButton"),
    backToMenu: $("#backToMenuButton"),
    toast: $("#toast"),
  };

  let game;
  let selectedCardUid = null;
  let responseSelectedCardUid = null;
  let selectedHeroIndex = null;
  // 角色卡是公开信息；记录归属方，保证可查看对方角色技能，但不能把对方选择误用于己方操作。
  let selectedHeroOwnerIndex = 0;
  let aiRunning = false;
  let uiLocked = false;
  let interactionMode = null;
  let upgradeHeroIndex = null;
  // 同名同等级角色牌可能有不同效果；记录玩家在升级分支弹窗中选定的具体角色卡。
  let upgradeRoleCardId = null;
  let setupMulliganUids = [];
  let setupSelectionPreview = { type: "hero", value: 0 };
  let upgradeDiscardUids = [];
  let aiThinkingLabel = "AI 行动中";
  let lastAnimatedDrawTurn = -1;
  let lastAnimatedTurnStartEffectsTurn = -1;
  let lastAnimatedTurnTransitionTurn = -1;
  let aiService = { configured: false, model: "", available: false };
  let matchLogId = "";
  let serverProfileReady = false;
  let serverProfileLoading = false;
  let serverProfileDirty = false;
  const AI_DECISION_TIMEOUT_MS = 10_000;
  const serviceClientId = `duel-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  let serviceHeartbeatTimer = null;
  let toastTimer = null;
  let utilityModalMode = null;
  let utilityModalResolver = null;
  let effectDiscardResolver = null;
  let pendingDiscardRecovery = null;
  let roleDeckViewer = { playerIndex: 0, cardId: null, pile: "role" };
  const STATS_KEY = "waves-duel-local-stats-v1";
  const SAVE_SLOTS_KEY = "waves-duel-local-save-slots-v1";
  const MAX_SAVE_SLOTS = 3;
  // 保留旧键，供已保存过对局的浏览器首次升级时迁移。
  const SAVE_KEY = "waves-duel-local-save-v1";
  let selectedSaveSlot = 0;
  const PLAYER_NAME_KEY = "waves-duel-player-name-v1";
  const CUSTOM_DECKS_KEY = "waves-duel-custom-decks-v1";
  let customDecks = loadCustomDecks();
  let customDeckDraft = { roleCards: [], actions: {} };
  let customDeckPreviewId = null;
  const DIFFICULTIES = {
    novice: { name: "初级", aiName: "无冠者", prompt: "只遵守基础规则；优先从可用牌中直接选择，不主动推测对方领队偏好或隐藏牌。" },
    standard: { name: "中级", aiName: "利维亚坦", prompt: "观察对方公开领队、费用、生命和三色克制，做基础预判；不需要穷举。" },
    expert: { name: "高级", aiName: "阿列夫一", prompt: "严格利用全部公开战场信息、费用、领队被动、克制、速度和追击机会，选择当前最优的合法动作；对隐藏牌只能依据公开领队做概率推断。" },
  };
  let aiDifficulty = "novice";
  let localStats = loadLocalStats();
  let matchRecorded = false;
  let isTestLab = false;
  let tutorial = { mode: "off", step: "charge", completed: null, layoutIndex: 0 };
  const TUTORIAL_STEPS = {
    charge: {
      title: "第一步：充能",
      instruction: "点击右侧“充能”，在弹窗中选择 1 张手牌并确认，把它正面放入左侧协奏区。",
      rule: "协奏区中的牌每张提供 1 点 COST。使用行动卡时，支付的协奏牌会进入弃牌区；每回合只能充能一次。",
      next: "下一步：升级角色。点击“确定”后，选择一名角色并弃置所需手牌。",
    },
    upgrade: {
      title: "第二步：升级角色",
      instruction: "点击右侧“升级”，选择任意未满级角色，再选择等于升级等级数量的手牌作为代价并确认。",
      rule: "升级卡会叠放在原角色上，已叠放的每个等级技能都会生效。每回合只能升级一次，且必须在进入战斗前完成。",
      next: "下一步：更换领队。点击“确定”后，先点选一名后台角色，再点击“更换领队”。",
    },
    switch: {
      title: "第三步：更换领队",
      instruction: "点击一名后台角色，使其出现蓝色选中光标；然后点击右侧“更换领队”。",
      rule: "领队决定哪些【领队技】与专属行动卡可用。每回合只能更换一次，而且进入战斗后不能再更换。",
      next: "下一步：进入战斗。点击“确定”后，选择一张满足 COST 的手牌，进入战斗并确认盖牌。",
    },
    battle: {
      title: "第四步：进入战斗",
      instruction: "点击“进入战斗”，选择一张满足费用的手牌，再点击确认。双方会同时翻牌并在结算后支付 COST。",
      rule: "红、蓝、绿三色互相克制；同色红牌或绿牌比较速度。获胜方按行动卡攻击力造成伤害，红色获胜还可继续连击。",
      next: "下一步：结束回合。点击“确定”后查看本次战斗结束回合的规则。",
    },
    pursuit: {
      title: "追击教学：继续连击或停止",
      instruction: "这次战斗触发了追击。可选择一张满足费用的红色卡后点击“继续红色连击”，也可点击“停止追击”。",
      rule: "红色行动卡获胜时可获得连击机会；追击期间只能打出满足费用的红色行动卡。停止追击后，仍需手动结束本回合。",
      next: "下一步：结束回合。停止追击后，点击“确定”继续学习回合收尾。",
    },
    end: {
      title: "第五步：结束回合",
      instruction: "战斗与所有效果结算后，右侧只保留“结束回合”。点击后行动区的牌进入弃牌区，并轮到对手抽牌行动。若红色行动卡获胜并触发追击，才可选择继续连击或停止追击。",
      rule: "普通战斗结算后，行动区的牌会进入弃牌区，再轮到对方抽牌并行动。此后你可以按自己的策略自由选择主要阶段行动。",
      next: "最后介绍战场界面。点击“确定”后查看费用、角色、手牌与卡牌详情的位置。",
    },
    layout: {
      title: "第六步：战场界面导览",
      instruction: "左下与左上是双方 COST 和协奏区；中央是角色区；下方是你的手牌；点击任意公开角色或手牌，可在右上查看完整效果。",
      rule: "协奏区的每张卡提供 1 点 COST，支付后进入弃牌区。中央三张角色卡中，带高亮的是领队。下方手牌仅你自己可见；对方角色卡是公开信息，点击后同样能查看其叠放等级与全部技能。",
      next: "界面导览完成。后续可自由行动，并随时点击公开角色或自己的手牌查看效果。",
    },
  };
  const TUTORIAL_LAYOUT_STEPS = [
    { selector: "#playerZone .resonance-bay", title: "协奏区", detail: "这里显示己方协奏牌。每张协奏牌提供 1 点 COST；支付费用时，使用的协奏牌会进入弃牌区。" },
    { selector: "#playerZone .role-deck-button", title: "角色牌库", detail: "点击可查看己方尚未展示的角色牌。角色牌库是己方私有信息，对手不能查看。" },
    { selector: "#playerDeckReadout", title: "牌库与弃牌区", detail: "这里显示己方行动牌库与弃牌数量；点击弃牌区可查看自己的弃牌。对手的牌库和弃牌内容不可查看。" },
    { selector: ".action-stack", title: "主要阶段区", detail: "这里执行充能、升级与更换领队。每项主要行动在同一回合通常只能执行一次。" },
    { selector: ".selection-card", title: "当前选择区", detail: "点击公开角色或自己的手牌后，会在这里查看完整卡面、费用、攻击和文字效果。" },
  ];

  function loadPlayerName() {
    try { return String(localStorage.getItem(PLAYER_NAME_KEY) || "").trim().slice(0, 16); } catch { return ""; }
  }
  let playerName = loadPlayerName();

  function normalizeCustomDecks(saved) {
    if (!Array.isArray(saved)) return [];
    return saved
      .filter((deck) => deck && typeof deck.id === "string" && typeof deck.name === "string" && deck.actions && typeof deck.actions === "object")
      .map((deck) => {
        const legacyHeroIds = Array.isArray(deck.heroIds) ? deck.heroIds : [];
        const roleCards = Array.isArray(deck.roleCards) ? [...new Set(deck.roleCards)] : customDeckRoles(legacyHeroIds);
        return { ...deck, roleCards, heroIds: customDeckHeroIds({ roleCards }), actions: Object.assign({}, deck.actions) };
      });
  }

  function loadCustomDecks() {
    try { return normalizeCustomDecks(JSON.parse(localStorage.getItem(CUSTOM_DECKS_KEY) || "[]")); } catch { return []; }
  }

  function persistCustomDecks() {
    try { localStorage.setItem(CUSTOM_DECKS_KEY, JSON.stringify(customDecks)); } catch { toast("本地存储不可用，无法保存自组牌组"); }
    syncPlayerProfileToServer();
  }

  function customDeckActionCount(draft) { return Object.values(draft.actions || {}).reduce((total, count) => total + (Number(count) || 0), 0); }
  function customDeckRoleCount(draft) { return Array.isArray(draft?.roleCards) ? draft.roleCards.length : 0; }
  function customDeckRoles(heroIds) {
    return (heroIds || []).flatMap((heroId) => (CARD_LIBRARY?.cards || []).filter((card) => card.type === "character" && card.hero === heroId).sort((a, b) => (a.level ?? 0) - (b.level ?? 0)).map((card) => card.id));
  }
  function customDeckRoleTemplates(draft) { return (draft?.roleCards || []).map((id) => (CARD_LIBRARY?.cards || []).find((card) => card.id === id)).filter(Boolean); }
  function customDeckHeroIds(draft) { return Array.from(new Set(customDeckRoleTemplates(draft).map((card) => card.hero).filter(Boolean))); }
  function actionCardAllowedForHeroes(card, heroIds) { const boundHero = card?.boundHero || card?.hero; return Boolean(card?.type === "action" && (!boundHero || heroIds.includes(boundHero)) && (!card.leaderOnly || heroIds.includes(card.leaderOnly))); }
  function validateCustomDeck(draft) {
    const rawRoleCards = Array.isArray(draft?.roleCards) ? draft.roleCards : [];
    const roleCards = [...new Set(rawRoleCards)];
    const roleTemplates = roleCards.map((id) => (CARD_LIBRARY?.cards || []).find((card) => card.id === id));
    const heroIds = Array.from(new Set(roleTemplates.filter(Boolean).map((card) => card.hero)));
    const validRoles = rawRoleCards.length >= 3 && rawRoleCards.length <= 15 && rawRoleCards.length === roleCards.length && roleTemplates.every((card) => card?.type === "character") && heroIds.length === 3 && heroIds.every((heroId) => roleTemplates.some((card) => card.hero === heroId && card.level === 0));
    const actionIds = Object.keys(draft?.actions || {});
    const actionCount = customDeckActionCount(draft);
    const invalidAction = actionIds.map((id) => (CARD_LIBRARY?.cards || []).find((card) => card.id === id)).find((card) => !actionCardAllowedForHeroes(card, heroIds));
    const validActions = actionCount === 40 && actionIds.every((id) => { const card = (CARD_LIBRARY?.cards || []).find((item) => item.id === id); return actionCardAllowedForHeroes(card, heroIds) && draft.actions[id] >= 1 && draft.actions[id] <= 3; });
    return { ok: validRoles && validActions, heroIds, roleCards, roleCount: rawRoleCards.length, actionCount, reason: !validRoles ? `角色牌需为 3–15 张、恰好 3 种角色，且每种至少有 1 张 Lv.0（当前 ${rawRoleCards.length} 张）` : invalidAction ? `「${invalidAction.name}」是未入选角色的专属行动卡，不能加入` : !validActions ? `行动牌需恰好 40 张，且每种最多 3 张（当前 ${actionCount} 张）` : "" };
  }
  function deckPresetFromSaved(deck) {
    const checked = validateCustomDeck(deck);
    if (!checked.ok) return null;
    return { id: `custom:${deck.id}`, name: deck.name, heroIds: checked.heroIds, roleCards: checked.roleCards, actions: Object.entries(deck.actions).map(([id, count]) => [id, Number(count)]) };
  }
  function selectedCustomDeck() {
    const value = elements.playerPreset?.value || "";
    if (!value.startsWith("custom:")) return null;
    return deckPresetFromSaved(customDecks.find((deck) => `custom:${deck.id}` === value));
  }

  function refreshPlayerPresetOptions() {
    if (!elements.playerPreset) return;
    const previous = elements.playerPreset.value;
    const defaults = [
      ["rover-female-yangyang-chixia", "女漂泊者（预组）"],
      ["rover-male-jinhsi-sanhua", "男漂泊者（预组）"],
    ];
    const customOptions = customDecks.map((deck) => [`custom:${deck.id}`, `自组 · ${deck.name}`]);
    elements.playerPreset.innerHTML = [...defaults, ...customOptions].map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join("");
    elements.playerPreset.value = [...defaults, ...customOptions].some(([value]) => value === previous) ? previous : defaults[0][0];
  }

  function syncPlayerNameInputs() {
    if (elements.playerNameInput) elements.playerNameInput.value = playerName;
    if (elements.playerNameSettingsInput) elements.playerNameSettingsInput.value = playerName;
  }

  function savePlayerName(value) {
    const nextName = String(value || "").trim().replace(/\s+/g, " ").slice(0, 16);
    if (!nextName) return toast("请先填写玩家名称");
    playerName = nextName;
    try { localStorage.setItem(PLAYER_NAME_KEY, playerName); } catch { /* 本地存储不可用时仅保留当前会话 */ }
    const hasActiveMatch = Boolean(game?.players?.[0]);
    if (hasActiveMatch) game.players[0].name = playerName;
    syncPlayerNameInputs();
    // 主菜单尚未创建对局，此时不能刷新依赖 game 的战场界面。
    if (hasActiveMatch) render();
    syncPlayerProfileToServer();
    toast("玩家名称已保存");
    return true;
  }

  function tutorialIsActive() {
    return tutorial.mode === "active";
  }

  function tutorialAllows(step) {
    return tutorial.mode === "off" || (tutorialIsActive() && tutorial.step === step);
  }

  function maybeActivateTutorial() {
    if (tutorial.mode !== "armed" || !game || game.setupPhase || game.activePlayer !== 0 || game.phase !== "main") return;
    tutorial.mode = "active";
    tutorial.step = "charge";
    tutorial.completed = null;
    toast("新手指引开始：请先完成充能。");
  }

  function completeTutorialStep(step) {
    if (!tutorialIsActive() || tutorial.step !== step) return;
    tutorial.mode = "explain";
    tutorial.completed = step;
    selectedCardUid = null;
    if (step === "upgrade") { selectedHeroOwnerIndex = 0; selectedHeroIndex = game.players[0].activeHero; }
    if (step === "switch") { selectedHeroOwnerIndex = 0; selectedHeroIndex = null; }
  }

  function continueTutorial() {
    if (tutorial.mode === "layout") {
      tutorial.layoutIndex += 1;
      if (tutorial.layoutIndex >= TUTORIAL_LAYOUT_STEPS.length) {
        tutorial = { mode: "off", step: "charge", completed: null, layoutIndex: 0 };
        toast("新手引导完成，后续对局可自由行动。");
      }
      render();
      return;
    }
    if (tutorial.mode !== "explain") return;
    const completed = tutorial.completed;
    const steps = ["charge", "upgrade", "switch", "battle", "pursuit"];
    // 只有真的获得我方追击权，才插入追击教学；否则直接教学手动收尾。
    if (completed === "battle") {
      if (game.phase === "pursuit" && game.pursuit?.playerIndex === 0) {
        tutorial.mode = "active";
        tutorial.completed = null;
        tutorial.step = "pursuit";
      } else {
        tutorial.mode = "layout";
        tutorial.completed = null;
        tutorial.layoutIndex = 0;
      }
      render();
      return;
    }
    if (completed === "pursuit" || completed === "end") {
      tutorial.mode = "layout";
      tutorial.completed = null;
      tutorial.layoutIndex = 0;
      render();
      return;
    }
    const next = steps[steps.indexOf(completed) + 1];
    tutorial.completed = null;
    if (next) {
      tutorial.mode = "active";
      tutorial.step = next;
      toast(`新手指引：${TUTORIAL_STEPS[next].title}`);
    } else {
      tutorial = { mode: "off", step: "charge", completed: null, layoutIndex: 0 };
      toast("新手指引完成，后续对局可自由行动。");
    }
    render();
    if (aiMayAct()) runAiTurn();
  }

  function renderTutorial() {
    const layoutWalkthrough = tutorial.mode === "layout";
    const pursuitPreview = tutorial.mode === "explain" && tutorial.completed === "battle" && game?.phase === "pursuit" && game.pursuit?.playerIndex === 0;
    // 导览沿用上一操作步骤的状态名；渲染时必须显式切到 layout，才能取到当前导览区域。
    const tutorialRenderStep = layoutWalkthrough ? "layout" : pursuitPreview ? "pursuit" : tutorial.step;
    const activeStep = (tutorialIsActive() || layoutWalkthrough || pursuitPreview) ? TUTORIAL_STEPS[tutorialRenderStep] : null;
    document.querySelectorAll(".tutorial-target, .tutorial-focus-layer").forEach((element) => {
      element.classList.remove("tutorial-target", "tutorial-focus-layer");
    });
    const arenaCore = document.querySelector(".arena-core");
    const upgradeCost = interactionMode === "upgrade-card" && upgradeHeroIndex != null
      ? selectedUpgradeCandidate(0, upgradeHeroIndex)?.level || 0
      : 0;
    // 每次只高亮当前真正要操作的一个区域：按钮 → 选牌/选角色 → 中央确认框。
    // 不能把同一流程的所有区域一次性点亮，否则玩家不知道下一步该点哪里。
    const targets = {
      charge: interactionMode === "charge-select"
        ? (selectedCardUid ? [elements.actionSelectConfirm] : [elements.actionSelectIntro])
        : [elements.charge],
      upgrade: interactionMode === "upgrade-hero"
        ? (upgradeHeroIndex == null ? [elements.actionSelectIntro] : [elements.actionSelectConfirm])
        : interactionMode === "upgrade-branch"
          ? [elements.actionSelectConfirm]
        : interactionMode === "upgrade-card"
          ? (upgradeDiscardUids.length === upgradeCost ? [elements.actionSelectConfirm] : [elements.actionSelectIntro])
          : [elements.upgrade],
      switch: interactionMode === "switch-select"
        ? (selectedHeroIndex != null ? [elements.actionSelectConfirm] : [elements.actionSelectIntro])
        : [elements.switch],
      battle: interactionMode === "battle-select"
        ? (selectedCardUid ? [elements.actionSelectConfirm] : [elements.actionSelectIntro])
        : [elements.play],
      pursuit: interactionMode === "pursuit-select"
        ? (selectedCardUid ? [elements.actionSelectConfirm] : [elements.actionSelectIntro])
        : [elements.play, elements.endTurn],
      end: [elements.endTurn],
      layout: [layoutWalkthrough ? document.querySelector(TUTORIAL_LAYOUT_STEPS[tutorial.layoutIndex]?.selector || "") : null],
    };
    const activeTargets = (activeStep ? targets[tutorialRenderStep] || [] : []).filter(Boolean);
    activeTargets.forEach((element) => {
      element.classList.add("tutorial-target");
      // 牌库、手牌等区域的父容器本身建立了叠放层级；只抬高子元素会让遮罩
      // 仍压在内容上。因此同时抬高该容器，保证蓝框内的全部内容保持正常亮度。
      const focusLayer = element === elements.hand
        ? element.closest(".hand-dock")
        : (element === elements.playerDeck || element === elements.aiDeck)
          ? element.closest(".arena-core")
          : element.closest(".player-zone") || element;
      focusLayer?.classList.add("tutorial-focus-layer");
    });
    // 蓝框直接绘制在真实目标元素上，避免独立定位层受窗口缩放/DPI 影响而错位。
    elements.tutorialFocusFrame.classList.add("hidden");
    elements.tutorialScrim.classList.toggle("hidden", !activeStep);
    elements.tutorialHint.classList.toggle("hidden", !activeStep || layoutWalkthrough);
    let instruction = activeStep?.instruction || "";
    if (tutorial.step === "charge" && interactionMode === "charge-select") instruction = selectedCardUid ? "已选手牌：请点击“确认充能”。" : "请在弹窗中选择 1 张手牌。";
    if (tutorial.step === "upgrade" && interactionMode === "upgrade-hero") instruction = "请在弹窗中选择一名未满级的己方角色。";
    if (tutorial.step === "upgrade" && interactionMode === "upgrade-branch") instruction = "请选择本次要叠放的角色牌分支。";
    if (tutorial.step === "upgrade" && interactionMode === "upgrade-card") instruction = upgradeDiscardUids.length === upgradeCost ? "弃牌代价已选好：请点击弹窗下方“确认升级”。" : `请于弹窗中选择 ${upgradeCost} 张手牌作为升级代价。`;
    if (tutorial.step === "battle" && interactionMode === "battle-select") instruction = selectedCardUid ? "已选行动卡：请点击弹窗下方“确认进入战斗”。" : "请于弹窗中选择 1 张满足费用的行动卡。";
    if (tutorial.step === "switch" && interactionMode === "switch-select") instruction = selectedHeroIndex != null ? "已选新领队：请点击弹窗下方“确认更换领队”。" : "请在弹窗中选择一名后台角色。";
    if (tutorial.step === "pursuit" && interactionMode === "pursuit-select") instruction = selectedCardUid ? "已选红色追击牌：请点击弹窗下方“确认追击”。" : "请在弹窗中选择一张可用的红色追击牌，也可以取消追击。";
    elements.tutorialHint.innerHTML = activeStep ? `<b>${escapeHtml(activeStep.title)}</b><span>　${escapeHtml(instruction)}</span>` : "";
    const explaining = (tutorial.mode === "explain" && TUTORIAL_STEPS[tutorial.completed]) || layoutWalkthrough;
    elements.tutorialExplainOverlay.classList.toggle("hidden", !explaining);
    if (!explaining) return;
    if (layoutWalkthrough) {
      const entry = TUTORIAL_LAYOUT_STEPS[tutorial.layoutIndex];
      elements.tutorialExplainTitle.textContent = `场地导览 ${tutorial.layoutIndex + 1}/${TUTORIAL_LAYOUT_STEPS.length}：${entry.title}`;
      elements.tutorialExplainRule.textContent = entry.detail;
      elements.tutorialExplainNext.textContent = tutorial.layoutIndex + 1 < TUTORIAL_LAYOUT_STEPS.length ? "点击“下一步”查看下一个区域。" : "点击“完成导览”回到自由对局。";
      elements.tutorialExplainConfirm.textContent = tutorial.layoutIndex + 1 < TUTORIAL_LAYOUT_STEPS.length ? "下一步" : "完成导览";
      return;
    }
    const step = TUTORIAL_STEPS[tutorial.completed];
    elements.tutorialExplainTitle.textContent = `${step.title}：规则说明`;
    elements.tutorialExplainRule.textContent = step.rule;
    elements.tutorialExplainNext.textContent = step.next;
    elements.tutorialExplainConfirm.textContent = tutorial.completed === "layout" ? "确定，开始自由对局" : "确定，进行下一步";
  }

  function loadLocalStats() {
    const empty = { games: 0, wins: 0, damageDealt: 0, damageReceived: 0, healingReceived: 0, cardsPlayed: 0 };
    try {
      const saved = JSON.parse(localStorage.getItem(STATS_KEY) || "null");
      if (!saved || typeof saved !== "object") return empty;
      Object.keys(empty).forEach((key) => { if (Number.isFinite(saved[key])) empty[key] = saved[key]; });
      return empty;
    } catch { return empty; }
  }

  function persistStats() {
    try { localStorage.setItem(STATS_KEY, JSON.stringify(localStats)); } catch { /* 本地存储不可用时仍可继续对局 */ }
    syncPlayerProfileToServer();
  }

  function statsHtml(stats) {
    const rate = stats.games ? `${Math.round(stats.wins / stats.games * 100)}%` : "0%";
    const healingReceived = Number(stats.healingReceived) || 0;
    const netHpLoss = Math.max(0, (Number(stats.damageReceived) || 0) - healingReceived);
    return [
      [stats.games, "总对局"], [stats.wins, "胜场"], [rate, "胜率"],
      [stats.damageDealt, "造成伤害"], [stats.damageReceived, "累计受到伤害"], [healingReceived, "恢复生命"], [netHpLoss, "净生命损失"], [stats.cardsPlayed, "打出卡牌"],
    ].map(([value, label]) => `<div class="stat-item"><b>${escapeHtml(value)}</b><small>${label}</small></div>`).join("");
  }

  function isValidSavedGame(saved) {
    return Boolean(saved && saved.version === 1 && saved.snapshot);
  }

  function normalizeSaveSlots(rawSlots) {
    const source = Array.isArray(rawSlots) ? rawSlots : [];
    return Array.from({ length: MAX_SAVE_SLOTS }, (_, index) => isValidSavedGame(source[index]) ? source[index] : null);
  }

  function persistSaveSlots(slots) {
    localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(normalizeSaveSlots(slots)));
  }

  function loadSaveSlots() {
    try {
      const storedSlots = localStorage.getItem(SAVE_SLOTS_KEY);
      if (storedSlots !== null) return normalizeSaveSlots(JSON.parse(storedSlots));

      // v1 仅有一个存档。迁移后保留旧键，避免升级过程中发生意外时丢失原存档。
      const legacy = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      const slots = normalizeSaveSlots([legacy]);
      if (isValidSavedGame(legacy)) persistSaveSlots(slots);
      return slots;
    } catch { return normalizeSaveSlots([]); }
  }

  function firstSavedSlotIndex(slots) {
    return slots.findIndex(Boolean);
  }

  function selectedSavedGame(slots = loadSaveSlots()) {
    if (!slots[selectedSaveSlot]) {
      const firstSaved = firstSavedSlotIndex(slots);
      selectedSaveSlot = firstSaved >= 0 ? firstSaved : 0;
    }
    return slots[selectedSaveSlot] || null;
  }

  // 对外资料协议仍沿用 savedGame 字段，只同步当前选中的存档，兼容已发布的本地服务端。
  function loadSavedGame() {
    return selectedSavedGame();
  }

  function playerProfilePayload() {
    return { version: 1, playerName, stats: localStats, savedGame: loadSavedGame(), customDecks: normalizeCustomDecks(customDecks) };
  }

  function applyServerPlayerProfile(profile) {
    if (!profile || typeof profile !== "object") return;
    const serverName = String(profile.playerName || "").trim().replace(/\s+/g, " ").slice(0, 16);
    if (serverName) {
      playerName = serverName;
      try { localStorage.setItem(PLAYER_NAME_KEY, playerName); } catch { /* 保留当前会话 */ }
    }
    const savedStats = profile.stats;
    if (savedStats && typeof savedStats === "object") {
      const next = { games: 0, wins: 0, damageDealt: 0, damageReceived: 0, healingReceived: 0, cardsPlayed: 0 };
      Object.keys(next).forEach((key) => { if (Number.isFinite(savedStats[key])) next[key] = savedStats[key]; });
      localStats = next;
      try { localStorage.setItem(STATS_KEY, JSON.stringify(localStats)); } catch { /* 保留当前会话 */ }
    }
    const savedGame = profile.savedGame;
    if (isValidSavedGame(savedGame)) {
      try {
        const slots = loadSaveSlots();
        const matchingSlot = slots.findIndex((slot) => slot && slot.savedAt === savedGame.savedAt && slot.matchLogId === savedGame.matchLogId);
        const targetSlot = matchingSlot >= 0 ? matchingSlot : (slots.findIndex((slot) => !slot) >= 0 ? slots.findIndex((slot) => !slot) : selectedSaveSlot);
        slots[targetSlot] = savedGame;
        selectedSaveSlot = targetSlot;
        persistSaveSlots(slots);
      } catch { /* 保留当前会话 */ }
    }
    // 旧版本资料没有 customDecks 字段时，保留当前浏览器中的卡组，首次新版启动后会自动补写到 Windows 用户资料。
    if (Array.isArray(profile.customDecks)) {
      customDecks = normalizeCustomDecks(profile.customDecks);
      try { localStorage.setItem(CUSTOM_DECKS_KEY, JSON.stringify(customDecks)); } catch { /* 保留当前会话 */ }
      refreshPlayerPresetOptions();
    }
    syncPlayerNameInputs();
  }

  async function loadServerProfile() {
    if (serverProfileReady || serverProfileLoading || aiService.storage !== "server" || !aiService.available) return;
    serverProfileLoading = true;
    try {
      const response = await fetch("/api/player-data", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error("profile_load_failed");
      if (!serverProfileDirty) applyServerPlayerProfile(payload.profile);
      serverProfileReady = true;
      syncPlayerProfileToServer();
    } catch {
      // 用户资料接口异常不影响对局和 AI 决策，仍保留浏览器当前数据。
    } finally {
      serverProfileLoading = false;
    }
  }

  function syncPlayerProfileToServer() {
    if (aiService.storage !== "server" || !aiService.available) return;
    if (!serverProfileReady) { serverProfileDirty = true; return; }
    serverProfileDirty = false;
    fetch("/api/player-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: playerProfilePayload() }),
    }).catch(() => { /* 离线/服务停止时保留浏览器副本 */ });
  }

  function createMatchLogId() {
    const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
    return `duel-${stamp}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function recordAiDecision(entry) {
    if (aiService.storage !== "server" || !matchLogId) return;
    fetch("/api/ai-decision-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: matchLogId, difficulty: aiDifficulty, ...entry }),
    }).catch(() => { /* 决策日志失败不能阻塞对局 */ });
  }

  function renderSaveSlot() {
    const slots = loadSaveSlots();
    const saved = selectedSavedGame(slots);
    const savedCount = slots.filter(Boolean).length;
    elements.saveSlotInfo.innerHTML = slots.map((slot, index) => {
      if (!slot) return `<button class="save-slot-entry empty" type="button" disabled>存档位 ${index + 1}<span>空位</span></button>`;
      const date = new Date(slot.savedAt);
      const time = Number.isNaN(date.getTime()) ? "未知时间" : date.toLocaleString("zh-CN", { hour12: false });
      const turn = slot.snapshot.turn || 0;
      const phase = slot.snapshot.phase === "pursuit" ? "追击中" : "行动阶段";
      return `<button class="save-slot-entry${index === selectedSaveSlot ? " selected" : ""}" type="button" data-save-slot-index="${index}"><b>存档位 ${index + 1}</b><span>第 ${turn} 回合 · ${escapeHtml(time)} · ${phase}</span></button>`;
    }).join("");
    elements.saveSlotInfo.classList.toggle("empty-hand", savedCount === 0);
    elements.loadGame.disabled = !saved;
    elements.deleteSave.disabled = !saved;
  }

  function saveCurrentGame() {
    if (!game || uiLocked || game.pending || game.pendingChoice || game.pendingPayment) return toast("请在没有待响应或待选择效果时保存对局");
    try {
      const slots = loadSaveSlots();
      let slotIndex = slots.findIndex((slot) => !slot);
      if (slotIndex < 0) {
        const choices = slots.map((slot, index) => {
          const turn = slot?.snapshot?.turn || 0;
          const date = new Date(slot?.savedAt);
          const time = Number.isNaN(date.getTime()) ? "未知时间" : date.toLocaleString("zh-CN", { hour12: false });
          return `${index + 1}. 第 ${turn} 回合 · ${time}`;
        }).join("\n");
        const answer = window.prompt(`三个存档位均已使用。请输入要覆盖的存档位编号（1–${MAX_SAVE_SLOTS}）：\n${choices}`, String(selectedSaveSlot + 1));
        if (answer === null) return toast("已取消保存");
        slotIndex = Number(answer) - 1;
        if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex >= MAX_SAVE_SLOTS) return toast("请输入 1 到 3 之间的存档位编号");
      }
      slots[slotIndex] = { version: 1, savedAt: new Date().toISOString(), aiDifficulty, matchLogId, snapshot: game.snapshot() };
      selectedSaveSlot = slotIndex;
      persistSaveSlots(slots);
      syncPlayerProfileToServer();
      renderSaveSlot(); toast(`对局已保存至存档位 ${slotIndex + 1}，可在主菜单的“加载游戏”继续`);
    } catch { toast("保存失败：浏览器本地存储不可用"); }
  }

  function restoreSavedGame() {
    const saved = loadSavedGame();
    if (!saved) return toast("没有可加载的存档");
    const restored = new DuelGame({ seed: Date.now() });
    const result = restored.loadSnapshot(saved.snapshot);
    if (!result.ok) return toast(result.reason);
    game = restored; isTestLab = false; matchLogId = saved.matchLogId || createMatchLogId(); if (playerName) game.players[0].name = playerName; aiDifficulty = DIFFICULTIES[saved.aiDifficulty] ? saved.aiDifficulty : "novice"; applyAiIdentity();
    selectedCardUid = null; selectedHeroOwnerIndex = 0; selectedHeroIndex = game.players[0]?.activeHero || 0; aiRunning = false; uiLocked = false; interactionMode = null; upgradeHeroIndex = null; upgradeRoleCardId = null; setupMulliganUids = []; upgradeDiscardUids = []; matchRecorded = false; lastAnimatedDrawTurn = game.lastTurnDraw?.turn || -1; lastAnimatedTurnStartEffectsTurn = -1; tutorial = { mode: "off", step: "charge", completed: null };
    elements.mainMenuOverlay.classList.add("hidden"); elements.gameOverOverlay.classList.add("hidden"); elements.responseOverlay.classList.add("hidden"); elements.setupOverlay.classList.toggle("hidden", !game.setupPhase);
    render(); checkAiService().then(render); toast("已加载保存的对局");
    if (!game.setupPhase && aiMayAct()) setTimeout(runAiTurn, 500);
  }

  function deleteSavedGame() {
    const slots = loadSaveSlots();
    if (!slots[selectedSaveSlot]) return toast("没有可删除的存档");
    const deletedSlot = selectedSaveSlot;
    slots[selectedSaveSlot] = null;
    selectedSaveSlot = firstSavedSlotIndex(slots);
    if (selectedSaveSlot < 0) selectedSaveSlot = 0;
    try {
      persistSaveSlots(slots);
      syncPlayerProfileToServer(); renderSaveSlot(); toast(`已删除存档位 ${deletedSlot + 1}`);
    } catch { toast("删除失败：浏览器本地存储不可用"); }
  }

  function cardMatchesType(card, type) {
    if (type === "all") return true;
    if (type === "character") return card.type === "character";
    return card.type === "action" && card.tone === type;
  }

  function testActionCards(type = "all") {
    return (CARD_LIBRARY?.cards || []).filter((card) => card.type === "action" && (type === "all" || card.tone === type)).slice().sort((a, b) => {
      return `${a.category || ""}-${a.name}`.localeCompare(`${b.category || ""}-${b.name}`, "zh-CN");
    });
  }

  function populateTestLabOptions() {
    const selectedPlayer = elements.testPlayerCard.value;
    const selectedAi = elements.testAiCard.value;
    populateAttributeFilter(elements.testPlayerAttribute); populateAttributeFilter(elements.testAiAttribute);
    const playerCards = testActionCards(elements.testPlayerCategory.value || "all").filter((card) => cardHasAttribute(card, elements.testPlayerAttribute?.value || "all"));
    const aiCards = testActionCards(elements.testAiCategory.value || "all").filter((card) => cardHasAttribute(card, elements.testAiAttribute?.value || "all"));
    const options = (cards) => cards.map((card) => {
      const numbers = card.kind === "dodge" ? `伤害 ${card.attack || 0}` : `速 ${card.speed || 0} / 攻 ${card.attack || 0}`;
      const leader = card.leaderOnly ? ` · 领队：${card.leaderOnly}` : "";
      const bound = card.boundHero ? ` · 绑定：${HEROES[card.boundHero]?.name || card.boundHero}` : " · 通用";
      return `<option value="${escapeHtml(card.id)}">${escapeHtml(card.category || "行动牌")}｜${escapeHtml(card.name)}｜COST ${card.cost || 0}｜${numbers}${bound}${leader}</option>`;
    }).join("") || '<option value="">该类型没有可测试的行动卡</option>';
    elements.testPlayerCard.innerHTML = options(playerCards);
    elements.testAiCard.innerHTML = options(aiCards);
    const defaultPlayer = playerCards.find((card) => card.id === "SD01-010") || playerCards[0];
    const defaultAi = aiCards.find((card) => card.id === "SD02-010") || aiCards[0];
    elements.testPlayerCard.value = playerCards.some((card) => card.id === selectedPlayer) ? selectedPlayer : defaultPlayer?.id || "";
    elements.testAiCard.value = aiCards.some((card) => card.id === selectedAi) ? selectedAi : defaultAi?.id || "";
    updateTestLabHint();
  }

  function updateTestLabHint() {
    const cards = testActionCards();
    const mine = cards.find((card) => card.id === elements.testPlayerCard.value);
    const theirs = cards.find((card) => card.id === elements.testAiCard.value);
    if (!mine || !theirs) { elements.testLabPreview.innerHTML = "<p>请为双方选择可测试的红、绿或蓝色行动卡。</p>"; elements.testLabHint.textContent = "角色牌不属于行动卡，不能作为对抗测试牌。"; return; }
    const preview = (card, owner) => {
      const metrics = card.kind === "dodge" ? `伤害 ${card.attack || 0}` : `速度 ${card.speed || 0} · 攻击 ${card.attack || 0}`;
      const art = actionArtPath(card.id);
      return `<article class="test-card-preview" style="--tone-color:${toneStyle(card.tone)}">
        <p>${escapeHtml(owner)}</p>
        <div class="test-card-art">${art ? `<img src="${escapeHtml(art)}" alt="${escapeHtml(card.name)}">` : "◇"}</div>
        <b>${escapeHtml(card.name)}</b><small>COST ${card.cost || 0} · ${escapeHtml(metrics)} · ${escapeHtml(cardAttributeText(card))}</small>
        <span>${escapeHtml(card.text || "无额外文字效果")}</span>
      </article>`;
    };
    elements.testLabPreview.innerHTML = `${preview(mine, "我方测试卡")}<strong>VS</strong>${preview(theirs, "AI 测试卡")}`;
    elements.testLabHint.textContent = `我方「${mine.name}」对 AI「${theirs.name}」。双方各持 3 张所选卡、8 点协奏费用；专属卡会自动匹配对应领队。进入后仍按正常游戏流程触发卡牌效果。`;
  }

  function testPresetForCard(card, fallback) {
    const boundHero = card?.leaderOnly || card?.boundHero || card?.hero;
    return ["rover", "jinhsi", "sanhua"].includes(boundHero) ? "rover-male-jinhsi-sanhua"
      : ["roverFemale", "yangyang", "chixia"].includes(boundHero) ? "rover-female-yangyang-chixia"
        : fallback;
  }

  function setTestLeader(playerIndex, card) {
    if (!card?.leaderOnly) return;
    const index = game.players[playerIndex].heroes.findIndex((hero) => hero.id === card.leaderOnly);
    if (index >= 0) game.players[playerIndex].activeHero = index;
  }

  function seedTestResources(playerIndex, testCard) {
    const player = game.players[playerIndex];
    player.chargeZone = Array.from({ length: 8 }, (_, index) => game.makeCard({ id: `TEST-CHARGE-${playerIndex}-${index}`, name: "测试协奏", kind: "dodge", tone: "tide", cost: 0, attack: 0, speed: 0, text: "测试场提供的协奏费用。" }));
    player.energy = player.chargeZone.length;
    player.deck = Array.from({ length: 16 }, () => game.makeCard(testCard));
    player.discard = [];
    player.actionZone = [];
  }

  function startTestLab() {
    const cards = testActionCards();
    const mine = cards.find((card) => card.id === elements.testPlayerCard.value);
    const theirs = cards.find((card) => card.id === elements.testAiCard.value);
    if (!mine || !theirs) return toast("请先选择双方要测试的行动卡");
    isTestLab = true;
    matchLogId = createMatchLogId();
    aiDifficulty = "novice";
    game = new DuelGame({
      seed: Date.now(), firstPlayer: 0, playerName: `${playerName || "玩家"} · 测试`,
      playerPreset: testPresetForCard(mine, "rover-female-yangyang-chixia"),
      aiPreset: testPresetForCard(theirs, "rover-male-jinhsi-sanhua"),
    });
    game.confirmSetup(0);
    applyAiIdentity();
    setTestLeader(0, mine);
    setTestLeader(1, theirs);
    game.players[0].hand = Array.from({ length: 3 }, () => game.makeCard(mine));
    game.players[1].hand = Array.from({ length: 3 }, () => game.makeCard(theirs));
    seedTestResources(0, mine);
    seedTestResources(1, theirs);
    selectedCardUid = game.players[0].hand[0]?.uid || null;
    selectedHeroOwnerIndex = 0;
    selectedHeroIndex = game.players[0].activeHero;
    aiRunning = false;
    uiLocked = false;
    interactionMode = null;
    upgradeHeroIndex = null;
    upgradeRoleCardId = null;
    setupMulliganUids = [];
    upgradeDiscardUids = [];
    matchRecorded = false;
    tutorial = { mode: "off", step: "charge", completed: null };
    hideAnimationScene();
    elements.setupOverlay.classList.add("hidden");
    elements.responseOverlay.classList.add("hidden");
    elements.gameOverOverlay.classList.add("hidden");
    elements.mainMenuOverlay.classList.add("hidden");
    render();
    toast("测试场已就绪：选择下方手牌后点击“进入战斗”。");
  }

  function showMenuPage(page) {
    const panels = { start: $("#menuStartPanel"), "deck-builder": $("#menuDeckBuilderPanel"), load: $("#menuLoadPanel"), settings: $("#menuSettingsPanel"), stats: $("#menuStatsPanel"), "test-lab": $("#menuTestLabPanel"), codex: $("#menuCodexPanel") };
    Object.entries(panels).forEach(([key, panel]) => panel.classList.toggle("hidden", key !== page));
    elements.mainMenuOverlay.classList.toggle("menu-page-open", page !== "home");
    document.querySelectorAll("[data-menu-page]").forEach((button) => button.classList.toggle("active", button.dataset.menuPage === page));
    if (page === "load") renderSaveSlot();
    if (page === "stats") renderStats();
    if (page === "settings") { syncPlayerNameInputs(); refreshApiSettings(); }
    if (page === "test-lab") populateTestLabOptions();
    if (page === "codex") populateCodexCards();
    if (page === "deck-builder") renderDeckBuilder();
  }

  function codexCardsForCategory(category) {
    return (CARD_LIBRARY?.cards || []).filter((card) => cardMatchesType(card, category)).slice().sort((a, b) => {
      return `${a.category || ""}-${a.name}-${a.id}`.localeCompare(`${b.category || ""}-${b.name}-${b.id}`, "zh-CN");
    });
  }

  function populateCodexCardsFor(categorySelect, cardSelect, visual, info) {
    if (!categorySelect || !cardSelect) return;
    const selectedId = cardSelect.value;
    populateAttributeFilter(elements.codexAttribute); const cards = codexCardsForCategory(categorySelect.value || "all").filter((card) => cardHasAttribute(card, elements.codexAttribute?.value || "all"));
    cardSelect.innerHTML = cards.map((card) => `<option value="${escapeHtml(card.id)}">${escapeHtml(card.name)} · ${escapeHtml(card.id)}</option>`).join("");
    cardSelect.value = cards.some((card) => card.id === selectedId) ? selectedId : cards[0]?.id || "";
    renderCodexCardFor(cardSelect, visual, info);
  }

  function populateCodexCards() {
    populateCodexCardsFor(elements.codexCategory, elements.codexCard, elements.codexCardVisual, elements.codexCardInfo);
  }

  function renderCodexCardFor(cardSelect, visual, info) {
    const card = (CARD_LIBRARY?.cards || []).find((item) => item.id === cardSelect?.value);
    if (!card) {
      visual.innerHTML = "<p>暂无可展示的卡牌。</p>";
      info.innerHTML = "";
      return;
    }
    const art = cardArtPath(card.art);
    const fields = [
      ["编号", card.id],
      ["类型", card.category || card.type || "未分类"],
      ["等级", card.type === "character" ? `Lv.${card.level ?? 0}` : null],
      ["武器", card.type === "character" ? card.weapon : null],
      ["共鸣属性", card.type === "character" ? card.resonance : null],
      ["地区", card.type === "character" ? card.faction : null],
      ["行动类别", card.type === "action" ? card.actionType : null],
      ["子类别", card.type === "action" ? card.actionSubtype : null],
      ["共鸣属性", card.type === "action" ? card.resonance : null],
      ["绑定角色", card.type === "action" && card.boundHero ? HEROES[card.boundHero]?.name || card.boundHero : null],
      ["COST", card.type === "action" ? card.cost ?? 0 : null],
      ["攻击", card.type === "action" ? card.attack ?? 0 : null],
      ["速度", card.type === "action" && card.kind !== "dodge" ? card.speed ?? 0 : null],
      ["专属领队", card.leaderOnly ? HEROES[card.leaderOnly]?.name || card.leaderOnly : null],
    ].filter(([, value]) => value !== null && value !== undefined);
    visual.innerHTML = art
      ? `<img src="${escapeHtml(art)}" alt="${escapeHtml(card.name)}完整卡面">`
      : "<p>该卡暂无独立卡面素材。</p>";
    info.innerHTML = `<p class="codex-card-kicker">${escapeHtml(card.category || card.type || "卡牌")}</p><h3>${escapeHtml(card.name)}</h3><dl>${fields.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}</dl><section><h4>卡牌效果</h4><p>${escapeHtml(card.text || "暂无额外文字效果。").replace(/\n/g, "<br>")}</p></section>`;
  }

  function renderCodexCard() {
    renderCodexCardFor(elements.codexCard, elements.codexCardVisual, elements.codexCardInfo);
  }

  function openDuelCodex() {
    hidePauseMenu();
    populateCodexCardsFor(elements.duelCodexCategory, elements.duelCodexCard, elements.duelCodexCardVisual, elements.duelCodexCardInfo);
    elements.duelCodexOverlay.classList.remove("hidden");
  }

  function deckBuilderCards() {
    const filter = elements.deckBuilderFilter?.value || "all";
    const tones = { red: "blaze", green: "gale", blue: "tide" };
    populateAttributeFilter(elements.deckBuilderAttribute); const attribute = elements.deckBuilderAttribute?.value || "all";
    return (CARD_LIBRARY?.cards || []).filter((card) => (filter === "all" || (filter === "角色" ? card.type === "character" : card.type === "action" && card.tone === tones[filter])) && cardHasAttribute(card, attribute)).slice().sort((a, b) => `${a.category}-${a.name}-${a.id}`.localeCompare(`${b.category}-${b.name}-${b.id}`, "zh-CN"));
  }

  function renderDeckBuilderPreview(card) {
    if (!elements.deckBuilderPreview) return;
    if (!card) { elements.deckBuilderPreview.className = "deck-builder-preview empty-hand"; elements.deckBuilderPreview.textContent = "选择右侧卡牌查看卡面、数值与效果。"; return; }
    const art = cardArtPath(card.art);
    const facts = `${card.type === "character" ? `角色牌 · ${card.hero ? HEROES[card.hero]?.name || card.hero : ""} · Lv.${card.level ?? 0}` : `${card.category} · COST ${card.cost ?? 0}${card.kind !== "dodge" ? ` · 速度 ${card.speed ?? 0}` : ""} · 攻击 ${card.attack ?? 0}`}${cardAttributeText(card) ? ` · ${cardAttributeText(card)}` : ""}`;
    elements.deckBuilderPreview.className = "deck-builder-preview";
    elements.deckBuilderPreview.innerHTML = `${art ? `<img src="${escapeHtml(art)}" alt="${escapeHtml(card.name)}卡面">` : ""}<div><p class="eyebrow">${escapeHtml(facts)}</p><h3>${escapeHtml(card.name)}</h3><p>${escapeHtml(card.text || "该卡没有额外文字效果。").replace(/\n/g, "<br>")}</p></div>`;
  }

  function addCardToCustomDeck(card) {
    if (!card) return;
    if (card.type === "character") {
      if (customDeckDraft.roleCards.includes(card.id)) return toast("同一张角色卡最多加入 1 张");
      const heroIds = customDeckHeroIds(customDeckDraft);
      if (!heroIds.includes(card.hero) && heroIds.length >= 3) return toast("角色卡组只能包含 3 种角色");
      if (customDeckRoleCount(customDeckDraft) >= 15) return toast("角色牌已达到 15 张上限");
      customDeckDraft.roleCards.push(card.id);
      toast(`已加入「${card.name}」Lv.${card.level ?? 0}角色卡`);
    } else {
      if (!actionCardAllowedForHeroes(card, customDeckHeroIds(customDeckDraft))) return toast("该专属行动卡的角色尚未加入角色卡组");
      const current = Number(customDeckDraft.actions[card.id] || 0);
      if (current >= 3) return toast("同一行动牌最多加入 3 张");
      if (customDeckActionCount(customDeckDraft) >= 40) return toast("行动牌已达到 40 张上限");
      customDeckDraft.actions[card.id] = current + 1;
    }
    renderDeckBuilder();
  }

  function removeCardFromCustomDeck(type, value) {
    if (type === "role") customDeckDraft.roleCards = customDeckDraft.roleCards.filter((id) => id !== value);
    if (type === "action") {
      const next = Math.max(0, Number(customDeckDraft.actions[value] || 0) - 1);
      if (next) customDeckDraft.actions[value] = next; else delete customDeckDraft.actions[value];
    }
    renderDeckBuilder();
  }

  function renderDeckBuilder() {
    if (!elements.deckBuilderLibrary) return;
    const validation = validateCustomDeck(customDeckDraft);
    const roleCards = customDeckRoleTemplates(customDeckDraft).map((card) => {
      const art = cardArtPath(card.art);
      return `<button type="button" class="deck-builder-picked hero-picked" data-deck-remove="role" data-deck-value="${escapeHtml(card.id)}">${art ? `<img src="${escapeHtml(art)}" alt="">` : ""}<span>${escapeHtml(card.name)}<small>Lv.${card.level ?? 0} · ${escapeHtml(card.id)} · 点击移除</small></span></button>`;
    }).join("") || '<p class="deck-builder-empty">逐张拖入角色卡；需包含 3 种角色的 Lv.0</p>';
    const actionCards = Object.entries(customDeckDraft.actions).map(([id, count]) => {
      const card = (CARD_LIBRARY?.cards || []).find((item) => item.id === id); if (!card) return "";
      const art = cardArtPath(card.art);
      return `<button type="button" class="deck-builder-picked action-picked" data-deck-remove="action" data-deck-value="${escapeHtml(id)}">${art ? `<img src="${escapeHtml(art)}" alt="">` : ""}<span>${escapeHtml(card.name)}<small>× ${count} · 点击移除 1 张</small></span></button>`;
    }).join("") || '<p class="deck-builder-empty">拖入行动牌，组至 40 张</p>';
    elements.deckBuilderRoles.innerHTML = `<p class="deck-zone-label">角色牌 · ${validation.roleCount} / 3–15　角色种类 · ${validation.heroIds.length} / 3</p><div class="deck-picked-list">${roleCards}</div>`;
    elements.deckBuilderActions.innerHTML = `<p class="deck-zone-label">行动牌 · ${validation.actionCount} / 40</p><div class="deck-picked-list">${actionCards}</div>`;
    elements.deckBuilderSummary.textContent = `角色 ${validation.roleCount} / 3–15 · 种类 ${validation.heroIds.length} / 3 · 行动 ${validation.actionCount} / 40`;
    elements.saveCustomDeck.disabled = !validation.ok;
    elements.deckBuilderLibrary.innerHTML = deckBuilderCards().map((card) => {
      const art = cardArtPath(card.art);
      const actionCount = card.type === "action" ? Number(customDeckDraft.actions[card.id] || 0) : customDeckDraft.roleCards.includes(card.id) ? 1 : 0;
      return `<button type="button" draggable="true" class="deck-builder-card ${customDeckPreviewId === card.id ? "selected" : ""}" data-builder-card="${escapeHtml(card.id)}"><span>${card.type === "character" ? `Lv.${card.level ?? 0}` : `× ${actionCount}/3`}</span>${art ? `<img src="${escapeHtml(art)}" alt="${escapeHtml(card.name)}">` : ""}<b>${escapeHtml(card.name)}</b><small>${escapeHtml(card.category || "卡牌")}</small></button>`;
    }).join("");
    elements.deckBuilderLibrary.querySelectorAll("[data-builder-card]").forEach((button) => {
      const card = (CARD_LIBRARY?.cards || []).find((item) => item.id === button.dataset.builderCard);
      button.addEventListener("click", () => { customDeckPreviewId = card?.id || null; renderDeckBuilder(); renderDeckBuilderPreview(card); });
      button.addEventListener("dragstart", (event) => { event.dataTransfer.setData("text/plain", button.dataset.builderCard); event.dataTransfer.effectAllowed = "copy"; });
    });
    [elements.deckBuilderRoles, elements.deckBuilderActions].forEach((zone) => {
      zone.addEventListener("dragover", (event) => { event.preventDefault(); zone.classList.add("drag-over"); });
      zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
      zone.addEventListener("drop", (event) => { event.preventDefault(); zone.classList.remove("drag-over"); const card = (CARD_LIBRARY?.cards || []).find((item) => item.id === event.dataTransfer.getData("text/plain")); if (!card) return; if ((zone.dataset.deckDrop === "role") !== (card.type === "character")) return toast(zone.dataset.deckDrop === "role" ? "角色牌请拖到角色牌区" : "行动牌请拖到行动牌区"); addCardToCustomDeck(card); });
    });
    document.querySelectorAll("[data-deck-remove]").forEach((button) => button.addEventListener("click", () => removeCardFromCustomDeck(button.dataset.deckRemove, button.dataset.deckValue)));
    renderDeckBuilderPreview((CARD_LIBRARY?.cards || []).find((card) => card.id === customDeckPreviewId));
    renderSavedCustomDecks();
  }

  function renderSavedCustomDecks() {
    if (!elements.customDeckSavedList) return;
    elements.customDeckSavedList.innerHTML = customDecks.length ? customDecks.map((deck) => `<div><span>${escapeHtml(deck.name)}<small>${customDeckRoleCount(deck)} 角色牌 · ${customDeckHeroIds(deck).length} 种角色 · ${customDeckActionCount(deck)} 行动</small></span><button type="button" data-load-custom="${escapeHtml(deck.id)}">编辑</button><button type="button" data-delete-custom="${escapeHtml(deck.id)}">删除</button></div>`).join("") : "<p class=\"deck-builder-empty\">尚未保存自组牌组。</p>";
    elements.customDeckSavedList.querySelectorAll("[data-load-custom]").forEach((button) => button.addEventListener("click", () => { const deck = customDecks.find((item) => item.id === button.dataset.loadCustom); if (!deck) return; customDeckDraft = { roleCards: [...deck.roleCards], actions: Object.assign({}, deck.actions) }; elements.customDeckName.value = deck.name; customDeckPreviewId = null; renderDeckBuilder(); }));
    elements.customDeckSavedList.querySelectorAll("[data-delete-custom]").forEach((button) => button.addEventListener("click", () => { customDecks = customDecks.filter((item) => item.id !== button.dataset.deleteCustom); persistCustomDecks(); refreshPlayerPresetOptions(); renderDeckBuilder(); }));
  }

  function saveCustomDeck() {
    const checked = validateCustomDeck(customDeckDraft);
    const name = String(elements.customDeckName?.value || "").trim().replace(/\s+/g, " ").slice(0, 20);
    if (!checked.ok) return toast(checked.reason);
    if (!name) return toast("请为牌组填写名称");
    const existing = customDecks.find((deck) => deck.name === name);
    const deck = { id: existing?.id || `deck-${Date.now().toString(36)}`, name, roleCards: [...checked.roleCards], heroIds: [...checked.heroIds], actions: Object.assign({}, customDeckDraft.actions), updatedAt: new Date().toISOString() };
    customDecks = existing ? customDecks.map((item) => item.id === existing.id ? deck : item) : [...customDecks, deck];
    persistCustomDecks(); refreshPlayerPresetOptions(); elements.playerPreset.value = `custom:${deck.id}`; renderSavedCustomDecks(); toast(`牌组「${name}」已保存，可在开始游戏时选择`);
  }

  async function refreshApiSettings() {
    await checkAiService();
    elements.apiConfigStatus.textContent = aiService.configured ? `当前：DeepSeek 已启用（${aiService.model || "默认模型"}）` : "当前：本地 AI 逻辑";
  }

  async function configureApiKey(apiKey) {
    const desktopAi = window.wavesDuelDesktop?.ai;
    try {
      if (desktopAi) {
        const payload = await desktopAi.configure(apiKey);
        elements.apiKeyInput.value = ""; await refreshApiSettings();
        syncDifficultyAvailability();
        if (payload.configured) elements.apiOnboardingOverlay.classList.add("hidden");
        toast(payload.configured ? "DeepSeek AI 已保存，下次启动会自动启用" : "已清除 Key，已切换为本地 AI");
        return;
      }
      if (!/^https?:$/.test(location.protocol)) return toast("请使用“启动游戏.cmd”打开游戏后再设置 API");
      const response = await fetch("/api/configure-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "配置失败");
      elements.apiKeyInput.value = ""; await refreshApiSettings();
      syncDifficultyAvailability();
      if (payload.configured) elements.apiOnboardingOverlay.classList.add("hidden");
      toast(payload.configured ? "DeepSeek AI 已保存，下次启动会自动启用" : "已清除 Key，已切换为本地 AI");
    } catch { toast("API 配置失败，请检查 Key 后重试"); }
  }

  function serviceSessionEnabled() { return /^https?:$/.test(location.protocol); }

  function startServiceSession() {
    if (!serviceSessionEnabled() || serviceHeartbeatTimer) return;
    const heartbeat = () => fetch("/api/session/heartbeat", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: serviceClientId }), keepalive: true,
    }).catch(() => { /* 服务已停止时无需阻塞页面 */ });
    heartbeat();
    serviceHeartbeatTimer = setInterval(heartbeat, 3000);
  }

  function endServiceSession() {
    if (serviceHeartbeatTimer) clearInterval(serviceHeartbeatTimer);
    serviceHeartbeatTimer = null;
    if (!serviceSessionEnabled()) return;
    const payload = JSON.stringify({ clientId: serviceClientId });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/session/bye", new Blob([payload], { type: "application/json" }));
        return;
      }
    } catch { /* 使用 fetch 后备 */ }
    fetch("/api/session/bye", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
  }

  function exitGame() {
    endServiceSession();
    window.close();
    setTimeout(() => {
      document.body.innerHTML = '<main class="exit-screen"><p class="eyebrow">Wuthering Waves: Duel</p><h1>游戏已退出</h1><p>本地服务正在关闭。现在可以关闭此浏览器窗口。</p></main>';
    }, 100);
  }
  function renderStats() {
    elements.menuStats.innerHTML = statsHtml(localStats);
    if (game) elements.gameOverStats.innerHTML = statsHtml({
      games: 1, wins: game.winner === 0 ? 1 : 0,
      damageDealt: game.matchStats.damageDealt[0], damageReceived: game.matchStats.damageReceived[0], healingReceived: game.matchStats.healingReceived[0], cardsPlayed: game.matchStats.cardsPlayed[0],
    });
  }

  function recordMatch() {
    if (!game || isTestLab || matchRecorded || game.winner == null) return;
    matchRecorded = true;
    localStats.games += 1;
    localStats.wins += game.winner === 0 ? 1 : 0;
    localStats.damageDealt += game.matchStats.damageDealt[0];
    localStats.damageReceived += game.matchStats.damageReceived[0];
    localStats.healingReceived += game.matchStats.healingReceived[0];
    localStats.cardsPlayed += game.matchStats.cardsPlayed[0];
    persistStats();
    renderStats();
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function checkAiService() {
    const desktopAi = window.wavesDuelDesktop?.ai;
    if (desktopAi) {
      try {
        const status = await desktopAi.status();
        aiService = { configured: Boolean(status.configured), model: status.model || "", available: true, storage: "desktop" };
        if (elements.aiModeBadge) elements.aiModeBadge.textContent = status.configured ? `DeepSeek · ${status.model}` : "本地 AI · 未配置 Key";
      } catch {
        aiService = { configured: false, model: "", available: false, storage: "desktop" };
        if (elements.aiModeBadge) elements.aiModeBadge.textContent = "本地 AI · 桌面服务不可用";
      }
      syncDifficultyAvailability();
      return;
    }
    if (!/^https?:$/.test(location.protocol)) {
      aiService = { configured: false, model: "", available: false, storage: "offline" };
      if (elements.aiModeBadge) elements.aiModeBadge.textContent = "本地 AI · 联网启动后可启用 DeepSeek";
      syncDifficultyAvailability();
      return;
    }
    try {
      const response = await fetch("/api/status", { cache: "no-store" });
      const status = await response.json();
      aiService = { configured: Boolean(status.configured), model: status.model || "", available: response.ok, storage: "server" };
      if (elements.aiModeBadge) elements.aiModeBadge.textContent = status.configured ? `DeepSeek · ${status.model}` : "本地 AI · 未配置 Key";
      await loadServerProfile();
    } catch {
      aiService = { configured: false, model: "", available: false, storage: "server" };
      if (elements.aiModeBadge) elements.aiModeBadge.textContent = "本地 AI · 服务不可用";
    }
    syncDifficultyAvailability();
  }

  function syncDifficultyAvailability() {
    const cloudOnly = document.querySelectorAll('input[name="difficulty"][value="standard"], input[name="difficulty"][value="expert"]');
    cloudOnly.forEach((input) => {
      input.disabled = !aiService.configured;
      input.closest("label")?.classList.toggle("locked", !aiService.configured);
    });
    const checked = document.querySelector('input[name="difficulty"]:checked');
    if (!aiService.configured && checked?.value !== "novice") document.querySelector('input[name="difficulty"][value="novice"]')?.click();
  }

  function maybeShowApiOnboarding() {
    if (aiService.configured || sessionStorage.getItem("waves-duel-api-onboarding-dismissed") === "1") return;
    elements.apiOnboardingOverlay.classList.remove("hidden");
  }

  function applyAiIdentity() {
    if (!game?.players?.[1]) return;
    game.players[1].name = DIFFICULTIES[aiDifficulty]?.aiName || DIFFICULTIES.novice.aiName;
  }

  async function requestAiDecision(mode, state, legal) {
    if (!aiService.configured || !aiService.available) return null;
    const desktopAi = window.wavesDuelDesktop?.ai;
    const controller = new AbortController();
    let timeout;
    try {
      const request = desktopAi
        ? desktopAi.decide({ mode, state, legal, difficulty: aiDifficulty })
        : fetch("/api/ai-move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, state, legal, difficulty: aiDifficulty }),
          signal: controller.signal,
        }).then(async (response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        });
      const timeoutGuard = new Promise((_, reject) => {
        timeout = setTimeout(() => {
          controller.abort();
          const error = new Error("deepseek_decision_timeout");
          error.name = "TimeoutError";
          reject(error);
        }, AI_DECISION_TIMEOUT_MS);
      });
      const result = await Promise.race([request, timeoutGuard]);
      const decision = result.decision || null;
      if (decision) recordAiDecision({ mode, state, legal, decision, source: `DeepSeek · ${result.model || aiService.model || "默认模型"}` });
      return decision;
    } catch (error) {
      const timedOut = error.name === "AbortError" || error.name === "TimeoutError";
      game.log(timedOut ? "DeepSeek 单次决策超过 10 秒，本次已由本地 AI 兜底；下一次仍会优先请求 DeepSeek。" : "DeepSeek 决策失败，本次已切换本地 AI；下一次仍会优先请求 DeepSeek。", "system");
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  function toneStyle(tone) {
    const colors = { blaze: "var(--blaze)", gale: "var(--gale)", tide: "var(--tide)" };
    return colors[tone] || "var(--mint)";
  }

  function toneLabel(tone) {
    const data = TONES[tone];
    return data ? `${data.icon} ${data.name}` : "无频率";
  }

  function heroSpritePosition(heroId) {
    return {
      rover: "0% 0%",
      roverFemale: "0% 0%",
      jinhsi: "50% 0%",
      sanhua: "100% 0%",
      yangyang: "0% 0%",
      chixia: "50% 70%",
      calcharo: "0% 70%",
      jiyan: "50% 70%",
      shorekeeper: "100% 70%",
    }[heroId] || "50% 50%";
  }

  function cardArtPath(art) {
    return art ? encodeURI(`card-library/${String(art).replace(/\\/g, "/")}`) : "";
  }

  function heroArtPath(heroOrId) {
    const hero = typeof heroOrId === "string" ? { id: heroOrId } : heroOrId;
    const topCard = hero?.stack?.[hero.stack.length - 1];
    const art = topCard?.art || HEROES[hero?.id]?.art;
    return cardArtPath(art);
  }

  function actionArtPath(cardKey) {
    const card = window.WavesDuelCardLibrary?.cards?.find((item) => item.id === cardKey);
    return cardArtPath(card?.art);
  }

  function cardGlyph(card) {
    if (card.kind === "character") return card.name.slice(0, 1);
    if (card.kind === "attack") return card.tone === "blaze" ? "╳" : card.tone === "gale" ? "≋" : "◉";
    return card.heal ? "+" : card.draw ? "≡" : "◇";
  }

  function kindLabel(kind) {
    return { character: "主角", attack: "攻击", dodge: "躲避" }[kind] || kind;
  }

  function cardAttributeText(card) {
    if (!card) return "";
    if (card.type === "character" || card.kind === "character") return [card.weapon, card.resonance, card.faction].filter(Boolean).join(" · ");
    const bound = card.boundHero ? `绑定：${HEROES[card.boundHero]?.name || card.boundHero}` : "通用";
    return [card.actionType, card.actionSubtype, card.resonance, bound].filter(Boolean).join(" · ");
  }

  // 筛选使用简短属性串；战局及弹窗详情则必须保留字段名，避免只显示数值却无法辨认含义。
  function cardSupplementalAttributeText(card) {
    if (!card) return "";
    if (card.type === "character" || card.kind === "character") {
      return [
        `武器：${card.weapon || "未标注"}`,
        `共鸣属性：${card.resonance || "未标注"}`,
        `地区：${card.faction || "未标注"}`,
      ].join("　｜　");
    }
    return [
      `行动类别：${card.actionType || card.category || "未标注"}`,
      `子类别：${card.actionSubtype || "无"}`,
      `共鸣属性：${card.resonance || "未标注"}`,
      `绑定角色：${card.boundHero ? HEROES[card.boundHero]?.name || card.boundHero : "通用"}`,
    ].join("　｜　");
  }
  function cardHasAttribute(card, value) { return value === "all" || cardAttributeText(card).split(" · ").includes(value); }
  function populateAttributeFilter(select) { if (!select || select.dataset.ready) return; const values = [...new Set((CARD_LIBRARY?.cards || []).flatMap((card) => cardAttributeText(card).split(" · ").filter(Boolean)))].sort((a, b) => a.localeCompare(b, "zh-CN")); select.innerHTML = `<option value="all">全部属性</option>${values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("")}`; select.dataset.ready = "1"; }

  // 规则允许当前等级或下一等级的同名角色牌；沿用原先优先升至最高等级的行为，
  // 但保留该等级的全部卡牌，以支持同等级的效果分支。
  function upgradeCandidates(playerIndex, heroIndex) {
    const options = game?.upgradeOptions(playerIndex, heroIndex) || [];
    const level = options.reduce((highest, card) => Math.max(highest, Number(card.level) || 0), -1);
    return level < 0 ? [] : options.filter((card) => Number(card.level) === level);
  }

  function selectedUpgradeCandidate(playerIndex, heroIndex) {
    const candidates = upgradeCandidates(playerIndex, heroIndex);
    return candidates.find((card) => card.id === upgradeRoleCardId) || (candidates.length === 1 ? candidates[0] : null);
  }

  function roleCardChoiceHtml(card, selected) {
    const art = cardArtPath(card?.art);
    if (art) return `<button class="card full-face-card ${selected ? "choice-selected" : ""}" type="button" data-upgrade-role-card="${escapeHtml(card.id)}" aria-label="选择升级角色卡：${escapeHtml(card.name)} Lv.${escapeHtml(card.level)}"><img class="card-face-image" src="${escapeHtml(art)}" alt="${escapeHtml(card.name)} Lv.${escapeHtml(card.level)} 卡面"></button>`;
    return `<button class="card ${selected ? "choice-selected" : ""}" type="button" data-upgrade-role-card="${escapeHtml(card.id)}" aria-label="选择升级角色卡：${escapeHtml(card.name)} Lv.${escapeHtml(card.level)}"><div class="card-art">◇</div><div class="card-body"><strong>${escapeHtml(card.name)}</strong><small>Lv.${escapeHtml(card.level)}</small></div></button>`;
  }

  function roleCardChoiceEffectHtml(card, fallback = "选择一张角色牌后，这里会显示升级效果与补充属性。") {
    if (!card) return `<div class="choice-effect-empty"><span>◇</span><p>${escapeHtml(fallback)}</p></div>`;
    const art = cardArtPath(card.art);
    const attributes = cardSupplementalAttributeText(card);
    return `${art ? `<img src="${escapeHtml(art)}" alt="${escapeHtml(card.name)}完整卡面">` : ""}<div><p class="eyebrow">CHARACTER // UPGRADE BRANCH</p><h3>${escapeHtml(card.name)} · Lv.${escapeHtml(card.level)}</h3><small>${escapeHtml(attributes || "角色牌")}</small><b>升级后将叠放并生效此角色牌的效果</b><p>${escapeHtml(card.text || "暂无额外文字效果。").replace(/\n/g, "<br>")}</p></div>`;
  }

  function cardHtml(card, ownerIndex, options) {
    const settings = options || {};
    const multiChoiceMode = interactionMode === "upgrade-card" || interactionMode === "hand-limit" || interactionMode === "effect-discard";
    const singleChoiceMode = interactionMode === "charge-select" || interactionMode === "battle-select";
    const choiceSelected = Boolean(settings.choiceSelected) || (settings.setupMulligan ? setupMulliganUids.includes(card.uid) : (multiChoiceMode && upgradeDiscardUids.includes(card.uid)) || (singleChoiceMode && card.uid === selectedCardUid));
    const selected = (settings.setupMulligan ? setupMulliganUids.includes(card.uid) : card.uid === selectedCardUid || (multiChoiceMode && upgradeDiscardUids.includes(card.uid))) && !settings.response;
    const cost = game.cardCost(ownerIndex, card);
    const unaffordable = !settings.setupMulligan && !settings.ignoreCost && (cost > game.players[ownerIndex].energy || !game.canUseCard(ownerIndex, card));
    const actionArt = actionArtPath(card.key || card.id);
    const faceArt = actionArt || (card.kind === "character" ? heroArtPath(card.heroId) : "");
    const dataAttribute = settings.setupMulligan ? `data-setup-mulligan="${escapeHtml(card.uid)}"` : `data-card="${escapeHtml(card.uid)}"`;
    if (faceArt) {
      return `<button class="card full-face-card ${selected ? "selected" : ""} ${choiceSelected ? "choice-selected" : ""} ${unaffordable ? "unaffordable" : ""}" type="button" ${dataAttribute} aria-label="${escapeHtml(card.name)}"><img class="card-face-image" src="${escapeHtml(faceArt)}" alt="${escapeHtml(card.name)} 卡面"></button>`;
    }
    return `<button class="card ${selected ? "selected" : ""} ${choiceSelected ? "choice-selected" : ""} ${unaffordable ? "unaffordable" : ""}" style="--tone-color:${toneStyle(card.tone)}" type="button" ${dataAttribute} aria-label="${escapeHtml(card.name)}"><span class="card-cost">${cost}</span><div class="card-art">${escapeHtml(cardGlyph(card))}</div><div class="card-body"><strong>${escapeHtml(card.name)}</strong><small>${escapeHtml(kindLabel(card.kind))}</small></div><span class="card-tone-bar"></span></button>`;
  }
  function effectSummary(card, ownerIndex) {
    const effects = [];
    const stats = game.cardStats(ownerIndex, card);
    const attributes = cardAttributeText(card);
    if (attributes) effects.push(`类型：${attributes}`);
    if (card.kind === "attack") effects.push(`速度 ${stats.speed} · 攻击 ${stats.attack}`);
    if (card.kind === "dodge" && stats.attack) effects.push(`攻击 ${stats.attack}`);
    if (card.heal) effects.push(`治疗己方 · ${card.heal} 点生命`);
    if (card.shield) effects.push(`保护己方 · ${card.shield} 点护盾`);
    if (card.draw) effects.push(`己方抽 ${card.draw} 张牌`);
    if (stats.bonus) effects.push(stats.bonus);
    if (!effects.length) effects.push("蓝色躲避：只在结算成功时触发效果");
    return `${game.players[ownerIndex].name}：${effects.join("；")}`;
  }

  function choiceEffectHtml(card, ownerIndex, fallback = "点击一张卡牌后，这里会显示完整效果。") {
    if (!card) return `<div class="choice-effect-empty"><span>◇</span><p>${escapeHtml(fallback)}</p></div>`;
    const art = actionArtPath(card.key || card.id) || (card.kind === "character" ? heroArtPath(card.heroId) : "");
    const stats = game.cardStats(ownerIndex, card);
    const metrics = [`COST ${game.cardCost(ownerIndex, card)}`];
    if (card.kind === "attack") metrics.push(`速度 ${stats.speed} · 攻击 ${stats.attack}`);
    else if (card.kind === "dodge" && stats.attack) metrics.push(`攻击 ${stats.attack}`);
    const attributes = cardSupplementalAttributeText(card);
    return `${art ? `<img src="${escapeHtml(art)}" alt="${escapeHtml(card.name)}完整卡面">` : ""}<div><p class="eyebrow">${escapeHtml(toneLabel(card.tone))} // ${escapeHtml(kindLabel(card.kind))}</p><h3>${escapeHtml(card.name)}</h3><small>${escapeHtml([metrics.join("　"), attributes].filter(Boolean).join("　｜　"))}</small><b>${escapeHtml(effectSummary(card, ownerIndex))}</b><p>${escapeHtml(card.text || "暂无额外文字效果。").replace(/\n/g, "<br>")}</p></div>`;
  }

  function heroChoiceEffectHtml(hero, ownerIndex, fallback = "点击一名角色后，这里会显示其完整效果。", heroIndex = null) {
    if (!hero) return `<div class="choice-effect-empty"><span>◇</span><p>${escapeHtml(fallback)}</p></div>`;
    const effects = hero.stack.map((roleCard) => `Lv.${roleCard.level}：${roleCard.text || "暂无额外文字效果。"}`).join("\n");
    const attributes = cardSupplementalAttributeText(hero.stack[hero.stack.length - 1]);
    return `<img src="${escapeHtml(heroArtPath(hero))}" alt="${escapeHtml(hero.name)}完整卡面"><div><p class="eyebrow">CHARACTER // ${escapeHtml(game.players[ownerIndex].name)}</p><h3>${escapeHtml(hero.name)} · Lv.${hero.level}</h3><small>${hero.stack.length} 张角色牌已叠放${heroIndex === game.players[ownerIndex].activeHero ? " · 当前领队" : ""}${attributes ? `　｜　${escapeHtml(attributes)}` : ""}</small><b>${escapeHtml(toneLabel(hero.passiveTone))}角色效果</b><p>${escapeHtml(effects).replace(/\n/g, "<br>")}</p></div>`;
  }

  function setAnimationScene(html, className) {
    // 教学中的执行动画和阶段总结必须全屏正常亮度，不保留上一环节的聚焦遮罩。
    if (tutorial.mode !== "off") {
      elements.tutorialScrim.classList.add("hidden");
      elements.tutorialFocusFrame.classList.add("hidden");
      document.querySelectorAll(".tutorial-target, .tutorial-focus-layer").forEach((element) => {
        element.classList.remove("tutorial-target", "tutorial-focus-layer");
      });
    }
    elements.animationLayer.className = `animation-layer ${className || ""}`.trim();
    elements.animationLayer.innerHTML = html;
  }

  function hideAnimationScene() {
    elements.animationLayer.className = "animation-layer hidden";
    elements.animationLayer.innerHTML = "";
    if (tutorialIsActive()) renderTutorial();
  }

  async function animateCardTransfer(card, ownerIndex, title, destination, duration = 1250) {
    setAnimationScene(`
      <div class="action-scene ${escapeHtml(destination)} owner-${ownerIndex}">
        <p class="scene-kicker">${ownerIndex === 0 ? "PLAYER ACTION" : "AI ACTION"}</p>
        <h2>${escapeHtml(title)}</h2>
        <div class="moving-card">${cardHtml(card, ownerIndex, { response: true })}</div>
        <div class="scene-destination">${destination === "to-charge" ? "协奏区 +1" : destination === "to-action" ? "行动区" : "弃牌区"}</div>
      </div>`, `${destination} owner-${ownerIndex}`);
    await delay(220);
    elements.animationLayer.classList.add("animating");
    await delay(duration);
    hideAnimationScene();
  }

  async function animateSpentEnergy(cards, ownerIndex) {
    if (!cards || !cards.length) return;
    const cardNodes = cards.map((card) => `<div class="spent-energy-card">${cardHtml(card, ownerIndex, { response: true })}</div>`).join("");
    setAnimationScene(`
      <div class="spent-energy-scene owner-${ownerIndex}">
        <p class="scene-kicker">PAY COST</p>
        <h2>支付 ${cards.length} 点费用</h2>
        <div class="spent-energy-cards">${cardNodes}</div>
        <p>充能牌消耗后进入弃牌区，不会在下回合恢复。</p>
      </div>`, `spent-energy owner-${ownerIndex}`);
    await delay(300);
    elements.animationLayer.classList.add("animating");
    await delay(1350);
    hideAnimationScene();
  }

  async function animateCoverCard(ownerIndex) {
    renderArenaContestStage();
    elements.arenaContestStage.classList.add("placing", `owner-${ownerIndex}`);
    await delay(1100);
    elements.arenaContestStage.classList.remove("placing", `owner-${ownerIndex}`);
  }

  async function animateUpgrade(ownerIndex, heroIndex, fromLevel, toLevel) {
    const hero = game.players[ownerIndex].heroes[heroIndex];
    setAnimationScene(`
      <div class="hero-action-scene upgrade-scene">
        <p class="scene-kicker">RESONANCE UPGRADE</p>
        <div class="scene-hero-art" style="--hero-art:url('${heroArtPath(hero)}')"></div>
        <h2>${escapeHtml(hero.name)} · Lv.${fromLevel} → Lv.${toLevel}</h2>
        <p>升级成功：该角色当前已叠放的所有等级技能均会保留。</p>
      </div>`, "hero-action");
    await delay(180);
    elements.animationLayer.classList.add("animating");
    const zone = ownerIndex === 0 ? elements.playerZone : elements.aiZone;
    zone.querySelector(`[data-hero="${heroIndex}"]`)?.classList.add("upgrade-pulse");
    await delay(1400);
    hideAnimationScene();
  }

  async function animateHeroSwitch(ownerIndex, fromIndex, toIndex) {
    const player = game.players[ownerIndex];
    const fromHero = player.heroes[fromIndex];
    const toHero = player.heroes[toIndex];
    setAnimationScene(`
      <div class="switch-scene">
        <p class="scene-kicker">LEADER SWITCH</p>
        <div class="switch-portraits">
          <div><div class="scene-hero-art" style="--hero-art:url('${heroArtPath(fromHero)}')"></div><span>${escapeHtml(fromHero.name)}</span></div>
          <b>→</b>
          <div><div class="scene-hero-art" style="--hero-art:url('${heroArtPath(toHero)}')"></div><span>${escapeHtml(toHero.name)}</span></div>
        </div>
        <h2>${escapeHtml(toHero.name)} 成为新领队</h2>
      </div>`, "hero-action");
    await delay(180);
    elements.animationLayer.classList.add("animating");
    await delay(1400);
    hideAnimationScene();
  }

  async function animateDamage(playerIndex, amount) {
    if (!amount) return;
    const zone = playerIndex === 0 ? elements.playerZone : elements.aiZone;
    zone.classList.add("damage-hit");
    const delta = document.createElement("div");
    delta.className = "damage-number";
    delta.textContent = `-${amount}`;
    zone.appendChild(delta);
    await delay(1200);
    zone.classList.remove("damage-hit");
    delta.remove();
  }

  async function animateAndCommitDamage(event, fallbackPlayerIndex, fallbackAmount) {
    const damageEvent = event || { playerIndex: fallbackPlayerIndex, amount: fallbackAmount, source: "旧版伤害效果" };
    if (!damageEvent?.amount) return;
    await animateDamage(damageEvent.playerIndex, damageEvent.amount);
    game.commitDamage(damageEvent);
    render();
  }

  async function animateAndCommitEffectDamage(effect) {
    if (!effect?.damage) return;
    const events = effect.damageEvents?.length ? effect.damageEvents : [null];
    for (const event of events) await animateAndCommitDamage(event, effect.opponentIndex, event?.amount || effect.damage);
  }

  async function animateDraw(playerIndex, count, reason = "抽牌") {
    if (!count) return;
    const ownerName = game.players[playerIndex].name;
    const cards = Array.from({ length: count }, (_, index) => `<i class="draw-card" style="--draw-index:${index}" aria-hidden="true"></i>`).join("");
    setAnimationScene(`
      <div class="draw-scene owner-${playerIndex}">
        <p class="scene-kicker">DRAW CARDS</p>
        <h2>${escapeHtml(ownerName)} ${escapeHtml(reason)}</h2>
        <div class="draw-cards">${cards}</div>
        <p>抽取 ${count} 张行动卡</p>
      </div>`, `draw-animation owner-${playerIndex}`);
    await delay(180);
    elements.animationLayer.classList.add("animating");
    await delay(980 + Math.min(count, 3) * 150);
    hideAnimationScene();
  }

  async function animateChargeFromDeck(playerIndex, count, reason = "效果置入协奏区") {
    if (!count) return;
    const ownerName = game.players[playerIndex].name;
    const cards = Array.from({ length: count }, (_, index) => `<i class="draw-card" style="--draw-index:${index}" aria-hidden="true"></i>`).join("");
    setAnimationScene(`
      <div class="draw-scene owner-${playerIndex}">
        <p class="scene-kicker">RESONANCE CHARGE</p>
        <h2>${escapeHtml(ownerName)} ${escapeHtml(reason)}</h2>
        <div class="draw-cards">${cards}</div>
        <p>牌库顶 ${count} 张卡进入协奏区</p>
      </div>`, `draw-animation owner-${playerIndex}`);
    await delay(180);
    elements.animationLayer.classList.add("animating");
    await delay(980 + Math.min(count, 3) * 150);
    hideAnimationScene();
  }

  async function animateEffectResourceChanges(effect, drawReason = "效果抽牌", chargeReason = "效果置入协奏区") {
    if (!effect) return;
    if (effect.draw) await animateDraw(effect.playerIndex, effect.draw, drawReason);
    if (effect.charge) await animateChargeFromDeck(effect.playerIndex, effect.charge, chargeReason);
  }

  // 规则层会把可见的资源变化保留到卡面展示结束后再提交。旧存档/旧规则层
  // 没有该接口时保持可用；兼容方法只用于仍采用旧触发对象的本地版本。
  function commitDeferredEffect(effect) {
    if (!effect || !game) return null;
    if (typeof game.commitDeferredEffect === "function") return game.commitDeferredEffect(effect);
    if (typeof game.commitDeferredRoleTrigger === "function") return game.commitDeferredRoleTrigger(effect);
    return null;
  }

  async function animateAndCommitDeferredEffect(effect, timing, drawReason, chargeReason) {
    if (!effect) return null;
    await animateTriggeredEffect(effect, timing || effect.timing || "效果结算");
    await resolveDeferredDiscardRecovery(effect);
    const committed = commitDeferredEffect(effect);
    // 即使当前规则层尚未支持延迟提交，也在卡面展示结束后刷新；这样新旧规则层
    // 的 UI 时序一致，且不会因缺少接口中断对局。
    render();
    const committedItems = Array.isArray(committed) ? committed : (committed ? [committed] : []);
    const resourceEffect = Object.assign({}, effect, {
      draw: committedItems.filter((item) => item?.destination === "hand").reduce((total, item) => total + (item.cards?.length || 0), 0),
      charge: committedItems.filter((item) => item?.destination === "charge").reduce((total, item) => total + (item.cards?.length || 0), 0),
    });
    await animateEffectResourceChanges(resourceEffect, drawReason, chargeReason);
    return committed;
  }

  function directEffectResources(effect) {
    const roleTriggers = effect?.roleTriggers || [];
    const triggered = (field) => roleTriggers.reduce((total, trigger) => total + (Number(trigger?.[field]) || 0), 0);
    return Object.assign({}, effect, {
      roleTriggers: [],
      draw: Math.max(0, (Number(effect?.draw) || 0) - triggered("draw")),
      charge: Math.max(0, (Number(effect?.charge) || 0) - triggered("charge")),
      heal: Math.max(0, (Number(effect?.heal) || 0) - triggered("heal")),
    });
  }

  async function commitAndAnimateDirectEffectResources(effect, drawReason, chargeReason) {
    const direct = directEffectResources(effect);
    if (!direct?.draw && !direct?.charge && !direct?.heal && !direct?.deferred) return null;
    const committed = commitDeferredEffect(direct);
    render();
    await animateEffectResourceChanges(direct, drawReason, chargeReason);
    return committed;
  }

  async function animateTurnDraw() {
    const draw = game?.lastTurnDraw;
    if (!draw || draw.turn === lastAnimatedDrawTurn) return;
    lastAnimatedDrawTurn = draw.turn;
    await animateDraw(draw.playerIndex, draw.count, draw.opening ? "首回合抽牌" : "回合抽牌");
  }

  async function animateTurnTransition(turnStart) {
    const playerIndex = turnStart.playerIndex;
    const isPlayer = playerIndex === 0;
    const frame = isPlayer ? "assets/ui/round-transition-player.png" : "assets/ui/round-transition-opponent.png";
    setAnimationScene(`<div class="round-transition-scene owner-${playerIndex}"><img class="round-transition-frame" src="${frame}" alt="" aria-hidden="true"></div>`, "round-transition-animation");
    await delay(150);
    elements.animationLayer.classList.add("animating");
    await delay(1750);
    hideAnimationScene();
  }

  async function animateTurnStartSequence() {
    const turnStart = game?.lastTurnStartEffects;
    if (turnStart && turnStart.turn !== lastAnimatedTurnTransitionTurn) {
      lastAnimatedTurnTransitionTurn = turnStart.turn;
      await animateTurnTransition(turnStart);
    }
    if (turnStart && turnStart.turn !== lastAnimatedTurnStartEffectsTurn) {
      lastAnimatedTurnStartEffectsTurn = turnStart.turn;
      for (const effect of turnStart.effects || []) {
        await animateAndCommitDeferredEffect(effect, effect.timing || "回合开始", `「${effect.cardName}」效果抽牌`, `「${effect.cardName}」效果置入协奏区`);
      }
    }
    await animateTurnDraw();
  }

  async function animateTriggeredEffect(effect, timing = "效果结算") {
    const source = effect?.triggerSource || effect;
    if (!source?.cardName || (!effect?.draw && !effect?.charge && !effect?.damage && !effect?.note)) return;
    const ownerName = game.players[effect.playerIndex]?.name || "角色";
    const roleCard = game.players[effect.playerIndex]?.heroes
      ?.flatMap((hero) => hero.stack || [])
      .find((card) => card.name === source.cardName && card.text === source.text);
    const parts = [];
    if (effect.draw) parts.push(`抽取 ${effect.draw} 张行动卡`);
    if (effect.charge) parts.push(`将 ${effect.charge} 张卡置入协奏区`);
    if (effect.damage) parts.push(`造成 ${effect.damage} 点伤害`);
    if (effect.note) parts.push(effect.note);
    const cardFace = roleCard ? cardHtml(roleCard, effect.playerIndex, { response: true, ignoreCost: true }) : '<div class="contest-card-back" aria-label="角色效果卡面"></div>';
    const attributes = cardAttributeText(roleCard);
    setAnimationScene(`<div class="battle-showcase-scene victory"><p class="scene-kicker">${escapeHtml(timing)}</p><h2>${escapeHtml(ownerName)} 的「${escapeHtml(source.cardName)}」效果触发</h2><div class="battle-showcase-layout role-effect-layout"><div class="battle-showcase-cards role-effect-card">${cardFace}</div><aside class="battle-showcase-detail single-effect"><p class="eyebrow">EFFECT DETAIL${attributes ? ` · ${escapeHtml(attributes)}` : ""}</p><section><strong>${escapeHtml(source.text || "角色效果")}</strong><b>${escapeHtml(parts.join(" · "))}</b><p>该效果将先于后续阶段结算。</p></section></aside></div></div>`, "battle-showcase-animation");
    await delay(180);
    elements.animationLayer.classList.add("animating");
    await delay(1450);
    hideAnimationScene();
  }

  async function animateTurnEndEffects(effects) {
    for (const effect of effects || []) {
      await animateAndCommitDeferredEffect(effect, effect.timing || "回合结束", `「${effect.cardName}」效果抽牌`, `「${effect.cardName}」效果置入协奏区`);
    }
  }

  async function animateRoleTriggeredEffects(effect) {
    for (const trigger of effect?.roleTriggers || []) {
      await animateAndCommitDeferredEffect(trigger, trigger.timing || "角色效果", `「${trigger.cardName}」效果抽牌`, `「${trigger.cardName}」效果置入协奏区`);
    }
  }

  async function animateBattleShowcase(result) {
    const isDraw = result.winningPlayer == null;
    const showcase = (card, ownerIndex, caption) => `<div class="battle-showcase-card"><span>${escapeHtml(game.players[ownerIndex].name)}</span>${card ? cardHtml(card, ownerIndex, { response: true }) : '<div class="contest-card-back" aria-label="未盖放卡牌"></div>'}<small>${escapeHtml(caption)}</small></div>`;
    const cards = isDraw
      ? `${showcase(result.initiatorCard, result.initiator, "双方效果展示")}<b class="battle-showcase-vs">VS</b>${showcase(result.responseCard, result.responder, "双方效果展示")}`
      : result.winningPlayer === result.initiator
        ? showcase(result.initiatorCard, result.initiator, "战斗胜利 · 效果触发")
        : showcase(result.responseCard, result.responder, "战斗胜利 · 效果触发");
    const title = isDraw ? "战斗平局 · 双方展示效果" : `${game.players[result.winningPlayer].name} 战斗胜利`;
    const detailCards = isDraw
      ? [[result.initiatorCard, result.initiator], [result.responseCard, result.responder]]
      : result.winningPlayer === result.initiator
        ? [[result.initiatorCard, result.initiator]]
        : [[result.responseCard, result.responder]];
    const details = detailCards.filter(([card]) => card).map(([card, ownerIndex]) => `<section><strong>${escapeHtml(card.name)}</strong><b>${escapeHtml(effectSummary(card, ownerIndex))}</b><p>${escapeHtml(card.text || "该行动卡的效果将按规则结算。")}</p></section>`).join("");
    setAnimationScene(`<div class="battle-showcase-scene ${isDraw ? "draw" : "victory"}"><p class="scene-kicker">BATTLE RESOLUTION</p><h2>${escapeHtml(title)}</h2><div class="battle-showcase-layout"><div class="battle-showcase-cards">${cards}</div><aside class="battle-showcase-detail"><p class="eyebrow">EFFECT DETAIL</p>${details}</aside></div></div>`, "battle-showcase-animation");
    await delay(180);
    elements.animationLayer.classList.add("animating");
    await delay(1900);
    hideAnimationScene();
  }

  async function animatePursuitShowcase(card, ownerIndex) {
    const details = `<section><strong>${escapeHtml(card.name)}</strong><b>${escapeHtml(effectSummary(card, ownerIndex))}</b><p>${escapeHtml(card.text || "追击效果将按规则结算。")}</p></section>`;
    setAnimationScene(`<div class="battle-showcase-scene victory"><p class="scene-kicker">PURSUIT</p><h2>${escapeHtml(game.players[ownerIndex].name)} 发动追击</h2><div class="battle-showcase-layout"><div class="battle-showcase-cards"><div class="battle-showcase-card"><span>红色行动卡</span>${cardHtml(card, ownerIndex, { response: true })}<small>追击效果即将结算</small></div></div><aside class="battle-showcase-detail"><p class="eyebrow">EFFECT DETAIL</p>${details}</aside></div></div>`, "battle-showcase-animation");
    await delay(180);
    elements.animationLayer.classList.add("animating");
    await delay(1650);
    hideAnimationScene();
  }

  async function animateContest(result) {
    const leftCard = result.initiatorCard;
    const rightCard = result.responseCard;
    const leftOwner = result.initiator;
    const rightOwner = result.responder;
    const rightBack = '<div class="contest-card-back" aria-label="未盖放卡牌"></div>';
    setAnimationScene(`
      <div class="contest-scene cover-stage">
        <p class="scene-kicker">FACE-DOWN CONTEST</p>
        <h2>双方盖牌</h2>
        <div class="contest-board">
          <div class="contest-side"><span>${escapeHtml(game.players[leftOwner].name)}</span><div class="contest-card-back" aria-label="已盖放卡牌"></div></div>
          <div class="contest-vs">VS</div>
          <div class="contest-side"><span>${escapeHtml(game.players[rightOwner].name)}</span>${rightCard ? '<div class="contest-card-back" aria-label="已盖放卡牌"></div>' : rightBack}</div>
        </div>
      </div>`, "contest-animation");
    await delay(1050);

    elements.animationLayer.innerHTML = `
      <div class="contest-scene reveal-stage">
        <p class="scene-kicker">SIMULTANEOUS REVEAL</p>
        <h2>同时翻牌</h2>
        <div class="contest-board">
          <div class="contest-side"><span>${escapeHtml(game.players[leftOwner].name)}</span>${cardHtml(leftCard, leftOwner, { response: true })}<p>${escapeHtml(effectSummary(leftCard, leftOwner))}</p></div>
          <div class="contest-vs">VS</div>
          <div class="contest-side"><span>${escapeHtml(game.players[rightOwner].name)}</span>${rightCard ? cardHtml(rightCard, rightOwner, { response: true }) : rightBack}<p>${rightCard ? escapeHtml(effectSummary(rightCard, rightOwner)) : "没有可用手牌，发起方直接通过"}</p></div>
        </div>
      </div>`;
    elements.animationLayer.classList.add("revealed");
    const paid = [];
    if (result.spentCards?.initiator?.length) paid.push(`${game.players[leftOwner].name} 扣除 ${result.spentCards.initiator.length} 费`);
    if (result.spentCards?.responder?.length) paid.push(`${game.players[rightOwner].name} 扣除 ${result.spentCards.responder.length} 费`);
    if (paid.length) {
      elements.animationLayer.insertAdjacentHTML("beforeend", `<div class="effect-resolution"><b>翻牌后同步支付费用</b><span>${escapeHtml(paid.join(" ／ "))}；充能牌进入弃牌区</span></div>`);
    }
    await delay(1750);

    const winnerText = result.outcome === "identical" ? "完全相同，双方抵消"
      : result.outcome === "dual-dodge" ? "双方蓝色躲避，各自触发效果"
      : result.outcome === "speed-tie" ? "速度相同，双方对撞无效"
      : result.winningPlayer == null
      ? "战斗平局"
      : `${game.players[result.winningPlayer].name} 战斗胜利`;
    const compareText = !rightCard
      ? "对方无牌 · 直接通过"
      : result.outcome === "identical"
        ? "同名、同数值的牌完全抵消"
      : result.outcome === "dual-dodge"
        ? "蓝色躲避对蓝色躲避：双方各自结算，无伤害"
      : result.toneResult !== 0
        ? `${toneLabel(leftCard.tone)} ${result.toneResult > 0 ? "克制" : "被克制于"} ${toneLabel(rightCard.tone)}`
        : `同类攻击比速度：${result.initiatorStats.speed} : ${result.responderStats.speed}`;
    elements.animationLayer.insertAdjacentHTML("beforeend", `<div class="contest-result"><small>${escapeHtml(compareText)}</small><strong>${escapeHtml(winnerText)}</strong></div>`);
    await delay(1500);

    await animateBattleShowcase(result);

    if (result.effects?.length) {
      const detail = result.effects.map((effect) => {
        const parts = [];
        if (effect.damage) parts.push(`造成 ${effect.damage} 点伤害`);
        if (effect.heal) parts.push(`恢复 ${effect.heal} 点生命`);
        if (effect.shield) parts.push(`获得 ${effect.shield} 点护盾`);
        if (effect.draw) parts.push(`抽 ${effect.draw} 张牌`);
        if (effect.charge) parts.push(`协奏区 +${effect.charge}`);
        if (effect.leaderBonus) parts.push(effect.leaderBonus);
        return `${game.players[effect.playerIndex].name}：${parts.join(" · ") || "无额外效果"}`;
      });
      elements.animationLayer.insertAdjacentHTML("beforeend", `<div class="effect-resolution"><b>效果结算</b><span>${escapeHtml(detail.join(" ／ "))}</span></div>`);
      await delay(1250);
    }
    hideAnimationScene();
    for (const effect of result.effects || []) await animateRoleTriggeredEffects(effect);
    for (const effect of result.effects || []) await commitAndAnimateDirectEffectResources(effect, "触发抽牌效果", "触发效果置入协奏区");
    for (const effect of result.effects || []) {
      await animateAndCommitEffectDamage(effect);
    }
    // 行动卡保留在行动区，回合结束阶段统一送入弃牌区。
  }

  function resetUtilityModal() {
    utilityModalMode = null;
    pendingDiscardRecovery = null;
    delete elements.responseOverlay.dataset.utilityMode;
    elements.confirmChoice.hidden = true;
    elements.confirmChoice.classList.add("hidden");
    elements.confirmChoice.disabled = false;
    elements.cancelChoice.hidden = true;
    elements.cancelChoice.classList.add("hidden");
    elements.passDefense.hidden = true;
    elements.responseSelectionDetail.innerHTML = '<div class="choice-effect-empty"><span>◇</span><p>选择一张卡牌后，这里会显示完整效果。</p></div>';
  }

  function awaitUtilityModal(mode) {
    utilityModalMode = mode;
    return new Promise((resolve) => { utilityModalResolver = resolve; });
  }

  function closeUtilityModal(resume = true) {
    elements.responseOverlay.classList.add("hidden");
    const resolve = utilityModalResolver;
    utilityModalResolver = null;
    resetUtilityModal();
    if (resume && resolve) resolve();
    return resolve;
  }

  function showViewHandChoice(choice) {
    resetUtilityModal();
    const cards = choice.cards || game.viewOpponentHand(choice.playerIndex);
    elements.responseOverlay.dataset.utilityMode = "view-hand";
    elements.responseEyebrow.textContent = "EFFECT RESOLUTION";
    elements.responseTitle.textContent = "「查看对方手牌」效果";
    elements.responseDetail.textContent = "以下仅展示给你。请点击下方“确认并继续结算”，不要直接关闭此窗口。";
    elements.responseCards.innerHTML = cards.length ? cards.map((card) => cardHtml(card, choice.opponentIndex, { response: true })).join("") : '<span class="empty-hand">对方没有手牌</span>';
    elements.confirmChoice.hidden = false;
    elements.confirmChoice.classList.remove("hidden");
    elements.confirmChoice.textContent = "确认并继续结算";
    elements.responseOverlay.classList.remove("hidden");
    requestAnimationFrame(() => elements.confirmChoice.focus());
    return awaitUtilityModal("view-hand");
  }

  function showAiViewHandChoice(choice) {
    resetUtilityModal();
    const cards = choice.cards || game.viewOpponentHand(choice.playerIndex);
    elements.responseOverlay.dataset.utilityMode = "view-hand";
    elements.responseEyebrow.textContent = "AI EFFECT RESOLUTION";
    elements.responseTitle.textContent = "AI 正在查看你的手牌";
    elements.responseDetail.textContent = "AI 的查看效果已展示。请点击下方“确认并继续结算”让对局继续。";
    elements.responseCards.innerHTML = cards.length ? cards.map((card) => cardHtml(card, choice.opponentIndex, { response: true })).join("") : '<span class="empty-hand">你没有手牌</span>';
    elements.confirmChoice.hidden = false;
    elements.confirmChoice.classList.remove("hidden");
    elements.confirmChoice.textContent = "确认并继续结算";
    elements.responseOverlay.classList.remove("hidden");
    requestAnimationFrame(() => elements.confirmChoice.focus());
    return awaitUtilityModal("view-hand");
  }

  function showPaymentChoice(choice) {
    resetUtilityModal();
    elements.responseEyebrow.textContent = "EFFECT CHOICE";
    elements.responseTitle.textContent = `「${choice.source}」的费用选择`;
    elements.responseDetail.textContent = choice.damageOnDecline
      ? `该对抗技能允许你支付 ${choice.cost} 点协奏费用；若不支付，你将受到 ${choice.damage} 点伤害。`
      : `该对抗技能允许你支付 ${choice.cost} 点协奏费用；支付后，你将受到 ${choice.damage} 点伤害。`;
    elements.responseCards.innerHTML = '<span class="empty-hand">请根据当前局势选择是否支付。</span>';
    elements.responseSelectionDetail.innerHTML = '<div class="choice-effect-empty"><span>◇</span><p>请根据当前局势选择是否支付协奏费用。</p></div>';
    elements.confirmChoice.hidden = false;
    elements.confirmChoice.classList.remove("hidden");
    elements.confirmChoice.textContent = `支付 ${choice.cost} 点费用`;
    elements.cancelChoice.hidden = false;
    elements.cancelChoice.classList.remove("hidden");
    elements.cancelChoice.textContent = "不支付";
    elements.responseOverlay.classList.remove("hidden");
    return awaitUtilityModal("payment");
  }

  function showDiscardRecoveryChoice(effect, operation) {
    const ownerIndex = operation.playerIndex;
    const cards = typeof game.deferredDiscardCandidates === "function" ? game.deferredDiscardCandidates(operation) : [];
    if (!cards.length) {
      if (operation.optional) game.chooseDeferredDiscardCard(operation, null);
      return Promise.resolve();
    }
    resetUtilityModal();
    pendingDiscardRecovery = { effect, operation };
    responseSelectedCardUid = null;
    utilityModalMode = "discard-recovery";
    elements.responseOverlay.dataset.utilityMode = "discard-recovery";
    const destination = operation.type === "discard-to-charge" ? "置入协奏区" : "加入手牌";
    elements.responseEyebrow.textContent = "DISCARD RECOVERY";
    elements.responseTitle.textContent = `「${effect.cardName}」：从弃牌区选择卡牌`;
    const renderChoices = () => {
      elements.responseCards.innerHTML = cards.map((card) => cardHtml(card, ownerIndex, { response: true, choiceSelected: card.uid === responseSelectedCardUid })).join("");
      elements.responseSelectionDetail.innerHTML = choiceEffectHtml(responseSelectedCardUid ? cards.find((card) => card.uid === responseSelectedCardUid) : null, ownerIndex, "选择一张符合条件的弃牌卡后，这里会显示其完整效果与补充属性。");
      elements.confirmChoice.disabled = !responseSelectedCardUid;
      elements.confirmChoice.textContent = `确认${destination}`;
      elements.responseDetail.textContent = `请选择 1 张${operation.type === "discard-normal-to-hand" ? "〈常态攻击〉" : ""}弃牌卡${destination}。${operation.optional ? "此效果可以取消。" : ""}`;
      elements.responseCards.querySelectorAll("[data-card]").forEach((button) => button.addEventListener("click", () => {
        responseSelectedCardUid = button.dataset.card;
        renderChoices();
      }));
    };
    elements.confirmChoice.hidden = false;
    elements.confirmChoice.classList.remove("hidden");
    elements.cancelChoice.hidden = !operation.optional;
    elements.cancelChoice.classList.toggle("hidden", !operation.optional);
    elements.cancelChoice.textContent = "取消此效果";
    renderChoices();
    elements.responseOverlay.classList.remove("hidden");
    return awaitUtilityModal("discard-recovery");
  }

  async function resolveDeferredDiscardRecovery(effect) {
    const operations = (effect?.deferred || []).filter((operation) => operation && !operation.committed && operation.choiceRequired && ["discard-to-charge", "discard-normal-to-hand"].includes(operation.type));
    for (const operation of operations) {
      const candidates = typeof game.deferredDiscardCandidates === "function" ? game.deferredDiscardCandidates(operation) : [];
      if (operation.playerIndex === 1) {
        if (candidates.length) {
          const selected = candidates.slice().sort((left, right) => operation.type === "discard-to-charge" ? aiCardScore(left) - aiCardScore(right) : aiCardScore(right) - aiCardScore(left))[0];
          game.chooseDeferredDiscardCard(operation, selected.uid);
        } else if (operation.optional) game.chooseDeferredDiscardCard(operation, null);
      } else await showDiscardRecoveryChoice(effect, operation);
    }
  }
  async function animateContestWithCost(result) {
    await animateContest(result);
    const viewChoices = (result.choices || []).filter((choice) => choice.type === "view-hand");
    for (const viewChoice of viewChoices) {
      if (viewChoice.playerIndex === 0) await showViewHandChoice(viewChoice);
      else await showAiViewHandChoice(viewChoice);
    }
    const payment = (result.paymentChoices || []).find((choice) => choice.payerIndex === 0);
    if (payment) await showPaymentChoice(payment);
    const aiPayment = (result.paymentChoices || []).find((choice) => choice.payerIndex === 1);
    if (aiPayment) {
      const paymentResult = game.resolvePaymentChoice(1, false);
      await animateAndCommitDamage(paymentResult.damageEvent, 1, paymentResult.damage || 0);
    }
    await resolveEffectDiscardFlow();
    if (result.pursuit?.playerIndex === 0) toast(result.pursuit.remaining === Infinity ? "红色行动卡胜利：可无限连击。" : `效果授予 ${result.pursuit.remaining} 次追击：只能连击红色行动卡。`);
  }

  async function resolveEffectDiscardFlow() {
    const pending = game?.pendingEffectDiscard;
    if (!pending) return false;
    if (pending.playerIndex === 1) {
      const cards = game.players[1].hand.slice().sort((a, b) => aiCardScore(a) - aiCardScore(b)).slice(0, pending.count);
      const result = game.discardForEffect(1, cards.map((card) => card.uid));
      if (!result.ok) return false;
      render();
      for (const card of cards) await animateCardTransfer(card, 1, `「${pending.source}」效果弃置`, "to-discard", 700);
      render();
      return game.pendingEffectDiscard ? resolveEffectDiscardFlow() : true;
    }
    interactionMode = "effect-discard";
    upgradeDiscardUids = [];
    selectedCardUid = null;
    uiLocked = false;
    render();
    resetUtilityModal();
    utilityModalMode = "effect-discard";
    elements.responseOverlay.dataset.utilityMode = "effect-discard";
    elements.responseEyebrow.textContent = "EFFECT DISCARD";
    elements.responseTitle.textContent = `「${pending.source}」：选择弃牌`;
    elements.responseDetail.textContent = `请选择 ${pending.count} 张手牌弃置；选中后点击“确认弃牌”继续结算。`;
    const renderDiscardChoices = () => {
      const latestUid = upgradeDiscardUids[upgradeDiscardUids.length - 1];
      elements.responseCards.innerHTML = game.players[0].hand.map((card) => cardHtml(card, 0, { response: true, choiceSelected: upgradeDiscardUids.includes(card.uid) })).join("") || '<span class="empty-hand">没有可弃置的手牌</span>';
      elements.responseSelectionDetail.innerHTML = choiceEffectHtml(latestUid ? game.findHandCard(0, latestUid) : null, 0, "选择一张要弃置的手牌后，这里会显示其完整效果。");
      elements.responseCards.querySelectorAll("[data-card]").forEach((button) => button.addEventListener("click", () => {
        const uid = button.dataset.card;
        if (upgradeDiscardUids.includes(uid)) upgradeDiscardUids = upgradeDiscardUids.filter((item) => item !== uid);
        else if (upgradeDiscardUids.length < pending.count) upgradeDiscardUids = [...upgradeDiscardUids, uid];
        else return toast(`本次只需选择 ${pending.count} 张弃牌`);
        renderDiscardChoices();
      }));
      elements.confirmChoice.disabled = upgradeDiscardUids.length !== pending.count;
      elements.confirmChoice.textContent = `确认弃牌（${upgradeDiscardUids.length}/${pending.count}）`;
      elements.responseDetail.textContent = `请选择 ${pending.count} 张手牌弃置；当前已选 ${upgradeDiscardUids.length}/${pending.count} 张。`;
    };
    elements.confirmChoice.hidden = false;
    elements.confirmChoice.classList.remove("hidden");
    renderDiscardChoices();
    elements.responseOverlay.classList.remove("hidden");
    return new Promise((resolve) => {
      effectDiscardResolver = () => resolve(game.pendingEffectDiscard ? resolveEffectDiscardFlow() : true);
    });
  }

  async function resolveHandLimitFlow() {
    if (game.phase !== "hand-limit" || (game.handLimitPlayer !== 0 && game.handLimitPlayer !== 1)) return false;
    const playerIndex = game.handLimitPlayer;
    const player = game.players[playerIndex];
    const needed = Math.max(0, player.hand.length - 8);
    if (!needed) return false;
    if (playerIndex === 0) {
      interactionMode = "hand-limit";
      upgradeDiscardUids = [];
      selectedCardUid = null;
      uiLocked = false;
      render();
      toast(`手牌超过上限：请选择 ${needed} 张手牌弃置后继续。`);
      return true;
    }
    const discards = player.hand.slice().sort((a, b) => aiCardScore(a) - aiCardScore(b)).slice(0, needed);
    const result = game.discardForHandLimit(1, discards.map((card) => card.uid));
    if (!result.ok) {
      toast(result.reason);
      return true;
    }
    render();
    for (const card of discards) await animateCardTransfer(card, 1, "AI 手牌上限弃置", "to-discard", 700);
    await animateTurnEndEffects(result.turnEndEffects);
    await animateTurnStartSequence();
    render();
    return true;
  }

  async function continueAfterContestResolution() {
    if (await resolveHandLimitFlow()) return;
    if (aiMayAct()) await runAiTurn();
  }

  async function animateContestDiscard(result) {
    const cards = [
      `<div>${cardHtml(result.initiatorCard, result.initiator, { response: true })}<small>进入弃牌区</small></div>`,
      result.responseCard ? `<div>${cardHtml(result.responseCard, result.responder, { response: true })}<small>进入弃牌区</small></div>` : "",
    ].join("");
    setAnimationScene(`<div class="discard-pair-scene"><p class="scene-kicker">RESOLUTION COMPLETE</p><h2>战斗卡进入弃牌区</h2><div class="discard-pair">${cards}</div></div>`, "discard-animation");
    await delay(250);
    elements.animationLayer.classList.add("animating");
    await delay(1150);
    hideAnimationScene();
  }

  function resourceHtml(player) {
    const chargedCards = player.chargeZone.length
      ? player.chargeZone.map((card) => {
        const art = actionArtPath(card.key || card.id);
        return `<span class="charge-card" title="${escapeHtml(card.name)}">${art ? `<img src="${escapeHtml(art)}" alt="${escapeHtml(card.name)}">` : escapeHtml(card.name.slice(0, 1))}</span>`;
      }).join("")
      : '<span class="charge-empty">暂无协奏牌</span>';
    const roleDeck = player.index === 0 ? `<div class="role-deck-slot"><button class="role-deck-button" type="button" data-role-deck-player="0" aria-label="查看角色牌库，剩余 ${player.roleDeck.length} 张"></button><span class="pile-caption">角色牌库 ${player.roleDeck.length}</span></div>` : "";
    return `<div class="resource-left-stack"><div class="cost-readout"><small>COST</small><strong>${player.energy}</strong><span>可用费用</span></div>${roleDeck}</div><div class="resonance-bay"><b>协奏区</b><div class="charge-cards">${chargedCards}</div></div>`;
  }

  function heroHtml(hero, index, player, interactive) {
    const active = index === player.activeHero;
    const selected = player.index === selectedHeroOwnerIndex && index === selectedHeroIndex;
    const choiceSelected = player.index === 0 && interactionMode === "upgrade-hero" && index === selectedHeroIndex;
    const faceArt = heroArtPath(hero);
    const stackedLevels = hero.stack.map((card) => `Lv.${card.level}`).join(" + ");
    const stackLayers = hero.stack.slice(0, -1).map((_, stackIndex) => `<i class="hero-stack-layer" style="--stack-index:${stackIndex + 1}"></i>`).join("");
    return `<button type="button" class="hero-card full-face-hero ${active ? "active" : ""} ${selected ? "selected" : ""} ${choiceSelected ? "choice-selected" : ""}" data-hero="${index}" data-hero-owner="${player.index}" ${interactive ? "" : "tabindex=\"-1\""} aria-label="${escapeHtml(hero.name)} ${escapeHtml(stackedLevels)}${active ? '，当前领队' : ''}"><span class="hero-stack-layers" aria-hidden="true">${stackLayers}</span><img class="hero-face-image" src="${escapeHtml(faceArt)}" alt="${escapeHtml(hero.name)} ${escapeHtml(stackedLevels)} 角色卡"><span class="hero-stack-count">${escapeHtml(stackedLevels)}</span></button>`;
  }
  function zoneHtml(player, interactive) {
    const hiddenHeroes = player.heroes.map(() => `
      <div class="hero-card facedown-card" aria-label="盖放的角色牌"></div>`).join("");
    const showHeroes = game.heroesRevealed || player.index === 0;
    return `
      <div class="identity-panel">
        <div class="portrait-orb">${player.index === 0 ? "巡" : "敌"}</div>
        <div>
          ${player.index === 1 ? `<p class="opponent-hand-count">手牌 ${player.hand.length} / 8</p>` : ""}<p class="eyebrow">${player.index === 0 ? "PLAYER" : "OPPONENT"}</p>
          <h2>${escapeHtml(player.name)}</h2>
          <div class="life-readout"><strong>${player.hp}</strong><small>/ 20 HP</small></div>
        </div>
        <div class="shield-readout"><strong>${player.shield}</strong><small>SHIELD // 护盾</small></div>
        <div class="resource-strip">${resourceHtml(player)}</div>
      </div>
      <div class="hero-line">${showHeroes ? (() => { const active = player.activeHero; const entries = player.heroes.map((hero, index) => ({ hero, index })).filter(({ index }) => index !== active); entries.splice(1, 0, { hero: player.heroes[active], index: active }); return entries.map(({ hero, index }) => heroHtml(hero, index, player, interactive)).join(""); })() : hiddenHeroes}</div>
      `;
  }

  function renderRoleDeckViewer() {
    if (!game || !elements.roleDeckCards) return;
    const player = game.players[roleDeckViewer.playerIndex];
    const isDiscard = roleDeckViewer.pile === "discard";
    const cards = isDiscard ? player?.discard || [] : player?.roleDeck || [];
    const selected = cards.find((card) => card.id === roleDeckViewer.cardId) || cards[0];
    roleDeckViewer.cardId = selected?.id || null;
    elements.roleDeckTitle.textContent = isDiscard ? "我的弃牌区" : `${player?.name || ""}的角色牌库`;
    elements.roleDeckLead.textContent = cards.length ? `${isDiscard ? "弃牌区共有" : "剩余"} ${cards.length} 张${isDiscard ? "行动卡" : "角色牌"}。点击左侧预览，在右侧查看完整效果。` : `该${isDiscard ? "弃牌区" : "角色牌库"}暂无可查看的卡牌。`;
    elements.roleDeckCards.innerHTML = cards.length ? cards.map((card) => {
      const art = cardArtPath(card.art);
      const cardBadge = isDiscard ? `COST ${card.cost ?? 0}` : `Lv.${card.level ?? 0}`;
      return `<button type="button" class="role-deck-card ${card.id === selected?.id ? "selected" : ""}" data-role-deck-card="${escapeHtml(card.id)}"><span>${escapeHtml(cardBadge)}</span>${art ? `<img src="${escapeHtml(art)}" alt="${escapeHtml(card.name)}">` : "<i>暂无卡面</i>"}<b>${escapeHtml(card.name)}</b></button>`;
    }).join("") : `<p class="empty-hand">暂无可查看的${isDiscard ? "弃牌" : "角色牌"}。</p>`;
    if (!selected) { elements.roleDeckDetail.innerHTML = ""; return; }
    const art = cardArtPath(selected.art);
    const typeText = isDiscard ? `${selected.category || "行动卡"} · COST ${selected.cost ?? 0}` : `角色牌 · Lv.${selected.level ?? 0}`;
    elements.roleDeckDetail.innerHTML = `${art ? `<img src="${escapeHtml(art)}" alt="${escapeHtml(selected.name)}完整卡面">` : ""}<div><p class="eyebrow">${escapeHtml(typeText)}</p><h3>${escapeHtml(selected.name)}</h3><p class="role-deck-effect">${escapeHtml(selected.text || "暂无额外文字效果。").replace(/\n/g, "<br>")}</p></div>`;
    elements.roleDeckCards.querySelectorAll("[data-role-deck-card]").forEach((button) => button.addEventListener("click", () => {
      roleDeckViewer.cardId = button.dataset.roleDeckCard;
      renderRoleDeckViewer();
    }));
  }

  function openRoleDeck(playerIndex) {
    roleDeckViewer = { playerIndex: Number(playerIndex), cardId: null, pile: "role" };
    renderRoleDeckViewer();
    elements.roleDeckOverlay.classList.remove("hidden");
  }

  function renderZones() {
    elements.aiZone.innerHTML = zoneHtml(game.players[1], true);
    elements.playerZone.innerHTML = zoneHtml(game.players[0], true);
    [elements.aiZone, elements.playerZone].forEach((zone) => zone.querySelectorAll("[data-role-deck-player]").forEach((button) => {
      button.addEventListener("click", () => openRoleDeck(button.dataset.roleDeckPlayer));
    }));
    elements.aiZone.querySelectorAll("[data-hero]").forEach((button) => {
      button.addEventListener("click", () => {
        if (uiLocked) return;
        selectedHeroOwnerIndex = 1;
        selectedHeroIndex = Number(button.dataset.hero);
        selectedCardUid = null;
        render();
      });
    });
    elements.playerZone.querySelectorAll("[data-hero]").forEach((button) => {
      button.addEventListener("click", () => {
        if (uiLocked) return;
        selectedHeroOwnerIndex = 0;
        selectedHeroIndex = Number(button.dataset.hero);
        // 普通查看时，角色与手牌只能选中其一，避免旧手牌遮住角色的叠放技能预览。
        if (interactionMode !== "upgrade-card" && interactionMode !== "hand-limit") selectedCardUid = null;
        if (interactionMode === "upgrade-hero" || interactionMode === "upgrade-branch" || interactionMode === "upgrade-card") {
          const hero = game.players[0].heroes[selectedHeroIndex];
          if (hero.level >= 2) return toast("该角色已经达到 Lv.2");
          // 升级过程中允许改选另一名角色；之前勾选的弃牌必须重置，避免把代价错付给新目标。
          upgradeHeroIndex = selectedHeroIndex;
          const candidates = upgradeCandidates(0, upgradeHeroIndex);
          upgradeRoleCardId = candidates.length === 1 ? candidates[0].id : null;
          interactionMode = candidates.length > 1 ? "upgrade-branch" : "upgrade-card";
          selectedCardUid = null;
          upgradeDiscardUids = [];
        }
        render();
      });
    });
  }

  function renderDecks() {
    const block = (player, showDiscard) => `<div class="pile-group"><div class="pile-slot"><div class="deck-stack" aria-hidden="true"></div><span class="pile-caption">牌库 ${player.deck.length}</span></div>${showDiscard ? `<div class="pile-slot"><button class="discard-stack" type="button" data-discard-player="${player.index}" aria-label="查看弃牌区，共 ${player.discard.length} 张"></button><span class="pile-caption">弃牌 ${player.discard.length}</span></div>` : ""}</div>`;
    elements.aiDeck.innerHTML = block(game.players[1], false);
    elements.playerDeck.innerHTML = block(game.players[0], true);
    elements.playerDeck.querySelectorAll("[data-discard-player]").forEach((button) => button.addEventListener("click", () => {
      roleDeckViewer = { playerIndex: 0, cardId: null, pile: "discard" };
      renderRoleDeckViewer();
      elements.roleDeckOverlay.classList.remove("hidden");
    }));
  }

  function renderArenaContestStage() {
    if (!game.pending) {
      elements.arenaContestStage.className = "arena-contest-stage hidden";
      elements.arenaContestStage.innerHTML = "";
      return;
    }
    const initiator = game.pending.initiator;
    const responder = game.pending.responder;
    elements.arenaContestStage.className = "arena-contest-stage";
    elements.arenaContestStage.innerHTML = `
      <div class="arena-contest-label">中央战斗区</div>
      <div class="arena-contest-cards">
        <div class="arena-contest-slot active-slot">
          <span>${escapeHtml(game.players[initiator].name)}</span>
          <div class="arena-card-back" aria-label="已盖牌"></div>
        </div>
        <strong>VS</strong>
        <div class="arena-contest-slot waiting-slot">
          <span>${escapeHtml(game.players[responder].name)}</span>
          <div class="arena-card-empty"><b>+</b><small>等待盖牌</small></div>
        </div>
      </div>`;
  }

  function renderHand() {
    const player = game.players[0];
    elements.handCount.textContent = player.hand.length;
    if (!player.hand.length) {
      elements.hand.innerHTML = '<span class="empty-hand">手牌已空</span>';
      return;
    }
    elements.hand.innerHTML = player.hand.map((card) => cardHtml(card, 0)).join("");
    elements.hand.querySelectorAll("[data-card]").forEach((button) => {
      button.addEventListener("click", () => {
        if (uiLocked) return;
        if (interactionMode === "upgrade-card" || interactionMode === "hand-limit") {
          const uid = button.dataset.card;
          if (upgradeDiscardUids.includes(uid)) {
            upgradeDiscardUids = upgradeDiscardUids.filter((item) => item !== uid);
          } else {
            const required = interactionMode === "upgrade-card"
              ? selectedUpgradeCandidate(0, upgradeHeroIndex)?.level || 0
              : Math.max(0, player.hand.length - 8);
            if (upgradeDiscardUids.length >= required) return toast(`本次只需选择 ${required} 张弃牌；如需更换，请先取消已选卡。`);
            upgradeDiscardUids = [...upgradeDiscardUids, uid];
          }
          render();
          return;
        }
        if (interactionMode === "charge-select" || interactionMode === "battle-select") {
          selectedCardUid = selectedCardUid === button.dataset.card ? null : button.dataset.card;
          selectedHeroIndex = null;
          selectedHeroOwnerIndex = 0;
          render();
          return;
        }
        selectedCardUid = selectedCardUid === button.dataset.card ? null : button.dataset.card;
        selectedHeroIndex = null;
        selectedHeroOwnerIndex = 0;
        render();
      });
    });
  }

  function cancelUpgrade() {
    interactionMode = null;
    upgradeHeroIndex = null;
    upgradeRoleCardId = null;
    upgradeDiscardUids = [];
    selectedCardUid = null;
    render();
  }

  function renderUpgradeGuide() {
    elements.upgradeGuide.classList.add("hidden");
  }

  function renderActionSelectionModal() {
    const actionModes = ["charge-select", "upgrade-hero", "upgrade-branch", "upgrade-card", "switch-select", "battle-select", "pursuit-select"];
    const active = actionModes.includes(interactionMode);
    elements.actionSelectOverlay.classList.toggle("hidden", !active);
    if (!active) return;
    const player = game.players[0];
    const setEffect = (html) => { elements.actionSelectEffect.innerHTML = html; };
    const bindCards = (cards, multi = false) => elements.actionSelectCards.querySelectorAll("[data-card]").forEach((button) => button.addEventListener("click", () => {
      const uid = button.dataset.card;
      if (!cards.some((card) => card.uid === uid)) return;
      if (multi) {
        const required = selectedUpgradeCandidate(0, upgradeHeroIndex)?.level || 0;
        if (upgradeDiscardUids.includes(uid)) upgradeDiscardUids = upgradeDiscardUids.filter((item) => item !== uid);
        else if (upgradeDiscardUids.length < required) upgradeDiscardUids = [...upgradeDiscardUids, uid];
        else return toast(`本次只需选择 ${required} 张弃牌；如需更换，请先取消已选卡。`);
      } else selectedCardUid = selectedCardUid === uid ? null : uid;
      render();
    }));
    const singleCardView = (cards) => cards.map((card) => cardHtml(card, 0, { response: true, choiceSelected: card.uid === selectedCardUid })).join("") || '<p class="empty-choice">当前没有可选择的卡牌。</p>';
    if (interactionMode === "charge-select") {
      elements.actionSelectEyebrow.textContent = "RESONANCE CHARGE";
      elements.actionSelectTitle.textContent = "选择要充能的手牌";
      elements.actionSelectDetail.textContent = "请选择 1 张手牌放入协奏区。确认后，它会正面朝上提供 1 点 COST。";
      elements.actionSelectCards.innerHTML = player.hand.map((card) => cardHtml(card, 0, { response: true, ignoreCost: true, choiceSelected: card.uid === selectedCardUid })).join("") || '<p class="empty-choice">当前没有可选择的卡牌。</p>';
      elements.actionSelectConfirm.textContent = "确认充能";
      elements.actionSelectCancel.textContent = "取消";
      elements.actionSelectConfirm.disabled = !selectedCardUid;
      setEffect(choiceEffectHtml(selectedCard(), 0, "选择一张手牌后，这里会显示其完整效果。"));
      bindCards(player.hand);
      return;
    }
    if (interactionMode === "upgrade-hero") {
      const options = player.heroes.map((hero, index) => ({ hero, index, candidate: game.upgradeOptions(0, index).sort((a, b) => b.level - a.level)[0] })).filter((item) => item.candidate);
      elements.actionSelectEyebrow.textContent = "CHARACTER UPGRADE";
      elements.actionSelectTitle.textContent = "选择要升级的角色";
      elements.actionSelectDetail.textContent = "选择一名尚可升级的角色；确认后再选择对应数量的手牌作为弃牌代价。";
      elements.actionSelectCards.innerHTML = options.length ? `<div class="action-choice-heroes">${options.map(({ hero, index }) => heroHtml(hero, index, player, true)).join("")}</div>` : '<p class="empty-choice">当前没有可升级的角色。</p>';
      elements.actionSelectConfirm.textContent = "确认角色";
      elements.actionSelectCancel.textContent = "取消";
      elements.actionSelectConfirm.disabled = upgradeHeroIndex == null;
      setEffect(heroChoiceEffectHtml(upgradeHeroIndex == null ? null : player.heroes[upgradeHeroIndex], 0, "选择要升级的角色后，这里会显示其已叠放的完整效果。", upgradeHeroIndex));
      elements.actionSelectCards.querySelectorAll("[data-hero]").forEach((button) => button.addEventListener("click", () => {
        upgradeHeroIndex = Number(button.dataset.hero);
        selectedHeroOwnerIndex = 0;
        selectedHeroIndex = upgradeHeroIndex;
        render();
      }));
      return;
    }
    if (interactionMode === "upgrade-branch") {
      const hero = player.heroes[upgradeHeroIndex];
      const candidates = upgradeCandidates(0, upgradeHeroIndex);
      elements.actionSelectEyebrow.textContent = "UPGRADE BRANCH";
      elements.actionSelectTitle.textContent = `选择 ${hero?.name || "角色"} 的升级分支`;
      elements.actionSelectDetail.textContent = "同等级角色牌的效果不同；请选择本次要叠放的其中一张。";
      elements.actionSelectCards.innerHTML = candidates.length ? candidates.map((card) => roleCardChoiceHtml(card, card.id === upgradeRoleCardId)).join("") : '<p class="empty-choice">当前没有可选择的升级角色卡。</p>';
      elements.actionSelectConfirm.textContent = "确认角色牌";
      elements.actionSelectCancel.textContent = "取消";
      elements.actionSelectConfirm.disabled = !selectedUpgradeCandidate(0, upgradeHeroIndex);
      setEffect(roleCardChoiceEffectHtml(selectedUpgradeCandidate(0, upgradeHeroIndex)));
      elements.actionSelectCards.querySelectorAll("[data-upgrade-role-card]").forEach((button) => button.addEventListener("click", () => {
        upgradeRoleCardId = button.dataset.upgradeRoleCard;
        upgradeDiscardUids = [];
        render();
      }));
      return;
    }
    if (interactionMode === "upgrade-card") {
      const hero = player.heroes[upgradeHeroIndex];
      const candidate = selectedUpgradeCandidate(0, upgradeHeroIndex);
      const required = candidate?.level || 0;
      elements.actionSelectEyebrow.textContent = "UPGRADE COST";
      elements.actionSelectTitle.textContent = `升级 ${hero.name} 至 Lv.${candidate?.level ?? "?"}`;
      elements.actionSelectDetail.textContent = `请选择 ${required} 张手牌弃置：已选 ${upgradeDiscardUids.length}/${required}。`;
      elements.actionSelectCards.innerHTML = player.hand.map((card) => cardHtml(card, 0, { response: true, ignoreCost: true, choiceSelected: upgradeDiscardUids.includes(card.uid) })).join("") || '<p class="empty-choice">手牌不足，无法支付升级代价。</p>';
      elements.actionSelectConfirm.textContent = "确认升级";
      elements.actionSelectCancel.textContent = "取消";
      elements.actionSelectConfirm.disabled = !candidate || upgradeDiscardUids.length !== required;
      const latestUid = upgradeDiscardUids[upgradeDiscardUids.length - 1];
      setEffect(choiceEffectHtml(latestUid ? game.findHandCard(0, latestUid) : null, 0, "选择一张升级代价后，这里会显示其完整效果。"));
      bindCards(player.hand, true);
      return;
    }
    if (interactionMode === "switch-select") {
      const options = player.heroes.map((hero, index) => ({ hero, index })).filter(({ index }) => index !== player.activeHero);
      elements.actionSelectEyebrow.textContent = "LEADER SWITCH";
      elements.actionSelectTitle.textContent = "选择新的领队";
      elements.actionSelectDetail.textContent = "请选择一名后台角色，确认后才会更换领队。";
      elements.actionSelectCards.innerHTML = options.length ? `<div class="action-choice-heroes">${options.map(({ hero, index }) => heroHtml(hero, index, player, true)).join("")}</div>` : '<p class="empty-choice">当前没有可切换的后台角色。</p>';
      elements.actionSelectConfirm.textContent = "确认更换领队";
      elements.actionSelectCancel.textContent = "取消";
      elements.actionSelectConfirm.disabled = selectedHeroIndex == null || selectedHeroIndex === player.activeHero;
      setEffect(heroChoiceEffectHtml(selectedHeroIndex == null ? null : player.heroes[selectedHeroIndex], 0, "选择一名后台角色后，这里会显示其完整效果。", selectedHeroIndex));
      elements.actionSelectCards.querySelectorAll("[data-hero]").forEach((button) => button.addEventListener("click", () => {
        selectedHeroOwnerIndex = 0;
        selectedHeroIndex = Number(button.dataset.hero);
        render();
      }));
      return;
    }
    const pursuit = interactionMode === "pursuit-select";
    const legal = pursuit ? game.legalPursuitCards(0) : game.legalContestCards(0);
    elements.actionSelectEyebrow.textContent = pursuit ? "PURSUIT" : "BATTLE PHASE";
    elements.actionSelectTitle.textContent = pursuit ? "选择红色追击牌" : "选择本次战斗行动卡";
    elements.actionSelectDetail.textContent = pursuit ? "请选择 1 张可用的红色行动卡发动追击；也可取消追击并结束当前追击阶段。" : "请选择 1 张满足费用和条件的手牌，确认后将背面朝上盖放。";
    elements.actionSelectCards.innerHTML = singleCardView(legal);
    elements.actionSelectConfirm.textContent = pursuit ? "确认追击" : "确认进入战斗";
    elements.actionSelectCancel.textContent = pursuit ? "取消追击" : "取消";
    elements.actionSelectConfirm.disabled = !selectedCardUid || !legal.some((card) => card.uid === selectedCardUid);
    setEffect(choiceEffectHtml(selectedCard(), 0, pursuit ? "选择一张红色追击牌后，这里会显示其完整效果。" : "选择一张行动卡后，这里会显示其完整效果。"));
    bindCards(legal);
  }

  function selectedCard() {
    return selectedCardUid ? game.findHandCard(0, selectedCardUid) : null;
  }

  function renderSelection() {
    const card = selectedCard();
    const heroOwner = selectedHeroOwnerIndex === 1 ? game.players[1] : game.players[0];
    const hero = selectedHeroIndex == null ? null : heroOwner.heroes[selectedHeroIndex];
    if (card) {
      const metrics = [];
      const stats = game.cardStats(0, card);
      const attributes = cardSupplementalAttributeText(card);
      if (card.kind === "attack") metrics.push(`速度 ${stats.speed} · 攻击 ${stats.attack}`);
    if (card.kind === "dodge" && stats.attack) metrics.push(`攻击 ${stats.attack}`);
      if (card.heal) metrics.push(`治疗 ${card.heal}`);
      elements.selection.classList.remove("empty");
      elements.selection.innerHTML = `<div class="preview-card" style="--tone-color:${toneStyle(card.tone)}">
        <span class="tone-tag">${escapeHtml(toneLabel(card.tone))} // ${escapeHtml(kindLabel(card.kind))}</span>
        <h3>${escapeHtml(card.name)}</h3>
        <span class="cost-line">COST ${game.cardCost(0, card)} ${metrics.length ? `// ${escapeHtml(metrics.join(" · "))}` : ""}</span>
        <p class="description">${escapeHtml(attributes)}</p>
        <p class="description">${escapeHtml(card.text || "")}</p>
      </div>`;
      return;
    }
    if (hero) {
      const stackedEffects = hero.stack.map((roleCard) => `<li><b>Lv.${roleCard.level}</b><span>${escapeHtml(roleCard.text || "该等级没有额外文字效果。")}</span></li>`).join("");
      const attributes = cardSupplementalAttributeText(hero.stack[hero.stack.length - 1]);
      elements.selection.classList.remove("empty");
      elements.selection.innerHTML = `<div class="preview-card" style="--tone-color:${toneStyle(hero.passiveTone)}">
        <span class="tone-tag">${escapeHtml(toneLabel(hero.passiveTone))} // ${heroOwner.index === 0 ? "己方角色技能" : "对方角色技能"}</span>
        <h3>${escapeHtml(hero.name)} · Lv.${hero.level}</h3>
        <span class="cost-line">${heroOwner.index === 1 ? "对方" : "己方"}已叠放 ${hero.stack.length} 张角色卡${selectedHeroIndex === heroOwner.activeHero ? " // 当前领队" : " // 后台角色"}</span>
        <p class="description">${escapeHtml(attributes)}</p>
        <ul class="stack-effects">${stackedEffects}</ul>
      </div>`;
      return;
    }
    elements.selection.classList.add("empty");
    elements.selection.innerHTML = '<span class="empty-glyph">◇</span><p>点击手牌或角色</p>';
  }

  function renderActions() {
    const human = game.players[0];
    const card = selectedCard();
    const canAct = game.canAct(0) && !aiRunning && !uiLocked;
    const canTakeMainAction = game.canTakeMainAction(0) && !aiRunning && !uiLocked;
    const pursuing = game.phase === "pursuit" && game.pursuit?.playerIndex === 0 && !aiRunning && !uiLocked;
    const postBattleEnd = game.phase === "post-battle" && game.activePlayer === 0;
    const used = [human.chargedThisTurn, human.upgradedThisTurn, human.switchedThisTurn].filter(Boolean).length;
    elements.resonanceBadge.textContent = pursuing ? "追击中" : postBattleEnd ? "等待结束回合" : canTakeMainAction ? `已用 ${used}/3` : canAct ? "可行动" : "等待";
    elements.resonanceBadge.classList.toggle("used", used === 3);
    const upgrading = interactionMode === "upgrade-hero" || interactionMode === "upgrade-branch" || interactionMode === "upgrade-card";
    const actionSelecting = interactionMode === "charge-select" || interactionMode === "battle-select" || interactionMode === "switch-select";
    const handLimit = interactionMode === "hand-limit";
    const effectDiscard = interactionMode === "effect-discard";
    elements.upgrade.querySelector("b").textContent = upgrading ? "取消升级" : "升级";
    elements.upgrade.querySelector("small").textContent = interactionMode === "upgrade-hero"
      ? "请从场上选择要升级的角色"
      : interactionMode === "upgrade-branch"
        ? "请选择要叠放的角色牌分支"
      : interactionMode === "upgrade-card"
        ? `请选择 ${selectedUpgradeCandidate(0, upgradeHeroIndex)?.level ?? 0} 张手牌，再点击升级确认`
        : "先选角色，再选择弃牌代价";
    elements.charge.querySelector("b").textContent = interactionMode === "charge-select" ? "取消充能" : "充能";
    elements.charge.querySelector("small").textContent = interactionMode === "charge-select" ? "请单独选择手牌后确认" : "选择 1 张手牌放入协奏区";
    elements.charge.disabled = !(tutorialAllows("charge") && canTakeMainAction && !upgrading && !human.chargedThisTurn);
    elements.upgrade.disabled = !(tutorialAllows("upgrade") && canTakeMainAction && !actionSelecting && (upgrading || (!human.upgradedThisTurn && human.hand.length && human.heroes.some((hero) => hero.level < 2))));
    elements.switch.querySelector("b").textContent = interactionMode === "switch-select" ? "取消更换" : "更换领队";
    elements.switch.querySelector("small").textContent = interactionMode === "switch-select" ? "请在弹窗中选择并确认新的领队" : "在弹窗中选择后台角色后确认";
    elements.switch.disabled = !(tutorialAllows("switch") && canTakeMainAction && !upgrading && !actionSelecting && !human.switchedThisTurn);
    const pursuitAllowed = pursuing && tutorialAllows("pursuit") && card && game.legalPursuitCards(0).some((item) => item.uid === card.uid);
    const legalPursuitCards = pursuing ? game.legalPursuitCards(0) : [];
    const pursuitGuidance = pursuing ? (legalPursuitCards.length ? "play" : "stop") : null;
    elements.play.querySelector("b").textContent = pursuing ? "继续红色连击" : interactionMode === "battle-select" ? "取消战斗选择" : "进入战斗";
    elements.play.querySelector("small").textContent = pursuing ? "只能打出红色行动卡，费用须足够" : interactionMode === "battle-select" ? "请单独选择手牌后确认" : "双方同时翻牌后才扣除费用";
    elements.endTurn.querySelector("b").textContent = (handLimit || effectDiscard) ? "确认弃牌" : pursuing ? "停止追击" : "结束回合";
    elements.endTurn.querySelector("small").textContent = effectDiscard ? `还需弃置 ${game.pendingEffectDiscard?.count ?? 0} 张手牌` : handLimit ? `还需弃置 ${Math.max(0, human.hand.length - 8)} 张手牌` : pursuing ? "结束本次连续攻击" : postBattleEnd ? "所有效果已结算，确认后交给对手" : "跳过战斗，交给对手";
    elements.play.disabled = !(pursuitAllowed || (tutorialAllows("battle") && canTakeMainAction && !upgrading && (interactionMode === "battle-select" || game.legalContestCards(0).length > 0)));
    elements.endTurn.disabled = effectDiscard ? upgradeDiscardUids.length !== (game.pendingEffectDiscard?.count ?? 0) : handLimit ? upgradeDiscardUids.length !== Math.max(0, human.hand.length - 8) : !(postBattleEnd || (tutorialAllows(pursuing ? "pursuit" : "end") && (canAct || pursuing)));
    elements.play.classList.toggle("pursuit-guided", pursuing && pursuitGuidance === "play");
    elements.endTurn.classList.toggle("pursuit-guided", pursuing && pursuitGuidance === "stop");
    if (pursuing && pursuitGuidance === "play") elements.play.querySelector("small").textContent = `有 ${legalPursuitCards.length} 张可用红色牌：选择后点击追击`;
    if (pursuing && pursuitGuidance === "stop") elements.endTurn.querySelector("small").textContent = legalPursuitCards.length ? "已完成一次追击，点击结束本次连续攻击" : "没有可用红色追击牌，点击结束本次连续攻击";
  }

  function renderLogs() {
    const cardsByName = new Map();
    (CARD_LIBRARY?.cards || []).forEach((card) => {
      if (card?.name && !cardsByName.has(card.name)) cardsByName.set(card.name, card);
    });
    elements.logs.innerHTML = game.logs.slice(0, 24).map((entry) => {
      let message = escapeHtml(entry.message);
      [...cardsByName.entries()].sort(([a], [b]) => b.length - a.length).forEach(([name, card]) => {
        const pattern = escapeHtml(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        message = message.replace(new RegExp(pattern, "g"), `<button type="button" class="log-card-name" data-log-card="${escapeHtml(card.id)}">${escapeHtml(name)}</button>`);
      });
      return `<div class="log-entry ${escapeHtml(entry.type)}">${message}</div>`;
    }).join("");
    elements.logs.querySelectorAll("[data-log-card]").forEach((trigger) => {
      const show = () => showLogCardTooltip(trigger.dataset.logCard, trigger);
      trigger.addEventListener("mouseenter", show);
      trigger.addEventListener("focus", show);
      trigger.addEventListener("mouseleave", hideLogCardTooltip);
      trigger.addEventListener("blur", hideLogCardTooltip);
    });
  }

  function hideLogCardTooltip() {
    elements.logCardTooltip.classList.add("hidden");
    elements.logCardTooltip.innerHTML = "";
  }

  function showLogCardTooltip(cardId, anchor) {
    const card = (CARD_LIBRARY?.cards || []).find((item) => item.id === cardId);
    if (!card) return hideLogCardTooltip();
    const art = cardArtPath(card.art);
    elements.logCardTooltip.innerHTML = `${art ? `<img src="${escapeHtml(art)}" alt="${escapeHtml(card.name)}卡面">` : ""}<div><p>${escapeHtml(card.category || "行动卡")}</p><h3>${escapeHtml(card.name)}</h3><small>COST ${card.cost ?? 0}${card.attack != null ? ` · 攻击 ${card.attack}` : ""}${card.speed != null ? ` · 速度 ${card.speed}` : ""}</small><strong>效果</strong><span>${escapeHtml(card.text || "暂无额外文字效果。").replace(/\n/g, "<br>")}</span></div>`;
    elements.logCardTooltip.classList.remove("hidden");
    const rect = anchor.getBoundingClientRect();
    const tooltip = elements.logCardTooltip.getBoundingClientRect();
    elements.logCardTooltip.style.top = `${Math.min(window.innerHeight - tooltip.height - 14, Math.max(14, rect.top))}px`;
    elements.logCardTooltip.style.left = `${Math.min(window.innerWidth - tooltip.width - 14, Math.max(14, rect.right + 10))}px`;
  }

  function renderStatus() {
    elements.turnNumber.textContent = String(game.turn).padStart(2, "0");
    elements.turnOwner.textContent = game.winner != null
      ? "对局已结束"
      : game.setupPhase ? "准备阶段" : game.activePlayer === 0 ? "你的回合" : aiThinkingLabel;
    const activeTrackPhase = game.winner != null ? "end"
      : game.setupPhase ? "draw"
        : game.phase === "main" ? "main"
          : ["contest", "pursuit", "choice"].includes(game.phase) ? "battle" : "end";
    document.querySelectorAll(".battlefield-turn-card [data-phase]").forEach((phase) => {
      phase.classList.toggle("active", phase.dataset.phase === activeTrackPhase);
    });
    if (game.pendingEffectDiscard) {
      const pending = game.pendingEffectDiscard;
      elements.statusTitle.textContent = "等待弃置手牌";
      elements.statusDetail.textContent = `「${pending.source}」已抽牌，请选择 ${pending.count} 张手牌弃置后再进入下一回合。`;
    } else if (game.pending) {
      elements.statusTitle.textContent = "双方正在盖牌";
      elements.statusDetail.textContent = "选择一张手牌后同时翻开";
    } else if (game.setupPhase) {
      elements.statusTitle.textContent = "暗置角色牌";
      elements.statusDetail.textContent = game.firstPlayer == null ? `抛硬币结果：${game.coinWinner === 0 ? "你" : "AI"} 获胜；等待选择先手或后手` : `抛硬币：${game.players[game.firstPlayer].name} 先手；请选择我方领队`;
    } else if (game.winner != null) {
      elements.statusTitle.textContent = game.winner === 0 ? "共鸣胜利" : "共鸣断绝";
      elements.statusDetail.textContent = `${game.players[game.winner].name} 赢得了对局`;
    } else if (game.phase === "pursuit") {
      const name = game.players[game.pursuit.playerIndex].name;
      elements.statusTitle.textContent = `${name} 正在连击`;
      elements.statusDetail.textContent = game.pursuit.remaining === Infinity ? "红色行动卡获胜，可无限连击；可随时停止。" : `效果授予剩余 ${game.pursuit.remaining} 次追击，只能连击红色行动卡。`;
    } else if (game.phase === "post-battle") {
      const owner = game.players[game.activePlayer];
      elements.statusTitle.textContent = `${owner.name} 的战斗结算完成`;
      elements.statusDetail.textContent = game.activePlayer === 0 ? "所有效果已依次结算；本回合不能再行动，请点击“结束回合”。" : "所有效果已依次结算；AI 将结束本回合。";
    } else if (game.activePlayer === 0) {
      elements.statusTitle.textContent = interactionMode === "charge-select" ? "选择充能手牌" : interactionMode === "battle-select" ? "选择战斗行动卡" : interactionMode === "upgrade-hero" ? "选择升级角色" : interactionMode === "upgrade-branch" ? "选择升级分支" : interactionMode === "upgrade-card" ? "选择弃置手牌" : "主要阶段";
      elements.statusDetail.textContent = interactionMode === "charge-select"
        ? "选择 1 张手牌后，在中间确认框确认充能"
        : interactionMode === "battle-select"
          ? "选择 1 张行动卡后，在中间确认框确认盖放"
        : interactionMode === "upgrade-hero"
        ? "领队或后台角色都可以升级"
        : interactionMode === "upgrade-branch"
        ? "请选择要叠放的同等级角色牌"
        : interactionMode === "upgrade-card"
          ? `为展示的角色卡选择对应等级数量的弃牌代价`
          : "充能、升级、更换领队各可一次；也可战斗或直接结束";
    } else {
      elements.statusTitle.textContent = aiThinkingLabel;
      elements.statusDetail.textContent = aiService.configured ? "DeepSeek 正根据公开局面和合法动作决策" : "对手使用本地规则 AI 决策";
    }
  }

  function renderSetup() {
    if (!game.setupPhase || !elements.mainMenuOverlay.classList.contains("hidden")) {
      elements.setupOverlay.classList.add("hidden");
      return;
    }
    elements.setupOverlay.classList.remove("hidden");
    const humanWonCoin = game.coinWinner === 0;
    const opponentName = game.players[1].name;
    elements.coinResult.textContent = game.firstPlayer == null ? `抛硬币结果：${humanWonCoin ? "你" : opponentName} 获胜；${humanWonCoin ? "请选择先手或后手" : `${opponentName} 正在选择`}` : `先后手：${game.firstPlayer === 0 ? "你先手" : `${opponentName} 先手`}`;
    elements.initiativeChoices.hidden = !humanWonCoin || game.firstPlayer != null;
    const previewHero = setupSelectionPreview.type === "hero" ? game.players[0].heroes[setupSelectionPreview.value] : null;
    const previewCard = setupSelectionPreview.type === "card" ? game.findHandCard(0, setupSelectionPreview.value) : null;
    elements.setupSelectionDetail.innerHTML = previewCard
      ? choiceEffectHtml(previewCard, 0)
      : heroChoiceEffectHtml(previewHero || game.players[0].heroes[selectedHeroIndex ?? 0], 0, "选择领队或起始手牌后，这里会显示完整效果。", setupSelectionPreview.type === "hero" ? setupSelectionPreview.value : selectedHeroIndex);
    elements.setupHeroes.innerHTML = game.players[0].heroes.map((hero, index) => heroHtml(hero, index, game.players[0], true)).join("");
    elements.setupMulliganCards.innerHTML = game.players[0].hand.map((card) => cardHtml(card, 0, { setupMulligan: true })).join("");
    elements.setupMulliganCards.querySelectorAll("[data-setup-mulligan]").forEach((button) => button.addEventListener("click", () => { const uid = button.dataset.setupMulligan; setupMulliganUids = setupMulliganUids.includes(uid) ? setupMulliganUids.filter((id) => id !== uid) : [...setupMulliganUids, uid]; setupSelectionPreview = { type: "card", value: uid }; renderSetup(); }));
    elements.mulligan.disabled = game.players[0].mulliganUsed;
    elements.mulligan.textContent = game.players[0].mulliganUsed ? "已完成换牌" : `确认换牌（已选 ${setupMulliganUids.length} 张，可不换）`;
    elements.setupHeroes.querySelectorAll("[data-hero]").forEach((button) => {
      button.addEventListener("click", () => {
        selectedHeroOwnerIndex = 0;
        selectedHeroIndex = Number(button.dataset.hero);
        setupSelectionPreview = { type: "hero", value: selectedHeroIndex };
        game.chooseLeader(0, selectedHeroIndex);
        render();
      });
    });
  }

  function render() {
    maybeActivateTutorial();
    renderZones();
    renderDecks();
    renderArenaContestStage();
    renderHand();
    renderSelection();
    renderActions();
    renderLogs();
    renderStatus();
    renderSetup();
    renderUpgradeGuide();
    renderActionSelectionModal();
    renderTutorial();
    if (game.winner != null) showGameOver();
  }

  function toast(message) {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    toastTimer = setTimeout(() => elements.toast.classList.remove("show"), 2200);
  }

  async function doCharge() {
    if (!tutorialAllows("charge")) return toast(`新手指引中请先完成：${TUTORIAL_STEPS[tutorial.step].title}`);
    if (interactionMode === "charge-select") return cancelUpgrade();
    if (interactionMode) return;
    interactionMode = "charge-select";
    selectedCardUid = null;
    render();
  }

  async function completeCharge() {
    if (!selectedCardUid) return;
    const card = game.findHandCard(0, selectedCardUid);
    uiLocked = true;
    const result = game.charge(0, selectedCardUid);
    interactionMode = null;
    selectedCardUid = null;
    render();
    if (!result.ok) {
      uiLocked = false;
      render();
      return toast(result.reason);
    }
    await animateCardTransfer(card, 0, "将手牌放入充能区", "to-charge");
    uiLocked = false;
    completeTutorialStep("charge");
    render();
  }

  function doUpgrade() {
    if (!tutorialAllows("upgrade")) return toast(`新手指引中请先完成：${TUTORIAL_STEPS[tutorial.step].title}`);
    if (interactionMode === "upgrade-card" || interactionMode === "upgrade-branch" || interactionMode === "upgrade-hero") return cancelUpgrade();
    interactionMode = "upgrade-hero";
    upgradeHeroIndex = null;
    upgradeRoleCardId = null;
    upgradeDiscardUids = [];
    selectedCardUid = null;
    selectedHeroOwnerIndex = 0;
    selectedHeroIndex = null;

    render();
  }

  async function completeUpgrade() {
    if (interactionMode === "charge-select") return completeCharge();
    if (interactionMode === "battle-select") return completeBattleSelection();
    if (interactionMode === "pursuit-select") return completePursuitSelection();
    if (interactionMode === "switch-select") return completeSwitchSelection();
    if (upgradeHeroIndex == null) return;
    const heroIndex = upgradeHeroIndex;
    const candidates = upgradeCandidates(0, heroIndex);
    if (!candidates.length) return toast("角色卡组中没有可展示的同名升级角色卡");
    if (interactionMode === "upgrade-hero") {
      upgradeRoleCardId = candidates.length === 1 ? candidates[0].id : null;
      interactionMode = candidates.length > 1 ? "upgrade-branch" : "upgrade-card";
      upgradeDiscardUids = [];
      render();
      return;
    }
    if (interactionMode === "upgrade-branch") {
      if (!selectedUpgradeCandidate(0, heroIndex)) return toast("请选择本次要叠放的角色牌");
      interactionMode = "upgrade-card";
      upgradeDiscardUids = [];
      render();
      return;
    }
    const candidate = selectedUpgradeCandidate(0, heroIndex);
    if (!candidate) return toast("请选择本次要叠放的角色牌");
    if (upgradeDiscardUids.length !== candidate.level) return toast(`请选择 ${candidate.level} 张手牌作为 Lv.${candidate.level} 升级代价`);
    const cards = upgradeDiscardUids.map((uid) => game.findHandCard(0, uid)).filter(Boolean);
    uiLocked = true;
    const result = game.upgrade(0, heroIndex, candidate.id, upgradeDiscardUids);
    interactionMode = null;
    upgradeHeroIndex = null;
    upgradeRoleCardId = null;
    upgradeDiscardUids = [];
    selectedCardUid = null;
    render();
    if (!result.ok) { uiLocked = false; render(); return toast(result.reason); }
    for (const card of cards) await animateCardTransfer(card, 0, `弃置「${card.name}」作为升级代价`, "to-discard", 800);
    await animateUpgrade(0, heroIndex, result.fromLevel, result.toLevel);
    for (const trigger of result.roleTriggers || []) {
      await animateAndCommitDeferredEffect(trigger, trigger.timing || "升级", `「${trigger.cardName}」效果取回行动卡`, `「${trigger.cardName}」效果置入协奏区`);
    }
    uiLocked = false;
    completeTutorialStep("upgrade");
    render();
  }

  async function doSwitch() {
    if (!tutorialAllows("switch")) return toast(`新手指引中请先完成：${TUTORIAL_STEPS[tutorial.step].title}`);
    if (interactionMode === "switch-select") return cancelUpgrade();
    if (interactionMode) return;
    interactionMode = "switch-select";
    selectedHeroOwnerIndex = 0;
    selectedHeroIndex = null;
    render();
  }

  async function completeSwitchSelection() {
    if (selectedHeroOwnerIndex !== 0 || selectedHeroIndex == null) return toast("请选择一名后台角色");
    uiLocked = true;
    const result = game.switchHero(0, selectedHeroIndex);
    interactionMode = null;
    render();
    if (!result.ok) {
      uiLocked = false;
      render();
      return toast(result.reason);
    }
    await animateHeroSwitch(0, result.fromHeroIndex, result.toHeroIndex);
    uiLocked = false;
    completeTutorialStep("switch");
    render();
  }

  async function doPlay() {
    const isCombo = game.phase === "pursuit" && game.pursuit?.playerIndex === 0;
    if (!isCombo && !tutorialAllows("battle")) return toast(`新手指引中请先完成：${TUTORIAL_STEPS[tutorial.step].title}`);
    if (isCombo && !tutorialAllows("pursuit")) return toast(`新手指引中请先完成：${TUTORIAL_STEPS[tutorial.step].title}`);
    if (!isCombo) {
      if (interactionMode === "battle-select") return cancelUpgrade();
      if (interactionMode || !game.legalContestCards(0).length) return;
      interactionMode = "battle-select";
      selectedCardUid = null;
      render();
      return;
    }
    if (interactionMode === "pursuit-select") return cancelActionSelection();
    if (interactionMode) return;
    interactionMode = "pursuit-select";
    selectedCardUid = null;
    render();
  }

  async function completePursuitSelection() {
    const uid = selectedCardUid;
    if (!uid || !game.legalPursuitCards(0).some((card) => card.uid === uid)) return toast("请选择一张当前可用的红色追击牌");
    uiLocked = true;
    const result = game.playCombo(0, uid);
    interactionMode = null;
    selectedCardUid = null;
    render();
    if (!result.ok) {
      uiLocked = false;
      render();
      return toast(result.reason);
    }
    await animatePursuitShowcase(result.card, 0);
    await animateCardTransfer(result.card, 0, "红色连击直击", "to-action", 900);
    await animateSpentEnergy(result.spentCards, 0);
    if (result.choice?.type === "combo-switch") { showComboChoice(result.choice); return; }
    await animateRoleTriggeredEffects(result.effect);
    await commitAndAnimateDirectEffectResources(result.effect, "连击效果抽牌", "连击效果置入协奏区");
    await animateAndCommitEffectDamage(result.effect);
    await animateTurnEndEffects(result.turnEndEffects);
    await animateTurnStartSequence();
    uiLocked = false;
    render();
    await continueAfterContestResolution();
  }

  async function cancelActionSelection() {
    if (interactionMode !== "pursuit-select") return cancelUpgrade();
    interactionMode = null;
    selectedCardUid = null;
    render();
    await endHumanTurn();
  }

  async function completeBattleSelection() {
    const uid = selectedCardUid;
    const card = uid ? game.findHandCard(0, uid) : null;
    if (!card || !game.legalContestCards(0).some((item) => item.uid === uid)) return toast("请选择一张当前满足使用条件的行动卡");
    uiLocked = true;
    const result = game.beginContest(0, uid);
    interactionMode = null;
    selectedCardUid = null;
    render();
    if (!result.ok) {
      uiLocked = false;
      render();
      return toast(result.reason);
    }
    await animateCoverCard(0);
    if (result.pending) {
      await aiRespond();
      return;
    }
    await animateContestWithCost(result);
    uiLocked = false;
    completeTutorialStep("battle");
    render();
    await continueAfterContestResolution();
  }

  function showComboChoice(choice) {
    elements.responseTitle.textContent = `「${choice.card.name}」：选择要与领队交换的后台角色`;
    elements.responseDetail.textContent = "切换后将按卡牌文本检查被切换角色，结算追加伤害、抽牌或协奏效果。";
    const player = game.players[0];
    elements.responseCards.innerHTML = player.heroes.map((hero, index) => index === player.activeHero ? "" : heroHtml(hero, index, player, true)).join("");
    elements.responseCards.querySelectorAll("[data-hero]").forEach((button) => button.addEventListener("click", async () => {
      const result = game.resolveChoice(0, { heroIndex: Number(button.dataset.hero) });
      if (!result.ok) return toast(result.reason);
      elements.responseOverlay.classList.add("hidden"); uiLocked = true; render();
      await animateHeroSwitch(0, result.fromHeroIndex, result.toHeroIndex);
      await animateRoleTriggeredEffects(result.effect);
      await commitAndAnimateDirectEffectResources(result.effect, "连击效果抽牌", "连击效果置入协奏区");
      await animateAndCommitEffectDamage(result.effect);
      await animateTurnEndEffects(result.turnEndEffects);
      await animateTurnStartSequence();
      uiLocked = false; render();
      await continueAfterContestResolution();
    }));
    elements.passDefense.hidden = true;
    elements.responseOverlay.classList.remove("hidden");
  }
  function bestAiResponse() {
    const legal = game.legalResponses(1);
    if (!legal.length) return null;
    if (aiDifficulty === "novice") return legal[0];
    return legal.slice().sort((a, b) => aiCardScore(b) - aiCardScore(a))[0];
  }

  async function aiRespond() {
    if (!game.pending || game.pending.responder !== 1) return;
    aiRunning = true;
    uiLocked = true;
    aiThinkingLabel = aiService.configured ? "DeepSeek 正在盖牌" : "AI 正在盖牌";
    let continueResolution = false;
    let resumeAiScheduling = false;
    try {
      render();
      const legalCards = game.legalResponses(1);
      const state = aiPublicState();
      const legal = {
        responseCards: legalCards.map(cardForAi),
        mayPass: legalCards.length === 0,
      };
      const decision = await requestAiDecision("contest_response", state, legal);
      const requested = decision && legalCards.find((card) => card.uid === decision.responseUid);
      const choice = requested || bestAiResponse();
      if (!decision) recordAiDecision({
        mode: "contest_response",
        state,
        legal,
        decision: { responseUid: choice?.uid || null, reason: "本地规则 AI：按可用行动卡与难度规则选择响应。" },
        source: "本地规则 AI",
      });
      const result = game.respondContest(1, choice ? choice.uid : null);
      if (!result.ok) {
        toast(result.reason);
        return;
      }
      await animateContestWithCost(result);
      if (result.initiator === 0) completeTutorialStep("battle");
      continueResolution = true;
    } catch (error) {
      console.error("AI contest response failed", error);
      game.log("AI 响应结算出现异常，已释放操作锁并按规则停止本次追击。", "system");
      hideAnimationScene();
      if (game.phase === "pursuit" && game.pursuit?.playerIndex === 1) game.endPursuit(1);
      resumeAiScheduling = aiMayAct();
    } finally {
      // 无论决策、规则执行还是动画发生何种异常，均不能遗留 AI/UI 锁。
      aiRunning = false;
      uiLocked = false;
      aiThinkingLabel = "AI 行动中";
      render();
    }
    if (continueResolution) await continueAfterContestResolution();
    else if (resumeAiScheduling) setTimeout(() => runAiTurn(), 0);
  }

  async function endHumanTurn() {
    if (interactionMode === "effect-discard") {
      const pending = game.pendingEffectDiscard;
      if (!pending) return;
      if (upgradeDiscardUids.length !== pending.count) return toast(`请选择 ${pending.count} 张手牌弃置`);
      const cards = upgradeDiscardUids.map((uid) => game.findHandCard(0, uid)).filter(Boolean);
      const result = game.discardForEffect(0, upgradeDiscardUids);
      if (!result.ok) return toast(result.reason);
      interactionMode = null; upgradeDiscardUids = []; uiLocked = true; render();
      for (const card of cards) await animateCardTransfer(card, 0, `「${pending.source}」效果弃置`, "to-discard", 700);
      uiLocked = false; render();
      const resolve = effectDiscardResolver; effectDiscardResolver = null;
      if (resolve) resolve(true);
      return;
    }
    const endingTutorialPursuit = game.phase === "pursuit" && game.pursuit?.playerIndex === 0 && tutorialIsActive() && tutorial.step === "pursuit";
    if (!tutorialAllows(endingTutorialPursuit ? "pursuit" : "end")) return toast(`新手指引中请先完成：${TUTORIAL_STEPS[tutorial.step].title}`);
    if (interactionMode === "hand-limit") {
      const needed = Math.max(0, game.players[0].hand.length - 8);
      if (upgradeDiscardUids.length !== needed) return toast(`请选择 ${needed} 张手牌弃置`);
      const cards = upgradeDiscardUids.map((uid) => game.findHandCard(0, uid)).filter(Boolean);
      const limitResult = game.discardForHandLimit(0, upgradeDiscardUids);
      if (!limitResult.ok) return toast(limitResult.reason);
      interactionMode = null; upgradeDiscardUids = []; uiLocked = true; render();
      for (const card of cards) await animateCardTransfer(card, 0, "手牌上限弃置", "to-discard", 700);
      await animateTurnEndEffects(limitResult.turnEndEffects);
      await animateTurnStartSequence();
      uiLocked = false;
      completeTutorialStep("end");
      render();
      if (aiMayAct()) await runAiTurn();
      return;
    }
    uiLocked = true;
    const result = game.phase === "pursuit" && game.pursuit?.playerIndex === 0 ? game.endPursuit(0) : game.endTurn(0);
    if (!result.ok) {
      uiLocked = false;
      render();
      return toast(result.reason);
    }
    if (endingTutorialPursuit) {
      uiLocked = false;
      completeTutorialStep("pursuit");
      render();
      return;
    }
    selectedCardUid = null;
    selectedHeroOwnerIndex = 0;
    selectedHeroIndex = null;
    if (result.needsHandDiscard) {
      interactionMode = "hand-limit";
      upgradeDiscardUids = [];
      uiLocked = false;
      render();
      return toast(`手牌超过上限：请选择 ${result.needsHandDiscard} 张手牌弃置后结束回合`);
    }
    render();
    for (const card of result.discarded || []) await animateCardTransfer(card, 0, "手牌上限弃置", "to-discard", 900);
    await animateTurnEndEffects(result.turnEndEffects);
    await animateTurnStartSequence();
    uiLocked = false;
    completeTutorialStep("end");
    render();
    if (aiMayAct()) await runAiTurn();
  }

  function cardForAi(card) {
    return {
      uid: card.uid,
      name: card.name,
      type: card.kind,
      tone: card.tone,
      cost: game.cardCost(1, card),
      attack: card.attack || 0,
      speed: card.speed || 0,
      heal: card.heal || 0,
      shield: card.shield || 0,
      draw: card.draw || 0,
      leaderOnly: card.leaderOnly || null,
      text: card.text || "",
    };
  }

  function aiPublicState() {
    const ai = game.players[1];
    const human = game.players[0];
    const heroView = (hero, index, player) => ({
      index,
      name: hero.name,
      passiveTone: hero.passiveTone,
      level: hero.level,
      passive: hero.passiveText,
      leader: index === player.activeHero,
    });
    return {
      difficulty: { id: aiDifficulty, name: DIFFICULTIES[aiDifficulty].name },
      turn: game.turn,
      firstPlayer: game.firstPlayer,
      ai: {
        hp: ai.hp,
        shield: ai.shield,
        energy: ai.energy,
        hand: ai.hand.map(cardForAi),
        deckCount: ai.deck.length,
        discardCount: ai.discard.length,
        heroes: ai.heroes.map((hero, index) => heroView(hero, index, ai)),
      },
      opponentPublic: {
        hp: human.hp,
        shield: human.shield,
        handCount: human.hand.length,
        deckCount: human.deck.length,
        chargeCount: human.chargeZone.length,
        heroes: human.heroes.map((hero, index) => heroView(hero, index, human)),
      },
      usedThisTurn: {
        charge: ai.chargedThisTurn,
        upgrade: ai.upgradedThisTurn,
        switchLeader: ai.switchedThisTurn,
      },
    };
  }

  function aiCardScore(card) {
    const ai = game.players[1];
    const stats = game.cardStats(1, card);
    const difficulty = aiService.configured ? aiDifficulty : "novice";
    if (difficulty === "novice") return 0;
    if (card.kind === "dodge") {
      if (card.heal) return ai.hp <= 13 ? 12 + card.heal : 2;
      if (card.shield) return ai.shield < 2 ? 6 + card.shield : card.shield;
      if (card.draw) return ai.hand.length <= 4 ? 7 + card.draw : 2;
    }
    let score = stats.attack * 2 + stats.speed - game.cardCost(1, card) * .4;
    if (difficulty === "expert") {
      const opponentLeader = game.hero(0);
      if (opponentLeader?.passiveTone && TONES[card.tone]?.beats === opponentLeader.passiveTone) score += 3;
      if (game.players[0].hp <= stats.attack) score += 15;
      if (card.kind === "attack" && game.legalPursuitCards(1).some((item) => item.tone === card.tone)) score += 4;
    }
    return score;
  }

  function aiMayAct() {
    if (!game || game.winner != null) return false;
    if (tutorial.mode === "explain") return false;
    if (game.phase === "hand-limit") return game.handLimitPlayer === 1;
    if (game.phase === "post-battle") return game.activePlayer === 1;
    return game.phase === "pursuit" ? game.pursuit?.playerIndex === 1 : game.activePlayer === 1;
  }
  function aiLegalPlan() {
    const ai = game.players[1];
    if (!game.canTakeMainAction(1)) return { chargeUids: [], upgradeHeroIndexes: [], upgradeDiscardUids: [], switchHeroIndexes: [], contestUids: [], mayEndTurn: true };
    const futureEnergy = ai.energy + (!ai.chargedThisTurn && ai.hand.length ? 1 : 0);
    return {
      chargeUids: ai.chargedThisTurn ? [] : ai.hand.map((card) => card.uid),
      upgradeHeroIndexes: ai.upgradedThisTurn ? [] : ai.heroes.map((hero, index) => hero.level < 2 ? index : null).filter((value) => value != null),
      upgradeRoleCardIds: ai.upgradedThisTurn ? {} : Object.fromEntries(ai.heroes.map((hero, index) => [index, hero.level < 2 ? upgradeCandidates(1, index).map((card) => card.id) : []])),
      upgradeDiscardUids: ai.upgradedThisTurn ? [] : ai.hand.map((card) => card.uid),
      switchHeroIndexes: ai.switchedThisTurn ? [] : ai.heroes.map((hero, index) => index !== ai.activeHero ? index : null).filter((value) => value != null),
      contestUids: ai.hand.filter((card) => game.canUseCard(1, card) && game.cardCost(1, card) <= futureEnergy).map((card) => card.uid),
      mayEndTurn: true,
    };
  }

  function localAiPlan() {
    const ai = game.players[1];
    if (!game.canTakeMainAction(1)) return { chargeUid: null, upgrade: null, switchHeroIndex: null, contestUid: null, endTurn: true, reason: "战斗与效果已结算，等待结束回合" };
    const difficulty = aiService.configured ? aiDifficulty : "novice";
    if (difficulty === "novice") {
      const affordable = ai.hand.filter((card) => game.canUseCard(1, card) && game.cardCost(1, card) <= ai.energy);
      const chargeCard = !ai.chargedThisTurn && ai.hand.length > 1 ? ai.hand[0] : null;
      return { chargeUid: chargeCard?.uid || null, upgrade: null, switchHeroIndex: null, contestUid: affordable[0]?.uid || null, endTurn: !affordable.length, reason: "初级本地 AI：基础合法出牌" };
    }
    const sortedLow = ai.hand.slice().sort((a, b) => aiCardScore(a) - aiCardScore(b));
    const willCharge = !ai.chargedThisTurn && ai.energy < 3 && ai.hand.length > 1;
    const futureEnergy = ai.energy + (willCharge ? 1 : 0);
    const contest = ai.hand.filter((card) => game.canUseCard(1, card) && game.cardCost(1, card) <= futureEnergy)
      .sort((a, b) => aiCardScore(b) - aiCardScore(a))[0];
    const chargeCard = willCharge ? sortedLow.find((card) => card.uid !== contest?.uid) || sortedLow[0] : null;
    const target = ai.heroes.reduce((best, hero, index) => hero.level < ai.heroes[best].level ? index : best, 0);
    const bestHero = ai.heroes.reduce((best, hero, index) => {
      const score = hero.base + hero.level * 2;
      const bestScore = ai.heroes[best].base + ai.heroes[best].level * 2;
      return score > bestScore ? index : best;
    }, ai.activeHero);
const upgradePool = sortedLow.filter((card) => card.uid !== contest?.uid && card.uid !== chargeCard?.uid);
    const upgradeCard = !ai.upgradedThisTurn && ai.heroes[target].level < 2
      ? upgradeCandidates(1, target).find((roleCard) => upgradePool.length >= roleCard.level)
      : null;
    return {
      chargeUid: chargeCard?.uid || null,
      upgrade: upgradeCard ? { heroIndex: target, roleCardId: upgradeCard.id, discardUids: upgradePool.slice(0, upgradeCard.level).map((card) => card.uid) } : null,
      switchHeroIndex: !ai.switchedThisTurn && bestHero !== ai.activeHero ? bestHero : null,
      contestUid: contest && ai.hand.length > 1 ? contest.uid : null,
      endTurn: !contest || ai.hand.length <= 1,
      reason: difficulty === "expert" ? "高级 AI：按公开局面评分决策" : "中级 AI：领队与克制基础预判",
    };
  }

  async function applyAiPlan(plan) {
    const ai = game.players[1];
    if (!game.canTakeMainAction(1)) {
      const endResult = game.endTurn(1);
      render();
      return endResult;
    }
    const hasCard = (uid) => Boolean(uid && game.findHandCard(1, uid));
    if (!ai.chargedThisTurn && hasCard(plan.chargeUid)) {
      const card = game.findHandCard(1, plan.chargeUid);
      const chargeResult = game.charge(1, plan.chargeUid);
      render();
      if (chargeResult.ok) {
        await animateCardTransfer(card, 1, "AI 将手牌放入充能区", "to-charge");
        await delay(800);
      }
    }
if (!ai.upgradedThisTurn && plan.upgrade) {
      const heroIndex = Number(plan.upgrade.heroIndex);
      const hero = ai.heroes[heroIndex];
      const options = hero ? upgradeCandidates(1, heroIndex) : [];
      const roleCard = options.find((item) => item.id === plan.upgrade.roleCardId) || options.find((item) => {
        const pool = ai.hand.filter((card) => card.uid !== plan.contestUid && card.uid !== plan.chargeUid);
        return pool.length >= item.level;
      });
      const discardUids = Array.isArray(plan.upgrade.discardUids) ? plan.upgrade.discardUids : (plan.upgrade.discardUid ? [plan.upgrade.discardUid] : []);
      const resolvedDiscards = discardUids.length === (roleCard?.level || 0) ? discardUids : ai.hand.filter((card) => card.uid !== plan.contestUid && card.uid !== plan.chargeUid).slice(0, roleCard?.level || 0).map((card) => card.uid);
      if (hero && roleCard && resolvedDiscards.every(hasCard)) {
        const cards = resolvedDiscards.map((uid) => game.findHandCard(1, uid));
        const upgradeResult = game.upgrade(1, heroIndex, roleCard.id, resolvedDiscards);
        render();
        if (upgradeResult.ok) {
          for (const card of cards) await animateCardTransfer(card, 1, `AI 弃置「${card.name}」作为升级代价`, "to-discard", 700);
          await animateUpgrade(1, heroIndex, upgradeResult.fromLevel, upgradeResult.toLevel);
          for (const trigger of upgradeResult.roleTriggers || []) {
            await animateAndCommitDeferredEffect(trigger, trigger.timing || "升级", `「${trigger.cardName}」效果取回行动卡`, `「${trigger.cardName}」效果置入协奏区`);
          }
          await delay(850);
        }
      }
    }    if (!ai.switchedThisTurn && Number.isInteger(plan.switchHeroIndex) && ai.heroes[plan.switchHeroIndex] && plan.switchHeroIndex !== ai.activeHero) {
      const switchResult = game.switchHero(1, plan.switchHeroIndex);
      render();
      if (switchResult.ok) {
        await animateHeroSwitch(1, switchResult.fromHeroIndex, switchResult.toHeroIndex);
        await delay(850);
      }
    }
    const legalContest = game.legalContestCards(1);
    let contestCard = legalContest.find((card) => card.uid === plan.contestUid);
    if (!contestCard && !plan.endTurn) contestCard = legalContest.slice().sort((a, b) => aiCardScore(b) - aiCardScore(a))[0];
    if (contestCard) {
      await delay(900);
      const contestResult = game.beginContest(1, contestCard.uid);
      if (!contestResult.ok) return contestResult;
      render();
      await animateCoverCard(1);
      if (!contestResult.pending) await animateContestWithCost(contestResult);
      return contestResult;
    }
    const endResult = game.endTurn(1);
    render();
    for (const card of endResult.discarded || []) await animateCardTransfer(card, 1, "AI 手牌上限弃置", "to-discard", 900);
    await animateTurnEndEffects(endResult.turnEndEffects);
    await animateTurnStartSequence();
    return endResult;
  }

  async function runAiTurn() {
    if (aiRunning || !aiMayAct()) return;
    aiRunning = true;
    uiLocked = true;
    let resumeAiScheduling = false;
    try {
    if (game.phase === "hand-limit" && game.handLimitPlayer === 1) {
      await resolveHandLimitFlow();
      aiRunning = false;
      uiLocked = false;
      aiThinkingLabel = "AI 行动中";
      render();
      return;
    }
    if (game.phase === "post-battle" && game.activePlayer === 1) {
      aiThinkingLabel = "AI 正在结束回合";
      render();
      await delay(650);
      const result = game.endTurn(1);
      await animateTurnEndEffects(result.turnEndEffects);
      await animateTurnStartSequence();
      aiRunning = false;
      uiLocked = false;
      aiThinkingLabel = "AI 行动中";
      render();
      return result;
    }
    if (game.phase === "pursuit" && game.pursuit?.playerIndex === 1) {
      aiThinkingLabel = "AI 正在选择是否追击";
      render();
      await delay(900);
      const legalPursuits = game.legalPursuitCards(1);
      const state = aiPublicState();
      const legal = { pursuitCards: legalPursuits.map(cardForAi), mayStop: true };
      const decision = await requestAiDecision("pursuit", state, legal);
      const pursuitCard = legalPursuits.find((card) => card.uid === decision?.pursuitUid) || legalPursuits.slice().sort((a, b) => aiCardScore(b) - aiCardScore(a))[0];
      const shouldStop = decision?.pursuitUid === null;
      if (!decision) recordAiDecision({
        mode: "pursuit",
        state,
        legal,
        decision: { pursuitUid: shouldStop ? null : (pursuitCard?.uid || null), reason: "本地规则 AI：按行动卡评分选择追击或停止。" },
        source: "本地规则 AI",
      });
      if (!pursuitCard || shouldStop) {
        const result = game.endPursuit(1);
        await animateTurnEndEffects(result.turnEndEffects);
        await animateTurnStartSequence();
        aiRunning = false;
        uiLocked = false;
        aiThinkingLabel = "AI 行动中";
        render();
        if (game.activePlayer === 0) return;
        return runAiTurn();
      }
      const contestResult = game.playCombo(1, pursuitCard.uid);
      render();
      await animatePursuitShowcase(contestResult.card, 1);
      await animateCardTransfer(contestResult.card, 1, "AI 红色连击直击", "to-action", 900);
      await animateSpentEnergy(contestResult.spentCards, 1);
      if (contestResult.choice?.type === "combo-switch") {
        const ai = game.players[1];
        const named = (contestResult.card.text || "").match(/若「([^」]+)」/);
        const choices = ai.heroes.map((hero, index) => ({ hero, index })).filter(({ index }) => index !== ai.activeHero);
        const target = choices.find(({ hero }) => named && hero.name === named[1]) || choices.sort((a, b) => b.hero.level - a.hero.level)[0];
        const choiceResult = target ? game.resolveChoice(1, { heroIndex: target.index }) : { ok: false };
        if (choiceResult.ok) {
          render();
          await animateHeroSwitch(1, choiceResult.fromHeroIndex, choiceResult.toHeroIndex);
          await animateRoleTriggeredEffects(choiceResult.effect);
          await commitAndAnimateDirectEffectResources(choiceResult.effect, "连击效果抽牌", "连击效果置入协奏区");
          await animateAndCommitEffectDamage(choiceResult.effect);
          await animateTurnEndEffects(choiceResult.turnEndEffects);
          await animateTurnStartSequence();
        }
      } else { await animateRoleTriggeredEffects(contestResult.effect); await commitAndAnimateDirectEffectResources(contestResult.effect, "连击效果抽牌", "连击效果置入协奏区"); await animateAndCommitEffectDamage(contestResult.effect); await animateTurnEndEffects(contestResult.turnEndEffects); await animateTurnStartSequence(); }
      aiRunning = false;
      uiLocked = false;
      aiThinkingLabel = "AI 行动中";
      render();
      return continueAfterContestResolution();
    }
    aiThinkingLabel = aiService.configured ? "DeepSeek 正在规划" : "AI 行动中";
    render();
    const state = aiPublicState();
    const legal = aiLegalPlan();
    const decision = await requestAiDecision("turn_plan", state, legal);
    const plan = decision || localAiPlan();
    if (!decision) recordAiDecision({
      mode: "turn_plan",
      state,
      legal,
      decision: plan,
      source: "本地规则 AI",
    });
    await delay(950);
    const result = await applyAiPlan(plan);
    if (decision && plan.reason) game.log(`DeepSeek：${String(plan.reason).slice(0, 90)}`, "ai");
    aiRunning = false;
    uiLocked = false;
    aiThinkingLabel = "AI 行动中";
    render();
    if (result && result.pending) showResponse();
    else await continueAfterContestResolution();
    } catch (error) {
      // 决策服务、规则执行与任一动画都可能抛错；异常时必须交回操作权。
      console.error("AI turn failed", error);
      game.log("AI 结算出现异常，已释放操作锁并按规则停止本次追击。", "system");
      hideAnimationScene();
      if (game.phase === "pursuit" && game.pursuit?.playerIndex === 1) game.endPursuit(1);
      resumeAiScheduling = aiMayAct();
    } finally {
      // finally 是 AI 锁的唯一兜底：任何提前 return 或异常都不会冻住对局。
      aiRunning = false;
      uiLocked = false;
      aiThinkingLabel = "AI 行动中";
      render();
      if (resumeAiScheduling) setTimeout(() => runAiTurn(), 0);
    }
  }

  function showResponse() {
    // AI 已经完成盖牌；响应窗口期间绝不能遗留 AI 锁。
    aiRunning = false;
    uiLocked = false;
    if (!game.pending || game.pending.responder !== 0) return;
    resetUtilityModal();
    responseSelectedCardUid = null;
    utilityModalMode = "contest-response";
    elements.responseOverlay.dataset.utilityMode = "contest-response";
    elements.responseEyebrow.textContent = "FACE-DOWN CONTEST";
    elements.responseTitle.textContent = `${game.players[1].name} 已盖放 1 张手牌`;
    const legal = game.legalResponses(0);
    const renderResponseChoices = () => {
      elements.responseCards.innerHTML = legal.length
        ? legal.map((card) => cardHtml(card, 0, { response: true, choiceSelected: card.uid === responseSelectedCardUid })).join("")
        : '<span class="empty-hand">没有可用的战斗手牌，可直接不放。</span>';
      elements.responseSelectionDetail.innerHTML = choiceEffectHtml(responseSelectedCardUid ? game.findHandCard(0, responseSelectedCardUid) : null, 0, "选择一张要盖放的手牌后，这里会显示其完整效果。");
      elements.responseCards.querySelectorAll("[data-card]").forEach((button) => button.addEventListener("click", () => {
        responseSelectedCardUid = button.dataset.card;
        renderResponseChoices();
      }));
      elements.responseDetail.textContent = legal.length
        ? `选择 1 张费用足够的手牌盖放；也可以直接不放。${responseSelectedCardUid ? "已选择 1 张。" : ""}`
        : "没有可用的战斗手牌，可直接不放。";
      elements.confirmChoice.disabled = !responseSelectedCardUid;
      elements.confirmChoice.textContent = `确认盖牌（${responseSelectedCardUid ? "1" : "0"}/1）`;
    };
    elements.confirmChoice.hidden = false;
    elements.confirmChoice.classList.remove("hidden");
    renderResponseChoices();
    elements.passDefense.hidden = false;
    elements.passDefense.textContent = legal.length ? "本次不放牌，直接判定对方胜利" : "直接不放牌";
    elements.responseOverlay.classList.remove("hidden");
    if (!legal.length) setTimeout(() => resolveHumanResponse(null), 800);
  }

  async function resolveHumanResponse(uid) {
    uiLocked = true;
    const result = game.respondContest(0, uid || null);
    if (!result.ok) {
      uiLocked = false;
      render();
      return toast(result.reason);
    }
    elements.responseOverlay.classList.add("hidden");
    render();
    await animateContestWithCost(result);
    // 结算动画结束后，追击权或下一回合必须立即交回对应玩家。
    aiRunning = false;
    uiLocked = false;
    render();
    await continueAfterContestResolution();
  }

  function showGameOver() {
    recordMatch();
    const won = game.winner === 0;
    elements.gameOverTitle.textContent = won ? "共鸣胜利" : "共鸣断绝";
    elements.gameOverDetail.textContent = won
      ? `你在第 ${game.turn} 回合击破了 AI 的防线。`
      : `AI 在第 ${game.turn} 回合将你的生命降至 0。`;
    elements.resultGlyph.textContent = won ? "◇" : "×";
    elements.resultGlyph.style.color = won ? "var(--mint)" : "var(--danger)";
    renderStats();
    elements.gameOverOverlay.classList.remove("hidden");
  }

  function newGame(options) {
    if (!options?.keepTutorial) tutorial = { mode: "off", step: "charge", completed: null };
    isTestLab = false;
    matchLogId = createMatchLogId();
    const customPreset = selectedCustomDeck();
    game = new DuelGame({ seed: Date.now(), firstPlayer: options?.firstPlayer, playerName, playerPreset: customPreset ? undefined : (elements.playerPreset?.value || "rover-female-yangyang-chixia"), playerPresetData: customPreset || undefined, aiPreset: elements.aiPreset?.value || "rover-male-jinhsi-sanhua" });
    applyAiIdentity();
    if (game.coinWinner === 1) game.chooseInitiative(1, 1);
    selectedCardUid = null;
    selectedHeroOwnerIndex = 0;
    selectedHeroIndex = 0;
    aiRunning = false;
    uiLocked = false;
    interactionMode = null;
    upgradeHeroIndex = null;
    upgradeRoleCardId = null;
    matchRecorded = false;
    lastAnimatedDrawTurn = -1;
    lastAnimatedTurnStartEffectsTurn = -1;
    lastAnimatedTurnTransitionTurn = -1;
    setupMulliganUids = [];
    upgradeDiscardUids = [];
    hideAnimationScene();
    elements.responseOverlay.classList.add("hidden");
    elements.gameOverOverlay.classList.add("hidden");
    elements.tutorialExplainOverlay.classList.add("hidden");
    elements.tutorialHint.classList.add("hidden");
    elements.mainMenuOverlay.classList.add("hidden");
    if (elements.menuBackgroundVideo) {
      elements.menuBackgroundVideo.muted = true;
      elements.menuSoundToggle.classList.add("is-muted");
      elements.menuSoundToggle.setAttribute("aria-pressed", "false");
      elements.menuSoundToggle.setAttribute("aria-label", "开启背景音乐");
    }
    // 开局必须先完成抛硬币与领队确认，不能直接落入不可操作的主战场。
    elements.setupOverlay.classList.remove("hidden");
    render();
    checkAiService().then(render);
  }

  function showMainMenu() {
    if (game?.winner != null) recordMatch();
    // “返回当前对局”只属于战斗内暂停菜单；主界面不保留已离开的对局入口。
    elements.returnToGame.hidden = true;
    elements.responseOverlay.classList.add("hidden");
    elements.gameOverOverlay.classList.add("hidden");
    elements.setupOverlay.classList.add("hidden");
    elements.tutorialChoiceOverlay.classList.add("hidden");
    elements.tutorialExplainOverlay.classList.add("hidden");
    elements.tutorialHint.classList.add("hidden");
    elements.pauseMenuOverlay.classList.add("hidden");
    tutorial = { mode: "off", step: "charge", completed: null };
    hideAnimationScene();
    renderStats();
    renderSaveSlot();
    showMenuPage("home");
    elements.mainMenuOverlay.classList.remove("hidden");
    checkAiService().then(maybeShowApiOnboarding);
  }

  function showPauseMenu() {
    if (!game || game.setupPhase || game.winner != null) return showMainMenu();
    elements.pauseMenuOverlay.classList.remove("hidden");
  }

  function hidePauseMenu() {
    elements.pauseMenuOverlay.classList.add("hidden");
  }

  function startFromMenu() {
    if (!savePlayerName(elements.playerNameInput?.value)) return;
    aiDifficulty = document.querySelector('input[name="difficulty"]:checked')?.value || "novice";
    if (!aiService.configured) aiDifficulty = "novice";
    elements.tutorialChoiceOverlay.classList.remove("hidden");
  }

  function beginNewMatch(withTutorial) {
    tutorial = { mode: withTutorial ? "armed" : "off", step: "charge", completed: null };
    elements.tutorialChoiceOverlay.classList.add("hidden");
    newGame({ keepTutorial: true, firstPlayer: withTutorial ? 0 : undefined });
  }

  async function confirmSetup() {
    const target = selectedHeroOwnerIndex !== 0 || selectedHeroIndex == null ? 0 : selectedHeroIndex;
    uiLocked = true;
    game.chooseLeader(0, target);
    const result = game.confirmSetup(0);
    if (!result.ok) { uiLocked = false; return toast(result.reason); }
    elements.setupOverlay.classList.add("hidden");
    selectedHeroOwnerIndex = 0;
    selectedHeroIndex = target;
    render();
    await animateTurnStartSequence();
    uiLocked = false;
    render();
    if (aiMayAct()) runAiTurn();
  }

  elements.charge.addEventListener("click", doCharge);
  elements.upgrade.addEventListener("click", doUpgrade);
  elements.confirmUpgrade.addEventListener("click", completeUpgrade);
  elements.cancelUpgrade.addEventListener("click", cancelUpgrade);
  elements.actionSelectConfirm.addEventListener("click", completeUpgrade);
  elements.actionSelectCancel.addEventListener("click", cancelActionSelection);
  elements.switch.addEventListener("click", doSwitch);
  elements.play.addEventListener("click", doPlay);
  elements.endTurn.addEventListener("click", endHumanTurn);
  elements.passDefense.addEventListener("click", () => resolveHumanResponse(null));
  elements.confirmChoice.addEventListener("click", async () => {
    if (utilityModalMode === "view-hand") { closeUtilityModal(); return; }
    if (utilityModalMode === "discard-recovery") {
      const pending = pendingDiscardRecovery;
      if (!pending || !responseSelectedCardUid) return;
      const result = game.chooseDeferredDiscardCard(pending.operation, responseSelectedCardUid);
      if (!result.ok) return toast(result.reason);
      responseSelectedCardUid = null;
      closeUtilityModal();
      return;
    }
    if (utilityModalMode === "contest-response") {
      if (!responseSelectedCardUid) return;
      const uid = responseSelectedCardUid;
      responseSelectedCardUid = null;
      closeUtilityModal(false);
      await resolveHumanResponse(uid);
      return;
    }
    if (utilityModalMode === "effect-discard") {
      const pending = game.pendingEffectDiscard;
      if (!pending || upgradeDiscardUids.length !== pending.count) return;
      const cards = upgradeDiscardUids.map((uid) => game.findHandCard(0, uid)).filter(Boolean);
      const result = game.discardForEffect(0, upgradeDiscardUids);
      if (!result.ok) return toast(result.reason);
      closeUtilityModal(false);
      interactionMode = null; upgradeDiscardUids = []; uiLocked = true; render();
      for (const card of cards) await animateCardTransfer(card, 0, `「${pending.source}」效果弃置`, "to-discard", 700);
      uiLocked = false; render();
      const resolve = effectDiscardResolver; effectDiscardResolver = null;
      if (resolve) resolve(true);
      return;
    }
    if (utilityModalMode !== "payment") return;
    const result = game.resolvePaymentChoice(0, true);
    if (!result.ok) return toast(result.reason);
    const resume = closeUtilityModal(false); uiLocked = true; render();
    await animateSpentEnergy(result.spentCards || [], 0);
    await animateAndCommitDamage(result.damageEvent, 0, result.damage || 0);
    uiLocked = false; render();
    if (resume) resume();
  });
  elements.cancelChoice.addEventListener("click", async () => {
    if (utilityModalMode === "view-hand") { closeUtilityModal(); return; }
    if (utilityModalMode === "discard-recovery") {
      const pending = pendingDiscardRecovery;
      if (!pending) return;
      const result = game.chooseDeferredDiscardCard(pending.operation, null);
      if (!result.ok) return toast(result.reason);
      responseSelectedCardUid = null;
      closeUtilityModal();
      return;
    }
    if (utilityModalMode === "payment") {
      const result = game.resolvePaymentChoice(0, false);
      if (!result.ok) return toast(result.reason);
      const resume = closeUtilityModal(false); uiLocked = true; render();
      await animateAndCommitDamage(result.damageEvent, 0, result.damage || 0);
      uiLocked = false; render();
      if (resume) resume();
    }
  });
  elements.chooseFirst.addEventListener("click", () => { const result = game.chooseInitiative(0, 0); if (!result.ok) toast(result.reason); render(); });
  elements.chooseSecond.addEventListener("click", () => { const result = game.chooseInitiative(0, 1); if (!result.ok) toast(result.reason); render(); });
  elements.mulligan.addEventListener("click", () => { const result = game.mulligan(0, setupMulliganUids); if (!result.ok) return toast(result.reason); setupMulliganUids = []; render(); toast("换牌完成，可确认领队并翻开角色"); });
  elements.confirmSetup.addEventListener("click", confirmSetup);
  elements.menuButton.addEventListener("click", showPauseMenu);
  $("#restartButton")?.addEventListener("click", showMainMenu);
  elements.startGame.addEventListener("click", startFromMenu);
  elements.startTutorial.addEventListener("click", () => beginNewMatch(true));
  elements.skipTutorial.addEventListener("click", () => beginNewMatch(false));
  elements.tutorialExplainConfirm.addEventListener("click", continueTutorial);
  elements.savePlayerName.addEventListener("click", () => savePlayerName(elements.playerNameSettingsInput.value));
  elements.returnToGame.addEventListener("click", () => {
    if (!game || game.setupPhase || game.winner != null) return toast("当前没有可返回的对局");
    elements.mainMenuOverlay.classList.add("hidden");
    elements.setupOverlay.classList.toggle("hidden", !game.setupPhase);
    render();
  });
  elements.saveGame.addEventListener("click", saveCurrentGame);
  elements.loadGame.addEventListener("click", restoreSavedGame);
  elements.deleteSave.addEventListener("click", deleteSavedGame);
  elements.saveSlotInfo.addEventListener("click", (event) => {
    const slotButton = event.target.closest("[data-save-slot-index]");
    if (!slotButton) return;
    const slotIndex = Number(slotButton.dataset.saveSlotIndex);
    const slots = loadSaveSlots();
    if (!Number.isInteger(slotIndex) || !slots[slotIndex]) return;
    selectedSaveSlot = slotIndex;
    renderSaveSlot();
  });
  elements.saveApi.addEventListener("click", () => configureApiKey(elements.apiKeyInput.value.trim()));
  elements.useLocalAi.addEventListener("click", () => configureApiKey(""));
  elements.onboardingSaveApi.addEventListener("click", async () => {
    const key = elements.onboardingApiKeyInput.value.trim();
    if (!key) return toast("请输入 API Key，或选择本地 AI");
    await configureApiKey(key);
    elements.onboardingApiKeyInput.value = "";
  });
  elements.onboardingSkipApi.addEventListener("click", () => {
    sessionStorage.setItem("waves-duel-api-onboarding-dismissed", "1");
    elements.apiOnboardingOverlay.classList.add("hidden");
    syncDifficultyAvailability();
  });
  elements.exitGame.addEventListener("click", exitGame);
  elements.testPlayerCategory.addEventListener("change", populateTestLabOptions);
  elements.testPlayerAttribute.addEventListener("change", populateTestLabOptions);
  elements.testAiCategory.addEventListener("change", populateTestLabOptions);
  elements.testPlayerCard.addEventListener("change", updateTestLabHint);
  elements.testAiCard.addEventListener("change", updateTestLabHint);
  elements.startTestLab.addEventListener("click", startTestLab);
  elements.resumeGame.addEventListener("click", hidePauseMenu);
  elements.pauseSave.addEventListener("click", saveCurrentGame);
  elements.pauseRules.addEventListener("click", () => { hidePauseMenu(); elements.rulesOverlay.classList.remove("hidden"); });
  elements.pauseCodex.addEventListener("click", openDuelCodex);
  elements.returnHome.addEventListener("click", () => {
    hidePauseMenu();
    // 返回主界面等于放弃当前未保存对局；后续只能通过“加载游戏”恢复已保存的存档。
    game = null;
    isTestLab = false;
    interactionMode = null;
    selectedCardUid = null;
    selectedHeroIndex = null;
    selectedHeroOwnerIndex = 0;
    upgradeDiscardUids = [];
    tutorial = { mode: "off", step: "charge", completed: null, layoutIndex: 0 };
    showMainMenu();
  });
  elements.pauseExit.addEventListener("click", () => { hidePauseMenu(); exitGame(); });
  elements.pauseMenuOverlay.addEventListener("click", (event) => { if (event.target === elements.pauseMenuOverlay) hidePauseMenu(); });
  elements.closeRoleDeck.addEventListener("click", () => elements.roleDeckOverlay.classList.add("hidden"));
  elements.roleDeckOverlay.addEventListener("click", (event) => { if (event.target === elements.roleDeckOverlay) elements.roleDeckOverlay.classList.add("hidden"); });
  elements.closeDuelCodex.addEventListener("click", () => elements.duelCodexOverlay.classList.add("hidden"));
  elements.duelCodexOverlay.addEventListener("click", (event) => { if (event.target === elements.duelCodexOverlay) elements.duelCodexOverlay.classList.add("hidden"); });
  elements.codexCategory.addEventListener("change", populateCodexCards);
  elements.codexAttribute.addEventListener("change", populateCodexCards);
  elements.codexCard.addEventListener("change", renderCodexCard);
  elements.duelCodexCategory.addEventListener("change", () => populateCodexCardsFor(elements.duelCodexCategory, elements.duelCodexCard, elements.duelCodexCardVisual, elements.duelCodexCardInfo));
  elements.duelCodexCard.addEventListener("change", () => renderCodexCardFor(elements.duelCodexCard, elements.duelCodexCardVisual, elements.duelCodexCardInfo));
  elements.deckBuilderFilter.addEventListener("change", renderDeckBuilder);
  elements.deckBuilderAttribute.addEventListener("change", renderDeckBuilder);
  elements.saveCustomDeck.addEventListener("click", saveCustomDeck);
  elements.clearCustomDeck.addEventListener("click", () => { customDeckDraft = { roleCards: [], actions: {} }; customDeckPreviewId = null; elements.customDeckName.value = ""; renderDeckBuilder(); });
  elements.menuSoundToggle.addEventListener("click", () => {
    const video = elements.menuBackgroundVideo;
    if (!video) return;
    video.muted = !video.muted;
    elements.menuSoundToggle.classList.toggle("is-muted", video.muted);
    elements.menuSoundToggle.setAttribute("aria-pressed", String(!video.muted));
    elements.menuSoundToggle.setAttribute("aria-label", video.muted ? "开启背景音乐" : "关闭背景音乐");
    if (!video.muted) video.play().catch(() => { video.muted = true; elements.menuSoundToggle.classList.add("is-muted"); });
  });
  document.querySelectorAll("[data-menu-page]").forEach((button) => button.addEventListener("click", () => showMenuPage(button.dataset.menuPage)));
  $("#playAgainButton").addEventListener("click", newGame);
  elements.backToMenu.addEventListener("click", showMainMenu);
  elements.clearStats.addEventListener("click", () => {
    localStats = { games: 0, wins: 0, damageDealt: 0, damageReceived: 0, healingReceived: 0, cardsPlayed: 0 };
    persistStats();
    renderStats();
    toast("本地战绩已清空");
  });
  $("#rulesButton").addEventListener("click", () => elements.rulesOverlay.classList.remove("hidden"));
  $("#closeRulesButton").addEventListener("click", () => elements.rulesOverlay.classList.add("hidden"));
  elements.rulesOverlay.addEventListener("click", (event) => {
    if (event.target === elements.rulesOverlay) elements.rulesOverlay.classList.add("hidden");
  });

  syncPlayerNameInputs();
  refreshPlayerPresetOptions();
  populateTestLabOptions();
  renderStats();
  startServiceSession();
  window.addEventListener("pagehide", endServiceSession);
  showMainMenu();
})();

