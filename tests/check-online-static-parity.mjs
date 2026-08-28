import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const sourceRoot = path.resolve(process.env.WAVES_DUEL_STATIC_ROOT || "mobile");
const baseUrl = new URL(process.env.WAVES_DUEL_SITE_URL || "https://wuthering-waves-duel-mobile.pages.dev/");
const outputPath = path.resolve(process.env.WAVES_DUEL_PARITY_OUTPUT || "output/测试/2026-08-23/online-static-parity.json");
const concurrency = Math.max(1, Number(process.env.WAVES_DUEL_PARITY_CONCURRENCY || 3));

function filesUnder(directory) {
  return fs.readdirSync(directory, { withFileTypes:true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(target) : [target];
  });
}
function sha256(value) { return crypto.createHash("sha256").update(value).digest("hex"); }

async function worker(queue, results) {
  while (queue.length) {
    const relative = queue.shift();
    const local = fs.readFileSync(path.join(sourceRoot, ...relative.split("/")));
    const url = new URL(relative === "index.html" ? "" : relative, baseUrl);
    url.searchParams.set("parity", Date.now().toString());
    try {
      const response = await fetch(url, { redirect:"follow", cache:"no-store" });
      const online = Buffer.from(await response.arrayBuffer());
      results.push({ relative, status:response.status, contentType:response.headers.get("content-type") || "", hashMatch:response.ok && sha256(local) === sha256(online), bytes:online.length });
    } catch (error) {
      results.push({ relative, status:0, contentType:"", hashMatch:false, bytes:0, error:error.message });
    }
  }
}

async function main() {
  const queue = filesUnder(sourceRoot).map((file) => path.relative(sourceRoot, file).replaceAll(path.sep, "/")).filter((relative) => relative !== "_headers");
  const results = [];
  await Promise.all(Array.from({ length:concurrency }, () => worker(queue, results)));
  results.sort((a,b) => a.relative.localeCompare(b.relative));
  const removedChecks = [];
  const localIndexHash = sha256(fs.readFileSync(path.join(sourceRoot, "index.html")));
  for (const relative of ["preview.html", "demo/index.html", "README.md", "card-library/art/角色牌/BP01-018.png"]) {
    const response = await fetch(new URL(`${relative}?removed=${Date.now()}`, baseUrl), { redirect:"manual", cache:"no-store" });
    const body = Buffer.from(await response.arrayBuffer());
    removedChecks.push({ relative, status:response.status, contentType:response.headers.get("content-type") || "", bytes:body.length, servesIndexFallback:sha256(body)===localIndexHash, location:response.headers.get("location") || "" });
  }
  const rootResponse = await fetch(new URL(`?headers=${Date.now()}`, baseUrl), { cache:"no-store" });
  const headers = { xContentTypeOptions:rootResponse.headers.get("x-content-type-options"), referrerPolicy:rootResponse.headers.get("referrer-policy") };
  const failures = results.filter((item) => !item.hashMatch);
  const report = { baseUrl:baseUrl.href, sourceRoot, concurrency, checked:results.length, matched:results.length-failures.length, failures, removedChecks, headers, passed:failures.length===0 && results.length>0 && headers.xContentTypeOptions==="nosniff" };
  fs.mkdirSync(path.dirname(outputPath), { recursive:true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report,null,2)}\n`, "utf8");
  console.log(JSON.stringify(report,null,2));
  if (!report.passed) process.exitCode = 1;
}

main().catch((error) => { console.error(error.stack || error); process.exit(1); });
