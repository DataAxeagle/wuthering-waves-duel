import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const mobileRoot = path.resolve(process.env.WAVES_DUEL_MOBILE_ROOT || "mobile");
const debugUrl = process.env.WAVES_DUEL_CDP_URL || "http://127.0.0.1:9222";
const baseUrl = "http://127.0.0.1:4178/";
const screenshotRoot = process.env.WAVES_DUEL_DEVICE_UI_SCREENSHOTS || "";
const skipDesktop = process.env.WAVES_DUEL_SKIP_DESKTOP === "1";
const mobileViewports = [[844,390],[852,343],[780,360],[736,350]];
const desktopViewports = [[1440,900],[1366,768],[1024,768]];
const pages = ["start","deck-builder","load","settings","stats","test-lab","codex"];

function requestJson(url, method = "GET") {
  return new Promise((resolve, reject) => {
    const request = http.request(url, { method }, (response) => {
      let body = "";
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => { try { resolve(JSON.parse(body)); } catch (error) { reject(error); } });
    });
    request.on("error", reject);
    request.end();
  });
}
function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function main() {
  const types = { ".html":"text/html; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".css":"text/css; charset=utf-8", ".json":"application/json; charset=utf-8", ".png":"image/png", ".webp":"image/webp", ".mp4":"video/mp4" };
  const server = http.createServer((request, response) => {
    const relative = decodeURIComponent(new URL(request.url, baseUrl).pathname).replace(/^\/+/, "") || "index.html";
    const file = path.resolve(mobileRoot, relative);
    if (!file.startsWith(`${mobileRoot}${path.sep}`) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return response.writeHead(404).end("not found");
    response.writeHead(200, { "content-type":types[path.extname(file).toLowerCase()] || "application/octet-stream" });
    fs.createReadStream(file).pipe(response);
  });
  await new Promise((resolve, reject) => server.listen(4178, "127.0.0.1", resolve).once("error", reject));
  const target = await requestJson(`${debugUrl}/json/new?${encodeURIComponent(`${baseUrl}?ui=mobile`)}`, "PUT");
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once:true }); socket.addEventListener("error", reject, { once:true }); });
  let sequence = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const callback = pending.get(message.id); pending.delete(message.id);
    if (message.error) callback.reject(new Error(message.error.message)); else callback.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++sequence; pending.set(id, {resolve,reject}); socket.send(JSON.stringify({id,method,params})); });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", { expression, returnByValue:true, awaitPromise:true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "browser_evaluation_failed");
    return result.result.value;
  };
  const waitReady = async () => {
    for (let index=0; index<80; index+=1) { if (await evaluate("document.readyState !== 'loading' && !!document.querySelector('#mainMenuOverlay')")) return; await delay(100); }
    throw new Error("device_ui_page_ready_timeout");
  };
  try {
    await send("Page.enable"); await send("Runtime.enable"); await waitReady();
    const mobileRows = [];
    for (const [width,height] of mobileViewports) {
      await send("Emulation.setDeviceMetricsOverride", { width,height,deviceScaleFactor:3,mobile:true,screenOrientation:{type:"landscapePrimary",angle:90} });
      await send("Emulation.setTouchEmulationEnabled", { enabled:true,maxTouchPoints:5 });
      await delay(180);
      await evaluate("document.documentElement.classList.add('compact-landscape');document.documentElement.classList.remove('desktop-ui');true");
      for (const page of pages) {
        const row = JSON.parse(await evaluate(`JSON.stringify((() => {
          document.querySelector('[data-menu-page="${page}"]')?.click();
          const active=[...document.querySelectorAll('.menu-page')].find((node)=>!node.classList.contains('hidden'));
          const layout=document.querySelector('.main-menu-layout');
          const box=(node)=>{const r=node?.getBoundingClientRect();return r?{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}:null};
          const layoutBox=box(layout),pageBox=box(active);
          const clipped=(r)=>r&&(r.left < -1 || r.top < -1 || r.right > innerWidth+1 || r.bottom > innerHeight+1);
          const badHidden=[...active.querySelectorAll('*')].filter((node)=>{const css=getComputedStyle(node);return css.overflowY==='hidden'&&node.scrollHeight>node.clientHeight+3&&!node.querySelector('[style*="overflow"]')}).slice(0,4).map((node)=>node.className||node.id||node.tagName);
          return {page:"${page}",width:innerWidth,height:innerHeight,deviceUi:document.documentElement.dataset.deviceUi,layoutClipped:clipped(layoutBox),pageClipped:clipped(pageBox),horizontal:document.documentElement.scrollWidth>innerWidth+1,badHidden};
        })())`));
        mobileRows.push(row);
        if (screenshotRoot && width===844) {
          fs.mkdirSync(screenshotRoot,{recursive:true});
          const shot=await send("Page.captureScreenshot",{format:"png",fromSurface:true});
          fs.writeFileSync(path.join(screenshotRoot,`mobile-${page}-844x390.png`),Buffer.from(shot.data,"base64"));
        }
      }
    }
    console.table(mobileRows.map(({badHidden,...row})=>({...row,badHidden:badHidden.join(",")})));
    const mobileFailures=mobileRows.filter((row)=>row.layoutClipped||row.pageClipped||row.horizontal||row.deviceUi!=="mobile");
    if(mobileFailures.length) throw new Error(`mobile_menu_layout_failed:${JSON.stringify(mobileFailures)}`);

    await send("Emulation.setDeviceMetricsOverride", { width:852,height:343,deviceScaleFactor:3,mobile:true,screenOrientation:{type:"landscapePrimary",angle:90} });
    await send("Emulation.setTouchEmulationEnabled", { enabled:true,maxTouchPoints:5 });
    await send("Page.navigate", {url:`${baseUrl}?ui=mobile`}); await waitReady(); await delay(220);
    const testLabRow=JSON.parse(await evaluate(`JSON.stringify((()=>{
      document.querySelector('[data-menu-page="test-lab"]')?.click();
      const heroSelect=document.querySelector('#testLeaderHeroSelect');
      const cardSelect=document.querySelector('#testLeaderCardSelect');
      heroSelect.value=''; heroSelect.dispatchEvent(new Event('change',{bubbles:true}));
      const leaderOptionCount=heroSelect.options.length, leaderCardOptionCount=cardSelect.options.length, automaticLevelDisabled=cardSelect.disabled;
      document.querySelector('#startTestLabButton')?.click();
      let line=document.querySelector('#playerZone .hero-line');
      const active=line?.querySelector('.hero-card.active');
      active?.click();
      document.querySelector('[data-quick-action="upgrade"]')?.click();
      const upgradeChoices=[...document.querySelectorAll('[data-upgrade-role-card]')].map((node)=>node.dataset.upgradeRoleCard);
      document.querySelector('[data-upgrade-role-card="BP01-026"]')?.click();
      const chosenUpgradePreview=document.querySelector('#upgradeDiscardPreview')?.textContent||'';
      const upgradeDiscardVisible=!document.querySelector('#upgradeDiscardOverlay')?.classList.contains('hidden');
      document.querySelector('#cancelUpgradeDiscardButton')?.click();
      const replaceSlot=[...line.querySelectorAll('.hero-card')].find((node)=>!node.classList.contains('active'));
      replaceSlot?.click();
      const replacementChoiceCount=document.querySelectorAll('[data-test-swap-hero]').length;
      document.querySelector('[data-test-swap-hero="encore"]')?.click();
      line=document.querySelector('#playerZone .hero-line');
      const heroCountAfterSwap=line?.querySelectorAll('.hero-card').length||0;
      const hasEncore=[...line.querySelectorAll('.hero-card')].some((node)=>node.getAttribute('aria-label')?.includes('安可'));
      document.querySelector('[data-role-deck-player="0"]')?.click();
      const roleDeckCount=document.querySelectorAll('#roleDeckCards .role-deck-card').length;
      return {leaderOptionCount,leaderCardOptionCount,automaticLevelDisabled,heroCount:line?.querySelectorAll('.hero-card').length||0,heroCountAfterSwap,activeLabel:active?.getAttribute('aria-label')||'',upgradeChoices,chosenUpgradePreview,upgradeDiscardVisible,replacementChoiceCount,hasEncore,roleDeckCount,horizontal:document.documentElement.scrollWidth>innerWidth+1};
    })())`));
    console.table([testLabRow]);
    if(testLabRow.leaderOptionCount!==10||testLabRow.leaderCardOptionCount!==1||!testLabRow.automaticLevelDisabled||testLabRow.heroCount!==3||testLabRow.heroCountAfterSwap!==3||!testLabRow.activeLabel.includes('炽霞')||testLabRow.upgradeChoices.length!==2||!testLabRow.upgradeChoices.includes('BP01-026')||!testLabRow.upgradeChoices.includes('SD01-006')||!testLabRow.upgradeDiscardVisible||!testLabRow.chosenUpgradePreview.includes('BP01-026')||testLabRow.replacementChoiceCount!==6||!testLabRow.hasEncore||testLabRow.roleDeckCount!==32||testLabRow.horizontal) throw new Error(`test_lab_three_character_swap_failed:${JSON.stringify(testLabRow)}`);

    await send("Page.navigate", {url:`${baseUrl}?ui=mobile`}); await waitReady(); await delay(220);
    const camellyaBefore=JSON.parse(await evaluate(`JSON.stringify((()=>{
      document.querySelector('[data-menu-page="test-lab"]')?.click();
      const heroSelect=document.querySelector('#testLeaderHeroSelect');
      const cardSelect=document.querySelector('#testLeaderCardSelect');
      heroSelect.value='camellya'; heroSelect.dispatchEvent(new Event('change',{bubbles:true}));
      cardSelect.value='BP01-002'; cardSelect.dispatchEvent(new Event('change',{bubbles:true}));
      document.querySelector('#startTestLabButton')?.click();
      const active=document.querySelector('#playerZone .hero-card.active');
      active?.click(); document.querySelector('[data-quick-action="upgrade"]')?.click();
      const title=document.querySelector('#upgradeDiscardTitle')?.textContent||'';
      const preview=document.querySelector('#upgradeDiscardPreview')?.textContent||'';
      const confirm=document.querySelector('#confirmUpgradeDiscardButton');
      const beforeConfirm=confirm?.textContent||'';
      document.querySelectorAll('#upgradeDiscardCards [data-card]').forEach((node)=>node.click());
      const afterSelect=confirm?.textContent||'';
      confirm?.click();
      return {activeBefore:active?.getAttribute('aria-label')||'',title,preview,beforeConfirm,afterSelect};
    })())`));
    await delay(5600);
    const camellyaAfter=JSON.parse(await evaluate(`JSON.stringify((()=>{
      const active=document.querySelector('#playerZone .hero-card.active');
      document.querySelector('[data-role-deck-player="0"]')?.click();
      const roleCards=[...document.querySelectorAll('#roleDeckCards [data-role-deck-card]')];
      return {activeAfter:active?.getAttribute('aria-label')||'',roleDeckCount:roleCards.length,lv2Returned:roleCards.some((node)=>node.dataset.roleDeckCard==='BP01-002')};
    })())`));
    console.table([{...camellyaBefore,...camellyaAfter}]);
    if(!camellyaBefore.activeBefore.includes('椿')||!camellyaBefore.activeBefore.includes('Lv.2')||!camellyaBefore.title.includes('再次升级')||!camellyaBefore.preview.includes('Lv.2 → Lv.1')||!camellyaBefore.beforeConfirm.includes('0/3')||!camellyaBefore.afterSelect.includes('3/3')||!camellyaAfter.activeAfter.includes('Lv.1')||camellyaAfter.activeAfter.includes('Lv.2')||camellyaAfter.roleDeckCount!==31||!camellyaAfter.lv2Returned) throw new Error(`camellya_lv2_reupgrade_failed:${JSON.stringify({camellyaBefore,camellyaAfter})}`);

    await send("Emulation.setUserAgentOverride", { userAgent:"Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1", platform:"iPad" });
    await send("Emulation.setDeviceMetricsOverride", { width:1024,height:768,deviceScaleFactor:2,mobile:true,screenOrientation:{type:"landscapePrimary",angle:90} });
    await send("Emulation.setTouchEmulationEnabled", { enabled:true,maxTouchPoints:5 });
    await send("Page.navigate", {url:`${baseUrl}?ui=mobile`}); await waitReady(); await delay(220);
    const tabletRow=JSON.parse(await evaluate(`JSON.stringify((()=>{
      document.querySelector('[data-menu-page="settings"]')?.click();
      const root=document.documentElement, range=document.querySelector('#uiScaleRange');
      range.value='112'; range.dispatchEvent(new Event('input',{bubbles:true})); range.dispatchEvent(new Event('change',{bubbles:true}));
      const layout=document.querySelector('.game-layout').getBoundingClientRect();
      return {formFactor:root.dataset.deviceFormFactor,uiScale:root.dataset.uiScale,stored:localStorage.getItem('waves-duel-ui-scale-v1'),zoom:getComputedStyle(document.body).zoom,horizontal:document.documentElement.scrollWidth>innerWidth+1,layoutLeft:layout.left,layoutRight:layout.right,viewport:innerWidth};
    })())`));
    console.table([tabletRow]);
    if(tabletRow.formFactor!=="tablet"||tabletRow.uiScale!=="112"||tabletRow.stored!=="112"||Number(tabletRow.zoom)<1.11||tabletRow.horizontal||tabletRow.layoutLeft<-1||tabletRow.layoutRight>tabletRow.viewport+1) throw new Error(`tablet_ui_scale_layout_failed:${JSON.stringify(tabletRow)}`);

    const desktopRows=[];
    if(!skipDesktop){
      await send("Page.navigate",{url:`${baseUrl}?ui=desktop`}); await waitReady();
      for(const [width,height] of desktopViewports){
        await send("Emulation.setDeviceMetricsOverride",{width,height,deviceScaleFactor:1,mobile:false});
        await send("Emulation.setTouchEmulationEnabled",{enabled:false}); await delay(180);
        const row=JSON.parse(await evaluate(`JSON.stringify((()=>{const root=document.documentElement;const side=getComputedStyle(document.querySelector('.side-panel'));const stack=getComputedStyle(document.querySelector('.action-stack'));const primary=getComputedStyle(document.querySelector('.primary-actions'));const aiPiles=getComputedStyle(document.querySelector('#aiDeckReadout'));const playerPiles=getComputedStyle(document.querySelector('#playerDeckReadout'));const effect=getComputedStyle(document.querySelector('.hand-selection-panel'));const layout=document.querySelector('.game-layout');const columns=getComputedStyle(layout).gridTemplateColumns.split(' ').filter(Boolean).length;const box=layout.getBoundingClientRect();return{width:innerWidth,height:innerHeight,deviceUi:root.dataset.deviceUi,desktopClass:root.classList.contains('desktop-ui'),columns,sideHidden:side.display==='none',actionStackHidden:stack.display==='none',primaryVisible:primary.display!=='none',pilesVisible:aiPiles.display!=='none'&&playerPiles.display!=='none',effectVisible:effect.display!=='none',horizontal:document.documentElement.scrollWidth>innerWidth+1,layoutClipped:box.left<0||box.right>innerWidth+1||box.bottom>innerHeight+1}})())`));
        desktopRows.push(row);
        if(screenshotRoot&&width===1440){const shot=await send("Page.captureScreenshot",{format:"png",fromSurface:true});fs.writeFileSync(path.join(screenshotRoot,"desktop-home-1440x900.png"),Buffer.from(shot.data,"base64"));}
      }
      console.table(desktopRows);
      const desktopFailures=desktopRows.filter((row)=>!row.desktopClass||row.deviceUi!=="desktop"||row.columns!==2||!row.sideHidden||!row.actionStackHidden||!row.primaryVisible||!row.pilesVisible||!row.effectVisible||row.horizontal||row.layoutClipped);
      if(desktopFailures.length) throw new Error(`desktop_ui_layout_failed:${JSON.stringify(desktopFailures)}`);
    }
    console.log(`Device UI layout passed: ${mobileRows.length} mobile menu states and ${desktopRows.length} desktop viewports.`);
  } finally {
    socket.close(); try { await requestJson(`${debugUrl}/json/close/${target.id}`); } catch {}
    server.closeAllConnections?.(); server.close();
  }
}

main().catch((error)=>{console.error(error.stack||error);process.exit(1);});
