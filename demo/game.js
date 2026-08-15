(function () {
  "use strict";

  const { DuelGame, TONES, HEROES } = window.WavesDuelCore;
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
    initiativeChoices: $("#initiativeChoices"),
    chooseFirst: $("#chooseFirstButton"),
    chooseSecond: $("#chooseSecondButton"),
    responseOverlay: $("#responseOverlay"),
    responseTitle: $("#responseTitle"),
    responseDetail: $("#responseDetail"),
    responseCards: $("#responseCards"),
    passDefense: $("#passDefenseButton"),
    confirmChoice: $("#confirmChoiceButton"),
    cancelChoice: $("#cancelChoiceButton"),
    rulesOverlay: $("#rulesOverlay"),
    gameOverOverlay: $("#gameOverOverlay"),
    gameOverTitle: $("#gameOverTitle"),
    gameOverDetail: $("#gameOverDetail"),
    resultGlyph: $("#resultGlyph"),
    mainMenuOverlay: $("#mainMenuOverlay"),
    startGame: $("#startGameButton"),
    tutorialChoiceOverlay: $("#tutorialChoiceOverlay"),
    startTutorial: $("#startTutorialButton"),
    skipTutorial: $("#skipTutorialButton"),
    tutorialHint: $("#tutorialHint"),
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
    menuStats: $("#menuStats"),
    gameOverStats: $("#gameOverStats"),
    clearStats: $("#clearStatsButton"),
    backToMenu: $("#backToMenuButton"),
    toast: $("#toast"),
  };

  let game;
  let selectedCardUid = null;
  let selectedHeroIndex = null;
  let aiRunning = false;
  let uiLocked = false;
  let interactionMode = null;
  let upgradeHeroIndex = null;
  let setupMulliganUids = [];
  let upgradeDiscardUids = [];
  let aiThinkingLabel = "AI 行动中";
  let lastAnimatedDrawTurn = -1;
  let aiService = { configured: false, model: "", available: false };
  let toastTimer = null;
  let utilityModalMode = null;
  let utilityModalResolver = null;
  const STATS_KEY = "waves-duel-local-stats-v1";
  const SAVE_KEY = "waves-duel-local-save-v1";
  const PLAYER_NAME_KEY = "waves-duel-player-name-v1";
  const DIFFICULTIES = {
    novice: { name: "初级", aiName: "无冠者", prompt: "只遵守基础规则；优先从可用牌中直接选择，不主动推测对方领队偏好或隐藏牌。" },
    standard: { name: "中级", aiName: "利维亚坦", prompt: "观察对方公开领队、费用、生命和三色克制，做基础预判；不需要穷举。" },
    expert: { name: "高级", aiName: "阿列夫一", prompt: "严格利用全部公开战场信息、费用、领队被动、克制、速度和追击机会，选择当前最优的合法动作；对隐藏牌只能依据公开领队做概率推断。" },
  };
  let aiDifficulty = "novice";
  let localStats = loadLocalStats();
  let matchRecorded = false;
  let tutorial = { mode: "off", step: "charge", completed: null };
  const TUTORIAL_STEPS = {
    charge: {
      title: "第一步：充能",
      instruction: "点击右侧“充能”，选择 1 张手牌后确认，把它正面放入左侧协奏区。",
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
    end: {
      title: "第五步：结束回合",
      instruction: "本次战斗已经自动结束你的回合，因此不需要再点击“结束回合”。若红色行动卡获胜并触发追击，才可选择继续连击或停止追击。",
      rule: "普通战斗结算后，行动区的牌会进入弃牌区，再轮到对方抽牌并行动。此后你可以按自己的策略自由选择主要阶段行动。",
      next: "你的首回合教学已完成。点击“确定”后，后续对局完全恢复正常操作。",
    },
  };

  function loadPlayerName() {
    try { return String(localStorage.getItem(PLAYER_NAME_KEY) || "").trim().slice(0, 16); } catch { return ""; }
  }
  let playerName = loadPlayerName();

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
    if (step === "upgrade") selectedHeroIndex = game.players[0].activeHero;
    if (step === "switch") selectedHeroIndex = null;
  }

  function continueTutorial() {
    if (tutorial.mode !== "explain") return;
    const completed = tutorial.completed;
    const steps = ["charge", "upgrade", "switch", "battle", "end"];
    // 现行规则中非追击战斗结算会直接结束回合；保留结束回合讲解，但不要求玩家执行不可能的额外操作。
    if (completed === "battle") {
      tutorial.mode = "explain";
      tutorial.completed = "end";
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
      tutorial.mode = "off";
      tutorial.step = "charge";
      toast("新手指引完成，后续对局可自由行动。");
    }
    render();
    if (aiMayAct()) runAiTurn();
  }

  function renderTutorial() {
    const activeStep = tutorialIsActive() ? TUTORIAL_STEPS[tutorial.step] : null;
    elements.tutorialHint.classList.toggle("hidden", !activeStep);
    elements.tutorialHint.innerHTML = activeStep ? `<b>${escapeHtml(activeStep.title)}</b><span>　${escapeHtml(activeStep.instruction)}</span>` : "";
    const explaining = tutorial.mode === "explain" && TUTORIAL_STEPS[tutorial.completed];
    elements.tutorialExplainOverlay.classList.toggle("hidden", !explaining);
    if (!explaining) return;
    const step = TUTORIAL_STEPS[tutorial.completed];
    elements.tutorialExplainTitle.textContent = `${step.title}：规则说明`;
    elements.tutorialExplainRule.textContent = step.rule;
    elements.tutorialExplainNext.textContent = step.next;
    elements.tutorialExplainConfirm.textContent = tutorial.completed === "end" ? "确定，开始自由对局" : "确定，进行下一步";
  }

  function loadLocalStats() {
    const empty = { games: 0, wins: 0, damageDealt: 0, damageReceived: 0, cardsPlayed: 0 };
    try {
      const saved = JSON.parse(localStorage.getItem(STATS_KEY) || "null");
      return saved && Object.keys(empty).every((key) => Number.isFinite(saved[key])) ? Object.assign(empty, saved) : empty;
    } catch { return empty; }
  }

  function persistStats() {
    try { localStorage.setItem(STATS_KEY, JSON.stringify(localStats)); } catch { /* 本地存储不可用时仍可继续对局 */ }
  }

  function statsHtml(stats) {
    const rate = stats.games ? `${Math.round(stats.wins / stats.games * 100)}%` : "0%";
    return [
      [stats.games, "总对局"], [stats.wins, "胜场"], [rate, "胜率"],
      [stats.damageDealt, "造成伤害"], [stats.damageReceived, "受到伤害"], [stats.cardsPlayed, "打出卡牌"],
    ].map(([value, label]) => `<div class="stat-item"><b>${escapeHtml(value)}</b><small>${label}</small></div>`).join("");
  }

function loadSavedGame() {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      return saved && saved.version === 1 && saved.snapshot ? saved : null;
    } catch { return null; }
  }

  function renderSaveSlot() {
    const saved = loadSavedGame();
    if (!saved) {
      elements.saveSlotInfo.textContent = "暂无可加载的对局存档。";
      elements.saveSlotInfo.classList.add("empty-hand");
      elements.loadGame.disabled = true; elements.deleteSave.disabled = true;
      return;
    }
    const date = new Date(saved.savedAt);
    const time = Number.isNaN(date.getTime()) ? "未知时间" : date.toLocaleString("zh-CN", { hour12: false });
    const turn = saved.snapshot.turn || 0;
    elements.saveSlotInfo.textContent = `第 ${turn} 回合 · ${time} · ${saved.snapshot.phase === "pursuit" ? "追击中" : "行动阶段"}`;
    elements.saveSlotInfo.classList.remove("empty-hand");
    elements.loadGame.disabled = false; elements.deleteSave.disabled = false;
  }

  function saveCurrentGame() {
    if (!game || uiLocked || game.pending || game.pendingChoice || game.pendingPayment) return toast("请在没有待响应或待选择效果时保存对局");
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 1, savedAt: new Date().toISOString(), aiDifficulty, snapshot: game.snapshot() }));
      renderSaveSlot(); toast("对局已保存，可在主菜单的“加载游戏”继续");
    } catch { toast("保存失败：浏览器本地存储不可用"); }
  }

  function restoreSavedGame() {
    const saved = loadSavedGame();
    if (!saved) return toast("没有可加载的存档");
    const restored = new DuelGame({ seed: Date.now() });
    const result = restored.loadSnapshot(saved.snapshot);
    if (!result.ok) return toast(result.reason);
    game = restored; if (playerName) game.players[0].name = playerName; aiDifficulty = DIFFICULTIES[saved.aiDifficulty] ? saved.aiDifficulty : "novice"; applyAiIdentity();
    selectedCardUid = null; selectedHeroIndex = game.players[0]?.activeHero || 0; aiRunning = false; uiLocked = false; interactionMode = null; upgradeHeroIndex = null; setupMulliganUids = []; upgradeDiscardUids = []; matchRecorded = false; lastAnimatedDrawTurn = game.lastTurnDraw?.turn || -1; tutorial = { mode: "off", step: "charge", completed: null };
    elements.mainMenuOverlay.classList.add("hidden"); elements.gameOverOverlay.classList.add("hidden"); elements.responseOverlay.classList.add("hidden"); elements.setupOverlay.classList.toggle("hidden", !game.setupPhase);
    render(); checkAiService().then(render); toast("已加载保存的对局");
    if (!game.setupPhase && aiMayAct()) setTimeout(runAiTurn, 500);
  }

  function deleteSavedGame() {
    localStorage.removeItem(SAVE_KEY); renderSaveSlot(); toast("局内存档已删除");
  }

  function showMenuPage(page) {
    const panels = { start: $("#menuStartPanel"), load: $("#menuLoadPanel"), settings: $("#menuSettingsPanel"), stats: $("#menuStatsPanel") };
    Object.entries(panels).forEach(([key, panel]) => panel.classList.toggle("hidden", key !== page));
    document.querySelectorAll("[data-menu-page]").forEach((button) => button.classList.toggle("active", button.dataset.menuPage === page));
    if (page === "load") renderSaveSlot();
    if (page === "stats") renderStats();
    if (page === "settings") { syncPlayerNameInputs(); elements.returnToGame.disabled = !game; refreshApiSettings(); }
  }

  async function refreshApiSettings() {
    await checkAiService();
    elements.apiConfigStatus.textContent = aiService.configured ? `当前：DeepSeek 已启用（${aiService.model || "默认模型"}）` : "当前：本地 AI 逻辑";
  }

  async function configureApiKey(apiKey) {
    if (!/^https?:$/.test(location.protocol)) return toast("请通过启动器打开游戏后再设置 API");
    try {
      const response = await fetch("/api/configure-ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "配置失败");
      elements.apiKeyInput.value = ""; await refreshApiSettings();
      syncDifficultyAvailability();
      if (payload.configured) elements.apiOnboardingOverlay.classList.add("hidden");
      toast(payload.configured ? "DeepSeek AI 已保存，下次启动会自动启用" : "已清除 Key，已切换为本地 AI");
    } catch { toast("API 配置失败，请检查 Key 后重试"); }
  }

  function exitGame() {
    window.close();
    setTimeout(() => {
      document.body.innerHTML = '<main class="exit-screen"><p class="eyebrow">Wuthering Waves: Duel</p><h1>游戏已退出</h1><p>本地服务会在关闭启动器窗口后停止。现在可以关闭此浏览器窗口。</p></main>';
    }, 100);
  }
  function renderStats() {
    elements.menuStats.innerHTML = statsHtml(localStats);
    if (game) elements.gameOverStats.innerHTML = statsHtml({
      games: 1, wins: game.winner === 0 ? 1 : 0,
      damageDealt: game.matchStats.damageDealt[0], damageReceived: game.matchStats.damageReceived[0], cardsPlayed: game.matchStats.cardsPlayed[0],
    });
  }

  function recordMatch() {
    if (!game || matchRecorded || game.winner == null) return;
    matchRecorded = true;
    localStats.games += 1;
    localStats.wins += game.winner === 0 ? 1 : 0;
    localStats.damageDealt += game.matchStats.damageDealt[0];
    localStats.damageReceived += game.matchStats.damageReceived[0];
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
    if (!/^https?:$/.test(location.protocol)) {
      aiService = { configured: false, model: "", available: false };
      elements.aiModeBadge.textContent = "本地 AI · 服务启动后启用 DeepSeek";
      syncDifficultyAvailability();
      return;
    }
    try {
      const response = await fetch("/api/status", { cache: "no-store" });
      const status = await response.json();
      aiService = { configured: Boolean(status.configured), model: status.model || "", available: response.ok };
      elements.aiModeBadge.textContent = status.configured ? `DeepSeek · ${status.model}` : "本地 AI · 未配置 Key";
    } catch {
      aiService = { configured: false, model: "", available: false };
      elements.aiModeBadge.textContent = "本地 AI · 服务不可用";
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 22000);
    try {
      const response = await fetch("/api/ai-move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, state, legal, difficulty: aiDifficulty }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      return result.decision || null;
    } catch (error) {
      game.log(`DeepSeek 决策失败，已切换本地 AI（${error.name === "AbortError" ? "超时" : "接口错误"}）。`, "system");
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

  function heroArtPath(heroOrId) {
    const hero = typeof heroOrId === "string" ? { id: heroOrId } : heroOrId;
    const topCard = hero?.stack?.[hero.stack.length - 1];
    const art = topCard?.art || HEROES[hero?.id]?.art;
    return art ? `card-library/${art}` : "";
  }

  function actionArtPath(cardKey) {
    const card = window.WavesDuelCardLibrary?.cards?.find((item) => item.id === cardKey);
    return card?.art ? `card-library/${card.art}` : "";
  }

  function cardGlyph(card) {
    if (card.kind === "character") return card.name.slice(0, 1);
    if (card.kind === "attack") return card.tone === "blaze" ? "╳" : card.tone === "gale" ? "≋" : "◉";
    return card.heal ? "+" : card.draw ? "≡" : "◇";
  }

  function kindLabel(kind) {
    return { character: "主角", attack: "攻击", dodge: "躲避" }[kind] || kind;
  }

  function cardHtml(card, ownerIndex, options) {
    const settings = options || {};
    const multiChoiceMode = interactionMode === "upgrade-card" || interactionMode === "hand-limit";
    const singleChoiceMode = interactionMode === "charge-select" || interactionMode === "battle-select";
    const choiceSelected = (multiChoiceMode && upgradeDiscardUids.includes(card.uid)) || (singleChoiceMode && card.uid === selectedCardUid);
    const selected = (card.uid === selectedCardUid || (multiChoiceMode && upgradeDiscardUids.includes(card.uid))) && !settings.response;
    const cost = game.cardCost(ownerIndex, card);
    const unaffordable = !settings.setupMulligan && (cost > game.players[ownerIndex].energy || !game.canUseCard(ownerIndex, card));
    const actionArt = actionArtPath(card.key);
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
    if (card.kind === "attack") effects.push(`速度 ${stats.speed} · 攻击 ${stats.attack}`);
    if (card.kind === "dodge" && stats.attack) effects.push(`攻击 ${stats.attack}`);
    if (card.heal) effects.push(`治疗己方 · ${card.heal} 点生命`);
    if (card.shield) effects.push(`保护己方 · ${card.shield} 点护盾`);
    if (card.draw) effects.push(`己方抽 ${card.draw} 张牌`);
    if (stats.bonus) effects.push(stats.bonus);
    if (!effects.length) effects.push("蓝色躲避：只在结算成功时触发效果");
    return `${game.players[ownerIndex].name}：${effects.join("；")}`;
  }

  function setAnimationScene(html, className) {
    elements.animationLayer.className = `animation-layer ${className || ""}`.trim();
    elements.animationLayer.innerHTML = html;
  }

  function hideAnimationScene() {
    elements.animationLayer.className = "animation-layer hidden";
    elements.animationLayer.innerHTML = "";
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

  async function animateDraw(playerIndex, count, reason = "抽牌") {
    if (!count) return;
    const ownerName = game.players[playerIndex].name;
    const cards = Array.from({ length: count }, (_, index) => `<i class="draw-card" style="--draw-index:${index}">◇</i>`).join("");
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

  async function animateTurnDraw() {
    const draw = game?.lastTurnDraw;
    if (!draw || draw.turn === lastAnimatedDrawTurn) return;
    lastAnimatedDrawTurn = draw.turn;
    await animateDraw(draw.playerIndex, draw.count, draw.opening ? "首回合抽牌" : "回合抽牌");
  }

  async function animateBattleShowcase(result) {
    const isDraw = result.winningPlayer == null;
    const showcase = (card, ownerIndex, caption) => `<div class="battle-showcase-card"><span>${escapeHtml(game.players[ownerIndex].name)}</span>${card ? cardHtml(card, ownerIndex, { response: true }) : '<div class="contest-card-back"><span>◇</span><small>NO CARD</small></div>'}<small>${escapeHtml(caption)}</small></div>`;
    const cards = isDraw
      ? `${showcase(result.initiatorCard, result.initiator, "双方效果展示")}<b class="battle-showcase-vs">VS</b>${showcase(result.responseCard, result.responder, "双方效果展示")}`
      : result.winningPlayer === result.initiator
        ? showcase(result.initiatorCard, result.initiator, "战斗胜利 · 效果触发")
        : showcase(result.responseCard, result.responder, "战斗胜利 · 效果触发");
    const title = isDraw ? "战斗平局 · 双方展示效果" : `${game.players[result.winningPlayer].name} 战斗胜利`;
    setAnimationScene(`<div class="battle-showcase-scene ${isDraw ? "draw" : "victory"}"><p class="scene-kicker">BATTLE RESOLUTION</p><h2>${escapeHtml(title)}</h2><div class="battle-showcase-cards">${cards}</div></div>`, "battle-showcase-animation");
    await delay(180);
    elements.animationLayer.classList.add("animating");
    await delay(1900);
    hideAnimationScene();
  }

  async function animatePursuitShowcase(card, ownerIndex) {
    setAnimationScene(`<div class="battle-showcase-scene victory"><p class="scene-kicker">PURSUIT</p><h2>${escapeHtml(game.players[ownerIndex].name)} 发动追击</h2><div class="battle-showcase-cards"><div class="battle-showcase-card"><span>红色行动卡</span>${cardHtml(card, ownerIndex, { response: true })}<small>追击效果即将结算</small></div></div></div>`, "battle-showcase-animation");
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
    const rightBack = '<div class="contest-card-back"><span>◇</span><small>NO CARD</small></div>';
    setAnimationScene(`
      <div class="contest-scene cover-stage">
        <p class="scene-kicker">FACE-DOWN CONTEST</p>
        <h2>双方盖牌</h2>
        <div class="contest-board">
          <div class="contest-side"><span>${escapeHtml(game.players[leftOwner].name)}</span><div class="contest-card-back"><span>◇</span><small>HIDDEN</small></div></div>
          <div class="contest-vs">VS</div>
          <div class="contest-side"><span>${escapeHtml(game.players[rightOwner].name)}</span>${rightCard ? '<div class="contest-card-back"><span>◇</span><small>HIDDEN</small></div>' : rightBack}</div>
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
    for (const effect of result.effects || []) if (effect.draw) await animateDraw(effect.playerIndex, effect.draw, "触发抽牌效果");
    for (const effect of result.effects || []) if (effect.damage) await animateDamage(effect.opponentIndex, effect.damage);
    // 行动卡保留在行动区，回合结束阶段统一送入弃牌区。
  }

function resetUtilityModal() {
    utilityModalMode = null;
    elements.confirmChoice.hidden = true;
    elements.cancelChoice.hidden = true;
    elements.passDefense.hidden = true;
  }

  function awaitUtilityModal(mode) {
    utilityModalMode = mode;
    return new Promise((resolve) => { utilityModalResolver = resolve; });
  }

  function closeUtilityModal() {
    elements.responseOverlay.classList.add("hidden");
    const resolve = utilityModalResolver;
    utilityModalResolver = null;
    resetUtilityModal();
    if (resolve) resolve();
  }

  function showViewHandChoice(choice) {
    const cards = choice.cards || game.viewOpponentHand(choice.playerIndex);
    elements.responseTitle.textContent = "「查看对方手牌」效果";
    elements.responseDetail.textContent = "以下仅展示给你。本次查看结束后，继续正常回合流程。";
    elements.responseCards.innerHTML = cards.length ? cards.map((card) => cardHtml(card, choice.opponentIndex, { response: true })).join("") : '<span class="empty-hand">对方没有手牌</span>';
    elements.cancelChoice.hidden = false;
    elements.cancelChoice.textContent = "关闭展示";
    elements.responseOverlay.classList.remove("hidden");
    return awaitUtilityModal("view-hand");
  }

  function showPaymentChoice(choice) {
    elements.responseTitle.textContent = `「${choice.source}」的费用选择`;
    elements.responseDetail.textContent = `该对抗技能允许你支付 ${choice.cost} 点协奏费用；支付后，你将受到 ${choice.damage} 点伤害。`;
    elements.responseCards.innerHTML = '<span class="empty-hand">请根据当前局势选择是否支付。</span>';
    elements.confirmChoice.hidden = false;
    elements.confirmChoice.textContent = `支付 ${choice.cost} 点费用`;
    elements.cancelChoice.hidden = false;
    elements.cancelChoice.textContent = "不支付";
    elements.responseOverlay.classList.remove("hidden");
    return awaitUtilityModal("payment");
  }
async function animateContestWithCost(result) {
    await animateContest(result);
    const viewChoice = (result.choices || []).find((choice) => choice.type === "view-hand" && choice.playerIndex === 0);
    if (viewChoice) await showViewHandChoice(viewChoice);
    const payment = (result.paymentChoices || []).find((choice) => choice.payerIndex === 0);
    if (payment) await showPaymentChoice(payment);
    const aiPayment = (result.paymentChoices || []).find((choice) => choice.payerIndex === 1);
    if (aiPayment) game.resolvePaymentChoice(1, false);
    if (result.pursuit?.playerIndex === 0) toast(result.pursuit.remaining === Infinity ? "红色行动卡胜利：可无限连击。" : `效果授予 ${result.pursuit.remaining} 次追击：只能连击红色行动卡。`);
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
        const art = actionArtPath(card.key);
        return `<span class="charge-card" title="${escapeHtml(card.name)}">${art ? `<img src="${escapeHtml(art)}" alt="${escapeHtml(card.name)}">` : escapeHtml(card.name.slice(0, 1))}</span>`;
      }).join("")
      : '<span class="charge-empty">暂无协奏牌</span>';
    return `<div class="cost-readout"><small>COST</small><strong>${player.energy}</strong><span>可用费用</span></div><div class="resonance-bay"><b>协奏区</b><div class="charge-cards">${chargedCards}</div></div>`;
  }

  function heroHtml(hero, index, player, interactive) {
    const active = index === player.activeHero;
    const selected = player.index === 0 && index === selectedHeroIndex;
    const choiceSelected = player.index === 0 && interactionMode === "upgrade-hero" && index === selectedHeroIndex;
    const faceArt = heroArtPath(hero);
    const stackedLevels = hero.stack.map((card) => `Lv.${card.level}`).join(" + ");
    const stackLayers = hero.stack.slice(0, -1).map((_, stackIndex) => `<i class="hero-stack-layer" style="--stack-index:${stackIndex + 1}"></i>`).join("");
    return `<button type="button" class="hero-card full-face-hero ${active ? "active" : ""} ${selected ? "selected" : ""} ${choiceSelected ? "choice-selected" : ""}" data-hero="${index}" ${interactive ? "" : "tabindex=\"-1\""} aria-label="${escapeHtml(hero.name)} ${escapeHtml(stackedLevels)}${active ? '，当前领队' : ''}"><span class="hero-stack-layers" aria-hidden="true">${stackLayers}</span><img class="hero-face-image" src="${escapeHtml(faceArt)}" alt="${escapeHtml(hero.name)} ${escapeHtml(stackedLevels)} 角色卡"><span class="hero-stack-count">${escapeHtml(stackedLevels)}</span></button>`;
  }
  function zoneHtml(player, interactive) {
    const hiddenHeroes = player.heroes.map(() => `
      <div class="hero-card facedown-card" aria-label="盖放的角色牌">
        <div class="card-back-mark">◇</div><small>HIDDEN</small>
      </div>`).join("");
    const showHeroes = game.heroesRevealed || player.index === 0;
    return `
      <div class="identity-panel">
        <div class="portrait-orb">${player.index === 0 ? "巡" : "敌"}</div>
        <div>
          <p class="eyebrow">${player.index === 0 ? "PLAYER" : "OPPONENT"}</p>
          <h2>${escapeHtml(player.name)}</h2>
          <div class="life-readout"><strong>${player.hp}</strong><small>/ 20 HP</small></div>
        </div>
        <div class="resource-strip">${resourceHtml(player)}</div>
      </div>
      <div class="hero-line">${showHeroes ? player.heroes.map((hero, index) => heroHtml(hero, index, player, interactive)).join("") : hiddenHeroes}</div>
      <div class="shield-readout"><strong>${player.shield}</strong><small>SHIELD // 护盾</small><small>手牌 ${player.hand.length} · 协奏 ${player.chargeZone.length} · 弃牌 ${player.discard.length}</small></div><div class="action-zone-strip"><span>行动区</span><div>${player.actionZone.length ? player.actionZone.map((card) => `<i style="--tone-color:${toneStyle(card.tone)}">${card.facedown ? "◇" : escapeHtml(card.name.slice(0, 1))}</i>`).join("") : "暂无行动卡"}</div></div>`;
  }

  function renderZones() {
    elements.aiZone.innerHTML = zoneHtml(game.players[1], false);
    elements.playerZone.innerHTML = zoneHtml(game.players[0], true);
    elements.playerZone.querySelectorAll("[data-hero]").forEach((button) => {
      button.addEventListener("click", () => {
        if (uiLocked) return;
        selectedHeroIndex = Number(button.dataset.hero);
        // 普通查看时，角色与手牌只能选中其一，避免旧手牌遮住角色的叠放技能预览。
        if (interactionMode !== "upgrade-card" && interactionMode !== "hand-limit") selectedCardUid = null;
        if (interactionMode === "upgrade-hero" || interactionMode === "upgrade-card") {
          const hero = game.players[0].heroes[selectedHeroIndex];
          if (hero.level >= 2) return toast("该角色已经达到 Lv.2");
          // 升级过程中允许改选另一名角色；之前勾选的弃牌必须重置，避免把代价错付给新目标。
          upgradeHeroIndex = selectedHeroIndex;
          interactionMode = "upgrade-card";
          selectedCardUid = null;
          upgradeDiscardUids = [];
        }
        render();
      });
    });
  }

  function renderDecks() {
    const block = (player) => `<div class="pile-group"><div><div class="deck-stack"></div><span>牌库 ${player.deck.length}</span></div><div class="discard-stack" data-discard-player="${player.index}"><b>弃</b><span>${player.discard.length}</span></div></div>`;
    elements.aiDeck.innerHTML = block(game.players[1]);
    elements.playerDeck.innerHTML = block(game.players[0]);
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
          <div class="arena-card-back"><b>◇</b><small>已盖牌</small></div>
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
              ? game.upgradeOptions(0, upgradeHeroIndex).sort((a, b) => b.level - a.level)[0]?.level || 0
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
          render();
          return;
        }
        selectedCardUid = selectedCardUid === button.dataset.card ? null : button.dataset.card;
        selectedHeroIndex = null;
        render();
      });
    });
  }

  function cancelUpgrade() {
    interactionMode = null;
    upgradeHeroIndex = null;
    upgradeDiscardUids = [];
    selectedCardUid = null;
    render();
  }

  function renderUpgradeGuide() {
    const upgrading = interactionMode === "upgrade-hero" || interactionMode === "upgrade-card";
    const actionSelecting = interactionMode === "charge-select" || interactionMode === "battle-select";
    elements.upgradeGuide.classList.toggle("hidden", !(upgrading || actionSelecting));
    if (!(upgrading || actionSelecting)) return;
    if (interactionMode === "charge-select") {
      const card = selectedCard();
      elements.upgradeGuideTitle.textContent = "选择要放入协奏区的手牌";
      elements.upgradeGuideDetail.textContent = "点击 1 张手牌。确认后，它会以正面朝上放入左侧协奏区，并提供 1 点 COST。";
      elements.upgradeGuideSummary.innerHTML = `<b>已选择：${card ? escapeHtml(card.name) : "未选择"}</b><span>${card ? `确认后获得 1 点费用；本回合不可撤销。` : "蓝色光标会标记你选中的手牌。"}</span>`;
      elements.confirmUpgrade.textContent = "确认充能";
      elements.cancelUpgrade.textContent = "取消";
      elements.confirmUpgrade.disabled = !card;
      return;
    }
    if (interactionMode === "battle-select") {
      const card = selectedCard();
      const legal = card && game.legalContestCards(0).some((item) => item.uid === card.uid);
      elements.upgradeGuideTitle.textContent = "选择本次战斗行动卡";
      elements.upgradeGuideDetail.textContent = "点击 1 张满足费用和额外条件的手牌；确认后将背面朝上盖放，双方翻牌时才支付费用。";
      elements.upgradeGuideSummary.innerHTML = `<b>已选择：${card ? escapeHtml(card.name) : "未选择"}</b><span>${card ? `COST ${game.cardCost(0, card)} · ${legal ? "满足使用条件" : "当前不满足使用条件"}` : "蓝色光标会标记你选中的手牌。"}</span>`;
      elements.confirmUpgrade.textContent = "确认进入战斗";
      elements.cancelUpgrade.textContent = "取消";
      elements.confirmUpgrade.disabled = !legal;
      return;
    }
    elements.confirmUpgrade.textContent = "确认升级";
    elements.cancelUpgrade.textContent = "取消升级";
    if (interactionMode === "upgrade-hero") {
      elements.upgradeGuideTitle.textContent = "选择要升级的角色";
      elements.upgradeGuideDetail.textContent = "点击场上任意一张未达到 Lv.2 的角色卡。蓝色光标表示当前选择。";
      elements.upgradeGuideSummary.innerHTML = '<span>尚未选择角色</span>';
      elements.confirmUpgrade.disabled = true;
      return;
    }
    const hero = game.players[0].heroes[upgradeHeroIndex];
    const candidate = game.upgradeOptions(0, upgradeHeroIndex).sort((a, b) => b.level - a.level)[0];
    const selectedCards = upgradeDiscardUids.map((uid) => game.findHandCard(0, uid)).filter(Boolean);
    const required = candidate?.level || 0;
    elements.upgradeGuideTitle.textContent = `升级 ${hero.name} 至 Lv.${candidate?.level ?? "?"}`;
    elements.upgradeGuideDetail.textContent = `请选择 ${required} 张手牌作为弃牌代价；已选 ${selectedCards.length}/${required}。也可点击另一名未满级角色重新选择，已选弃牌会自动清空。`;
    elements.upgradeGuideSummary.innerHTML = `<b>角色：${escapeHtml(hero.name)}</b><span>弃牌：${selectedCards.length ? selectedCards.map((card) => escapeHtml(card.name)).join("、") : "未选择"}</span>`;
    elements.confirmUpgrade.disabled = !candidate || selectedCards.length !== required;
  }

  function selectedCard() {
    return selectedCardUid ? game.findHandCard(0, selectedCardUid) : null;
  }

  function renderSelection() {
    const card = selectedCard();
    const hero = selectedHeroIndex == null ? null : game.players[0].heroes[selectedHeroIndex];
    if (card) {
      const metrics = [];
      const stats = game.cardStats(0, card);
      if (card.kind === "attack") metrics.push(`速度 ${stats.speed} · 攻击 ${stats.attack}`);
    if (card.kind === "dodge" && stats.attack) metrics.push(`攻击 ${stats.attack}`);
      if (card.heal) metrics.push(`治疗 ${card.heal}`);
      elements.selection.classList.remove("empty");
      elements.selection.innerHTML = `<div class="preview-card" style="--tone-color:${toneStyle(card.tone)}">
        <span class="tone-tag">${escapeHtml(toneLabel(card.tone))} // ${escapeHtml(kindLabel(card.kind))}</span>
        <h3>${escapeHtml(card.name)}</h3>
        <span class="cost-line">COST ${game.cardCost(0, card)} ${metrics.length ? `// ${escapeHtml(metrics.join(" · "))}` : ""}</span>
        <p class="description">${escapeHtml(card.text || "")}</p>
      </div>`;
      return;
    }
    if (hero) {
      const stackedEffects = hero.stack.map((roleCard) => `<li><b>Lv.${roleCard.level}</b><span>${escapeHtml(roleCard.text || "该等级没有额外文字效果。")}</span></li>`).join("");
      elements.selection.classList.remove("empty");
      elements.selection.innerHTML = `<div class="preview-card" style="--tone-color:${toneStyle(hero.passiveTone)}">
        <span class="tone-tag">${escapeHtml(toneLabel(hero.passiveTone))} // 角色技能</span>
        <h3>${escapeHtml(hero.name)} · Lv.${hero.level}</h3>
        <span class="cost-line">已叠放 ${hero.stack.length} 张角色卡${selectedHeroIndex === game.players[0].activeHero ? " // 当前领队" : " // 后台角色"}</span>
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
    const used = [human.chargedThisTurn, human.upgradedThisTurn, human.switchedThisTurn].filter(Boolean).length;
    elements.resonanceBadge.textContent = pursuing ? "追击中" : canTakeMainAction ? `已用 ${used}/3` : canAct ? "战斗已结束" : "等待";
    elements.resonanceBadge.classList.toggle("used", used === 3);
    const upgrading = interactionMode === "upgrade-hero" || interactionMode === "upgrade-card";
    const actionSelecting = interactionMode === "charge-select" || interactionMode === "battle-select";
    const handLimit = interactionMode === "hand-limit";
    elements.upgrade.querySelector("b").textContent = upgrading ? "取消升级" : "升级";
    elements.upgrade.querySelector("small").textContent = interactionMode === "upgrade-hero"
      ? "请从场上选择要升级的角色"
      : interactionMode === "upgrade-card"
        ? `请选择 ${game.upgradeOptions(0, upgradeHeroIndex).sort((a, b) => b.level - a.level)[0]?.level ?? 0} 张手牌，再点击升级确认`
        : "先选角色，再选择弃牌代价";
    elements.charge.querySelector("b").textContent = interactionMode === "charge-select" ? "取消充能" : "充能";
    elements.charge.querySelector("small").textContent = interactionMode === "charge-select" ? "请单独选择手牌后确认" : "选择 1 张手牌放入协奏区";
    elements.charge.disabled = !(tutorialAllows("charge") && canTakeMainAction && !upgrading && !human.chargedThisTurn);
    elements.upgrade.disabled = !(tutorialAllows("upgrade") && canTakeMainAction && !actionSelecting && (upgrading || (!human.upgradedThisTurn && human.hand.length && human.heroes.some((hero) => hero.level < 2))));
    elements.switch.disabled = !(tutorialAllows("switch") && canTakeMainAction && !upgrading && !actionSelecting && !human.switchedThisTurn && selectedHeroIndex != null && selectedHeroIndex !== human.activeHero);
    const pursuitAllowed = pursuing && card && game.legalPursuitCards(0).some((item) => item.uid === card.uid);
    elements.play.querySelector("b").textContent = pursuing ? "继续红色连击" : interactionMode === "battle-select" ? "取消战斗选择" : "进入战斗";
    elements.play.querySelector("small").textContent = pursuing ? "只能打出红色行动卡，费用须足够" : interactionMode === "battle-select" ? "请单独选择手牌后确认" : "双方同时翻牌后才扣除费用";
    elements.endTurn.querySelector("b").textContent = handLimit ? "确认弃牌" : pursuing ? "停止追击" : "结束回合";
    elements.endTurn.querySelector("small").textContent = handLimit ? `还需弃置 ${Math.max(0, human.hand.length - 8)} 张手牌` : pursuing ? "结束本次连续攻击" : "跳过战斗，交给对手";
    elements.play.disabled = !(pursuitAllowed || (tutorialAllows("battle") && canTakeMainAction && !upgrading && (interactionMode === "battle-select" || game.legalContestCards(0).length > 0)));
    elements.endTurn.disabled = handLimit ? upgradeDiscardUids.length !== Math.max(0, human.hand.length - 8) : !(tutorialAllows("end") && (canAct || pursuing));
  }

  function renderLogs() {
    elements.logs.innerHTML = game.logs.slice(0, 24).map((entry) =>
      `<div class="log-entry ${escapeHtml(entry.type)}">${escapeHtml(entry.message)}</div>`
    ).join("");
  }

  function renderStatus() {
    elements.turnNumber.textContent = String(game.turn).padStart(2, "0");
    elements.turnOwner.textContent = game.winner != null
      ? "对局已结束"
      : game.setupPhase ? "准备阶段" : game.activePlayer === 0 ? "你的回合" : aiThinkingLabel;
    if (game.pending) {
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
    } else if (game.activePlayer === 0) {
      elements.statusTitle.textContent = interactionMode === "charge-select" ? "选择充能手牌" : interactionMode === "battle-select" ? "选择战斗行动卡" : interactionMode === "upgrade-hero" ? "选择升级角色" : interactionMode === "upgrade-card" ? "选择弃置手牌" : "主要阶段";
      elements.statusDetail.textContent = interactionMode === "charge-select"
        ? "选择 1 张手牌后，在中间确认框确认充能"
        : interactionMode === "battle-select"
          ? "选择 1 张行动卡后，在中间确认框确认盖放"
        : interactionMode === "upgrade-hero"
        ? "领队或后台角色都可以升级"
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
    elements.setupHeroes.innerHTML = game.players[0].heroes.map((hero, index) => heroHtml(hero, index, game.players[0], true)).join("");
    elements.setupMulliganCards.innerHTML = game.players[0].hand.map((card) => cardHtml(card, 0, { setupMulligan: true })).join("");
    elements.setupMulliganCards.querySelectorAll("[data-setup-mulligan]").forEach((button) => button.addEventListener("click", () => { const uid = button.dataset.setupMulligan; setupMulliganUids = setupMulliganUids.includes(uid) ? setupMulliganUids.filter((id) => id !== uid) : [...setupMulliganUids, uid]; renderSetup(); }));
    elements.setupHeroes.querySelectorAll("[data-hero]").forEach((button) => {
      button.addEventListener("click", () => {
        selectedHeroIndex = Number(button.dataset.hero);
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
    if (interactionMode === "upgrade-card" || interactionMode === "upgrade-hero") return cancelUpgrade();
    interactionMode = "upgrade-hero";
    upgradeHeroIndex = null;
    upgradeDiscardUids = [];
    selectedCardUid = null;
    selectedHeroIndex = null;

    render();
  }

  async function completeUpgrade() {
    if (interactionMode === "charge-select") return completeCharge();
    if (interactionMode === "battle-select") return completeBattleSelection();
    if (upgradeHeroIndex == null) return;
    const heroIndex = upgradeHeroIndex;
    const candidate = game.upgradeOptions(0, heroIndex).sort((a, b) => b.level - a.level)[0];
    if (!candidate) return toast("角色卡组中没有可展示的同名升级角色卡");
    if (upgradeDiscardUids.length !== candidate.level) return toast(`请选择 ${candidate.level} 张手牌作为 Lv.${candidate.level} 升级代价`);
    const cards = upgradeDiscardUids.map((uid) => game.findHandCard(0, uid)).filter(Boolean);
    uiLocked = true;
    const result = game.upgrade(0, heroIndex, candidate.id, upgradeDiscardUids);
    interactionMode = null;
    upgradeHeroIndex = null;
    upgradeDiscardUids = [];
    selectedCardUid = null;
    render();
    if (!result.ok) { uiLocked = false; render(); return toast(result.reason); }
    for (const card of cards) await animateCardTransfer(card, 0, `弃置「${card.name}」作为升级代价`, "to-discard", 800);
    await animateUpgrade(0, heroIndex, result.fromLevel, result.toLevel);
    uiLocked = false;
    completeTutorialStep("upgrade");
    render();
  }

  async function doSwitch() {
    if (!tutorialAllows("switch")) return toast(`新手指引中请先完成：${TUTORIAL_STEPS[tutorial.step].title}`);
    if (selectedHeroIndex == null) return;
    uiLocked = true;
    const result = game.switchHero(0, selectedHeroIndex);
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
    if (!isCombo) {
      if (interactionMode === "battle-select") return cancelUpgrade();
      if (interactionMode || !game.legalContestCards(0).length) return;
      interactionMode = "battle-select";
      selectedCardUid = null;
      render();
      return;
    }
    const uid = selectedCardUid;
    if (!uid) return;
    uiLocked = true;
    const result = game.playCombo(0, uid);
    selectedCardUid = null;
    render();
    if (!result.ok) {
      uiLocked = false;
      render();
      return toast(result.reason);
    }
    if (isCombo) {
      await animatePursuitShowcase(result.card, 0);
      await animateCardTransfer(result.card, 0, "红色连击直击", "to-action", 900);
      await animateSpentEnergy(result.spentCards, 0);
      if (result.choice?.type === "combo-switch") {
        showComboChoice(result.choice);
        return;
      }
      await animateDamage(1, result.effect?.damage || 0);
      uiLocked = false;
      render();
      if (aiMayAct()) await runAiTurn();
      return;
    }
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
    if (aiMayAct()) await runAiTurn();
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
      await animateDamage(1, result.effect?.damage || 0);
      uiLocked = false; render();
      if (aiMayAct()) await runAiTurn();
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
    aiThinkingLabel = aiService.configured ? "DeepSeek 正在盖牌" : "AI 正在盖牌";
    render();
    const legalCards = game.legalResponses(1);
    const decision = await requestAiDecision("contest_response", aiPublicState(), {
      responseCards: legalCards.map(cardForAi),
      mayPass: legalCards.length === 0,
    });
    const requested = decision && legalCards.find((card) => card.uid === decision.responseUid);
    const choice = requested || bestAiResponse();
    const result = game.respondContest(1, choice ? choice.uid : null);
    if (!result.ok) {
      aiRunning = false;
      uiLocked = false;
      render();
      return toast(result.reason);
    }
    await animateContestWithCost(result);
    aiRunning = false;
    uiLocked = false;
    aiThinkingLabel = "AI 行动中";
    if (result.initiator === 0) completeTutorialStep("battle");
    render();
    if (aiMayAct()) await runAiTurn();
  }

  async function endHumanTurn() {
    if (!tutorialAllows("end")) return toast(`新手指引中请先完成：${TUTORIAL_STEPS[tutorial.step].title}`);
    if (interactionMode === "hand-limit") {
      const needed = Math.max(0, game.players[0].hand.length - 8);
      if (upgradeDiscardUids.length !== needed) return toast(`请选择 ${needed} 张手牌弃置`);
      const cards = upgradeDiscardUids.map((uid) => game.findHandCard(0, uid)).filter(Boolean);
      const limitResult = game.discardForHandLimit(0, upgradeDiscardUids);
      if (!limitResult.ok) return toast(limitResult.reason);
      interactionMode = null; upgradeDiscardUids = []; uiLocked = true; render();
      for (const card of cards) await animateCardTransfer(card, 0, "手牌上限弃置", "to-discard", 700);
      uiLocked = false; render();
      await animateTurnDraw();
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
    selectedCardUid = null;
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
    uiLocked = false;
    render();
    await animateTurnDraw();
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
    return game.phase === "pursuit" ? game.pursuit?.playerIndex === 1 : game.activePlayer === 1;
  }
  function aiLegalPlan() {
    const ai = game.players[1];
    if (!game.canTakeMainAction(1)) return { chargeUids: [], upgradeHeroIndexes: [], upgradeDiscardUids: [], switchHeroIndexes: [], contestUids: [], mayEndTurn: true };
    const futureEnergy = ai.energy + (!ai.chargedThisTurn && ai.hand.length ? 1 : 0);
    return {
      chargeUids: ai.chargedThisTurn ? [] : ai.hand.map((card) => card.uid),
      upgradeHeroIndexes: ai.upgradedThisTurn ? [] : ai.heroes.map((hero, index) => hero.level < 2 ? index : null).filter((value) => value != null),
      upgradeDiscardUids: ai.upgradedThisTurn ? [] : ai.hand.map((card) => card.uid),
      switchHeroIndexes: ai.switchedThisTurn ? [] : ai.heroes.map((hero, index) => index !== ai.activeHero ? index : null).filter((value) => value != null),
      contestUids: ai.hand.filter((card) => game.canUseCard(1, card) && game.cardCost(1, card) <= futureEnergy).map((card) => card.uid),
      mayEndTurn: true,
    };
  }

  function localAiPlan() {
    const ai = game.players[1];
    if (!game.canTakeMainAction(1)) return { chargeUid: null, upgrade: null, switchHeroIndex: null, contestUid: null, endTurn: true, reason: "战斗阶段已结束，直接结束回合" };
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
      ? game.upgradeOptions(1, target).sort((a, b) => b.level - a.level).find((roleCard) => upgradePool.length >= roleCard.level)
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
      const options = hero ? game.upgradeOptions(1, heroIndex).sort((a, b) => b.level - a.level) : [];
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
    await animateTurnDraw();
    return endResult;
  }

  async function runAiTurn() {
    if (aiRunning || !aiMayAct()) return;
    aiRunning = true;
    uiLocked = true;
    if (game.phase === "pursuit" && game.pursuit?.playerIndex === 1) {
      aiThinkingLabel = "AI 正在选择是否追击";
      render();
      await delay(900);
      const legalPursuits = game.legalPursuitCards(1);
      const decision = await requestAiDecision("pursuit", aiPublicState(), { pursuitCards: legalPursuits.map(cardForAi), mayStop: true });
      const pursuitCard = legalPursuits.find((card) => card.uid === decision?.pursuitUid) || legalPursuits.slice().sort((a, b) => aiCardScore(b) - aiCardScore(a))[0];
      const shouldStop = decision?.pursuitUid === null;
      if (!pursuitCard || shouldStop) {
        const result = game.endPursuit(1);
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
          await animateDamage(0, choiceResult.effect?.damage || 0);
        }
      } else await animateDamage(0, contestResult.effect?.damage || 0);
      aiRunning = false;
      uiLocked = false;
      aiThinkingLabel = "AI 行动中";
      render();
      if (aiMayAct()) return runAiTurn();
      return;
    }
    aiThinkingLabel = aiService.configured ? "DeepSeek 正在规划" : "AI 行动中";
    render();
    const decision = await requestAiDecision("turn_plan", aiPublicState(), aiLegalPlan());
    const plan = decision || localAiPlan();
    await delay(950);
    const result = await applyAiPlan(plan);
    if (decision && plan.reason) game.log(`DeepSeek：${String(plan.reason).slice(0, 90)}`, "ai");
    aiRunning = false;
    uiLocked = false;
    aiThinkingLabel = "AI 行动中";
    render();
    if (result && result.pending) showResponse();
  }

  function showResponse() {
    // AI 已经完成盖牌；响应窗口期间绝不能遗留 AI 锁。
    aiRunning = false;
    uiLocked = false;
    if (!game.pending || game.pending.responder !== 0) return;
    elements.responseTitle.textContent = `${game.players[1].name} 已盖放 1 张手牌`;
    elements.responseDetail.textContent = "选择 1 张费用足够的手牌盖放。双方选择完成后才会同时翻开。";
    const legal = game.legalResponses(0);
    elements.responseCards.innerHTML = legal.length
      ? legal.map((card) => cardHtml(card, 0, { response: true })).join("")
      : '<span class="empty-hand">没有可用的战斗手牌，将直接判定发起方通过</span>';
    elements.responseCards.querySelectorAll("[data-card]").forEach((button) => {
      button.addEventListener("click", () => resolveHumanResponse(button.dataset.card));
    });
    elements.passDefense.hidden = true;
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
    if (aiMayAct()) await runAiTurn();
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
    game = new DuelGame({ seed: Date.now(), playerName, playerPreset: elements.playerPreset?.value || "rover-female-yangyang-chixia", aiPreset: elements.aiPreset?.value || "rover-male-jinhsi-sanhua" });
    applyAiIdentity();
    if (game.coinWinner === 1) game.chooseInitiative(1, 1);
    selectedCardUid = null;
    selectedHeroIndex = 0;
    aiRunning = false;
    uiLocked = false;
    interactionMode = null;
    upgradeHeroIndex = null;
    matchRecorded = false;
    lastAnimatedDrawTurn = -1;
    setupMulliganUids = [];
    upgradeDiscardUids = [];
    hideAnimationScene();
    elements.responseOverlay.classList.add("hidden");
    elements.gameOverOverlay.classList.add("hidden");
    elements.tutorialExplainOverlay.classList.add("hidden");
    elements.tutorialHint.classList.add("hidden");
    elements.mainMenuOverlay.classList.add("hidden");
    // 开局必须先完成抛硬币与领队确认，不能直接落入不可操作的主战场。
    elements.setupOverlay.classList.remove("hidden");
    render();
    checkAiService().then(render);
  }

  function showMainMenu() {
    if (game?.winner != null) recordMatch();
    elements.responseOverlay.classList.add("hidden");
    elements.gameOverOverlay.classList.add("hidden");
    elements.setupOverlay.classList.add("hidden");
    elements.tutorialChoiceOverlay.classList.add("hidden");
    elements.tutorialExplainOverlay.classList.add("hidden");
    elements.tutorialHint.classList.add("hidden");
    tutorial = { mode: "off", step: "charge", completed: null };
    hideAnimationScene();
    renderStats();
    renderSaveSlot();
    showMenuPage("start");
    elements.mainMenuOverlay.classList.remove("hidden");
    checkAiService().then(maybeShowApiOnboarding);
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
    newGame({ keepTutorial: true });
  }

  async function confirmSetup() {
    const target = selectedHeroIndex == null ? 0 : selectedHeroIndex;
    game.chooseLeader(0, target);
    const result = game.confirmSetup(0);
    if (!result.ok) return toast(result.reason);
    elements.setupOverlay.classList.add("hidden");
    selectedHeroIndex = target;
    render();
    await animateTurnDraw();
    if (aiMayAct()) runAiTurn();
  }

  elements.charge.addEventListener("click", doCharge);
  elements.upgrade.addEventListener("click", doUpgrade);
  elements.confirmUpgrade.addEventListener("click", completeUpgrade);
  elements.cancelUpgrade.addEventListener("click", cancelUpgrade);
  elements.switch.addEventListener("click", doSwitch);
  elements.play.addEventListener("click", doPlay);
  elements.endTurn.addEventListener("click", endHumanTurn);
  elements.passDefense.addEventListener("click", () => resolveHumanResponse(null));
  elements.confirmChoice.addEventListener("click", async () => {
    if (utilityModalMode !== "payment") return;
    const result = game.resolvePaymentChoice(0, true);
    if (!result.ok) return toast(result.reason);
    closeUtilityModal(); uiLocked = true; render();
    await animateSpentEnergy(result.spentCards || [], 0);
    await animateDamage(0, result.damage || 0);
    uiLocked = false; render();
    if (aiMayAct()) await runAiTurn();
  });
  elements.cancelChoice.addEventListener("click", async () => {
    if (utilityModalMode === "view-hand") { closeUtilityModal(); return; }
    if (utilityModalMode === "payment") {
      const result = game.resolvePaymentChoice(0, false);
      if (!result.ok) return toast(result.reason);
      closeUtilityModal(); render();
      if (aiMayAct()) await runAiTurn();
    }
  });
  elements.chooseFirst.addEventListener("click", () => { const result = game.chooseInitiative(0, 0); if (!result.ok) toast(result.reason); render(); });
  elements.chooseSecond.addEventListener("click", () => { const result = game.chooseInitiative(0, 1); if (!result.ok) toast(result.reason); render(); });
  elements.mulligan.addEventListener("click", () => { const result = game.mulligan(0, setupMulliganUids); if (!result.ok) return toast(result.reason); setupMulliganUids = []; render(); toast("换牌完成，可确认领队并翻开角色"); });
  elements.confirmSetup.addEventListener("click", confirmSetup);
  elements.menuButton.addEventListener("click", showMainMenu);
  $("#restartButton").addEventListener("click", showMainMenu);
  elements.startGame.addEventListener("click", startFromMenu);
  elements.startTutorial.addEventListener("click", () => beginNewMatch(true));
  elements.skipTutorial.addEventListener("click", () => beginNewMatch(false));
  elements.tutorialExplainConfirm.addEventListener("click", continueTutorial);
  elements.savePlayerName.addEventListener("click", () => savePlayerName(elements.playerNameSettingsInput.value));
  elements.returnToGame.addEventListener("click", () => {
    if (!game) return toast("当前没有进行中的对局");
    elements.mainMenuOverlay.classList.add("hidden");
    elements.setupOverlay.classList.toggle("hidden", !game.setupPhase);
    render();
  });
  elements.saveGame.addEventListener("click", saveCurrentGame);
  elements.loadGame.addEventListener("click", restoreSavedGame);
  elements.deleteSave.addEventListener("click", deleteSavedGame);
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
  document.querySelectorAll("[data-menu-page]").forEach((button) => button.addEventListener("click", () => showMenuPage(button.dataset.menuPage)));
  $("#playAgainButton").addEventListener("click", newGame);
  elements.backToMenu.addEventListener("click", showMainMenu);
  elements.clearStats.addEventListener("click", () => {
    localStats = { games: 0, wins: 0, damageDealt: 0, damageReceived: 0, cardsPlayed: 0 };
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
  renderStats();
  showMainMenu();
})();

