import fs from "node:fs";
import path from "node:path";
import http from "node:http";

const projectRoot = path.resolve(import.meta.dirname, "..");
const mobileRoot = path.join(projectRoot, "mobile");
const artRoot = path.join(mobileRoot, "card-library", "art");
const cdpBase = process.env.WAVES_DUEL_CDP_URL || "http://127.0.0.1:9222";
const maxLongEdge = 1200;
const quality = 0.84;

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes:true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function requestJson(url, method = "GET") {
  return new Promise((resolve, reject) => {
    const request = http.request(url, { method }, (response) => {
      let body = "";
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => {
        try { resolve(JSON.parse(body)); } catch (error) { reject(error); }
      });
    });
    request.on("error", reject);
    request.end();
  });
}

async function main() {
  const sources = walk(artRoot).filter((file) => file.toLowerCase().endsWith(".png")).sort();
  if (!sources.length) throw new Error("No PNG card art found");
  const server = http.createServer((request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");
    if (url.pathname === "/__blank") {
      response.writeHead(200, { "content-type":"text/html; charset=utf-8", "cache-control":"no-store" });
      response.end("<!doctype html><meta charset=utf-8><title>asset optimizer</title>");
      return;
    }
    if (!url.pathname.startsWith("/asset/")) { response.writeHead(404); response.end(); return; }
    const relative = decodeURIComponent(url.pathname.slice(7));
    const file = path.resolve(artRoot, relative);
    if (!file.startsWith(`${artRoot}${path.sep}`) || !fs.existsSync(file)) { response.writeHead(404); response.end(); return; }
    response.writeHead(200, { "content-type":file.endsWith(".webp") ? "image/webp" : "image/png", "cache-control":"no-store" });
    fs.createReadStream(file).pipe(response);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const target = await requestJson(`${cdpBase}/json/new?${encodeURIComponent(`http://127.0.0.1:${port}/__blank`)}`, "PUT");
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once:true });
    socket.addEventListener("error", reject, { once:true });
  });
  let sequence = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const callback = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) callback.reject(new Error(message.error.message));
    else callback.resolve(message.result);
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const rows = [];
  try {
    await send("Runtime.enable");
    for (const source of sources) {
      const relative = path.relative(artRoot, source).split(path.sep).join("/");
      const assetUrl = `http://127.0.0.1:${port}/asset/${relative.split("/").map(encodeURIComponent).join("/")}`;
      const expression = `(async()=>{const response=await fetch(${JSON.stringify(assetUrl)},{cache:"no-store"});if(!response.ok)throw new Error("asset_fetch_failed_"+response.status);const bitmap=await createImageBitmap(await response.blob());const scale=Math.min(1,${maxLongEdge}/Math.max(bitmap.width,bitmap.height));const width=Math.max(1,Math.round(bitmap.width*scale)),height=Math.max(1,Math.round(bitmap.height*scale));const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;const context=canvas.getContext("2d",{alpha:false});context.imageSmoothingEnabled=true;context.imageSmoothingQuality="high";context.drawImage(bitmap,0,0,width,height);bitmap.close();const blob=await new Promise((resolve,reject)=>canvas.toBlob((value)=>value?resolve(value):reject(new Error("webp_encode_failed")),"image/webp",${quality}));const bytes=new Uint8Array(await blob.arrayBuffer());let binary="";for(let index=0;index<bytes.length;index+=32768)binary+=String.fromCharCode(...bytes.subarray(index,index+32768));return JSON.stringify({width,height,type:blob.type,size:bytes.length,base64:btoa(binary)})})()`;
      const evaluated = await send("Runtime.evaluate", { expression, awaitPromise:true, returnByValue:true });
      if (evaluated.exceptionDetails) throw new Error(evaluated.exceptionDetails.text || `Conversion failed: ${relative}`);
      const converted = JSON.parse(evaluated.result.value);
      if (converted.type !== "image/webp" || !converted.base64) throw new Error(`WebP unsupported for ${relative}`);
      const output = source.replace(/\.png$/i, ".webp");
      fs.writeFileSync(output, Buffer.from(converted.base64, "base64"));
      rows.push({ file:relative, sourceBytes:fs.statSync(source).size, outputBytes:fs.statSync(output).size, width:converted.width, height:converted.height });
    }
    for (const catalogFile of [path.join(mobileRoot, "card-library", "catalog.js"), path.join(mobileRoot, "card-library", "catalog.json")]) {
      const before = fs.readFileSync(catalogFile, "utf8");
      const after = before.replace(/("art"\s*:\s*"[^"]+)\.png("?)/g, "$1.webp$2");
      if (after === before) throw new Error(`No catalog art paths updated in ${catalogFile}`);
      fs.writeFileSync(catalogFile, after, "utf8");
    }
  } finally {
    socket.close();
    server.closeAllConnections?.();
    server.close();
    try { await requestJson(`${cdpBase}/json/close/${target.id}`); } catch { /* QA target cleanup is best effort */ }
  }
  const sourceBytes = rows.reduce((sum, row) => sum + row.sourceBytes, 0);
  const outputBytes = rows.reduce((sum, row) => sum + row.outputBytes, 0);
  console.table(rows.map((row) => ({ file:row.file, sourceKB:Math.round(row.sourceBytes/1024), webpKB:Math.round(row.outputBytes/1024), width:row.width, height:row.height })));
  console.log(JSON.stringify({ files:rows.length, sourceBytes, outputBytes, savedBytes:sourceBytes-outputBytes, reduction:Number((1-outputBytes/sourceBytes).toFixed(4)), maxLongEdge, quality }, null, 2));
}

main().catch((error) => { console.error(error.stack || error); process.exit(1); });
