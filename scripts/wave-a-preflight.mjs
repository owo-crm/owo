import { execSync, spawn } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import net from "node:net";
import { extname, join } from "node:path";

const ROOT = process.cwd();
const SOURCE_DIRS = ["src", "docs", "scripts"];
const FILE_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".md"]);
const BAD_COPY_PATTERNS = [
  "\u00C2",
  "\u00E2\u20AC\u201D",
  "\u00E2\u20AC\u201C",
  "\u00E2\u20AC\u00A6",
  "\u00E2\u20AC\u00A2",
  "\uFFFD",
];

function runStep(name, command) {
  console.log(`\n[wave-a] ${name}`);
  execSync(command, {
    stdio: "inherit",
    cwd: ROOT,
    env: process.env,
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host: "127.0.0.1" });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => {
      resolve(false);
    });
  });
}

async function ensureDevServer() {
  if (await isPortOpen(3000)) {
    return null;
  }

  console.log("\n[wave-a] Starting temporary dev server on :3000 for integration...");
  const child = spawn("npm", ["run", "dev"], {
    cwd: ROOT,
    env: process.env,
    stdio: "ignore",
    shell: true,
  });

  for (let i = 0; i < 120; i += 1) {
    await sleep(1000);
    if (await isPortOpen(3000)) {
      return child;
    }
  }

  try {
    child.kill("SIGTERM");
  } catch {}
  throw new Error("DEV_SERVER_START_TIMEOUT");
}

function walkFiles(dirPath, result) {
  const entries = readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") {
        continue;
      }
      walkFiles(fullPath, result);
      continue;
    }

    if (!entry.isFile()) continue;
    if (FILE_EXTS.has(extname(entry.name))) {
      result.push(fullPath);
    }
  }
}

function scanBadCopy() {
  const files = [];
  for (const dir of SOURCE_DIRS) {
    const fullDir = join(ROOT, dir);
    if (!statSync(fullDir, { throwIfNoEntry: false })) continue;
    walkFiles(fullDir, files);
  }

  const findings = [];
  for (const file of files) {
    const content = readFileSync(file, "utf8");
    for (const pattern of BAD_COPY_PATTERNS) {
      if (content.includes(pattern)) {
        findings.push({ file, pattern });
      }
    }
  }

  if (findings.length > 0) {
    console.error("\n[wave-a] Copy quality check failed. Found mojibake patterns:");
    for (const finding of findings) {
      console.error(` - ${finding.pattern} in ${finding.file}`);
    }
    process.exit(1);
  }

  console.log("\n[wave-a] Copy quality check passed.");
}

function main() {
  runStep("Lint", "npm run lint");
  runStep("Build", "npm run build");
  return (async () => {
    let tempDevServer = null;
    try {
      tempDevServer = await ensureDevServer();
      runStep("Integration", "npm run test:integration");
      scanBadCopy();
      console.log("\n[wave-a] Preflight PASSED");
    } finally {
      if (tempDevServer) {
        try {
          tempDevServer.kill("SIGTERM");
        } catch {}
      }
    }
  })();
}

main().catch((error) => {
  console.error("\n[wave-a] Preflight FAILED:", error instanceof Error ? error.message : error);
  process.exit(1);
});
