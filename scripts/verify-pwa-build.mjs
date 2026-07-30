import { access, readFile, readdir, stat } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";

const isNodeBuild = process.env.NITRO_PRESET === "node-server";
const outputDirectory = isNodeBuild ? ".output/public" : "dist/client";
const serverEntry = isNodeBuild ? ".output/server/index.mjs" : "dist/server/index.mjs";
const workerPath = join(outputDirectory, "sw.js");

function fail(message) {
  console.error(`\n[PWA] Build inválido: ${message}`);
  process.exit(1);
}

try {
  await access(workerPath, constants.R_OK);
} catch {
  fail(`${workerPath} não foi gerado.`);
}
try {
  await access(serverEntry, constants.R_OK);
} catch {
  fail(`${serverEntry} não foi gerado; o pacote SSR está incompleto.`);
}

for (const requiredAsset of ["manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"]) {
  try {
    await access(join(outputDirectory, requiredAsset), constants.R_OK);
  } catch {
    fail(`${join(outputDirectory, requiredAsset)} não foi incluído no pacote.`);
  }
}

const worker = await readFile(workerPath, "utf8");
const workerStat = await stat(workerPath);
const outputFiles = await readdir(outputDirectory, { recursive: true });

if (workerStat.size < 1_000) fail("sw.js está vazio ou incompleto.");
if (/\bdefine\s*\(\s*\[/.test(worker)) fail("sw.js foi gerado como módulo AMD.");
if (/\bimportScripts\s*\(/.test(worker)) fail("sw.js possui dependência carregada por importScripts().");
if (/push-handler\.js/.test(worker)) fail("sw.js ainda depende do handler legado de push.");
if (/["'/]workbox-[a-z0-9_-]+\.js/i.test(worker)) fail("sw.js ainda referencia um chunk externo do Workbox.");
if (!worker.includes("showNotification")) fail("handler de recebimento Web Push não está no sw.js.");
if (!worker.includes("notificationclick")) fail("handler de clique da notificação não está no sw.js.");
if (!worker.includes("NOTIFICATION_CLICK")) fail("navegação após clique não está no sw.js.");
if (!worker.includes("SKIP_WAITING")) fail("fluxo de atualização não está no sw.js.");

const forbiddenArtifacts = outputFiles.filter((file) =>
  /(^|\/)(workbox-[^/]+\.js|push-handler\.js|service-worker\.js)$/i.test(file),
);
if (forbiddenArtifacts.length > 0) {
  fail(`artefatos concorrentes encontrados: ${forbiddenArtifacts.join(", ")}`);
}

console.log(
  `[PWA] OK: ${workerPath} (${workerStat.size} bytes), autossuficiente, com cache, push e notificationclick.`,
);