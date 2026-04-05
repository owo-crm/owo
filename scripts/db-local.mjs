import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const ACTION = process.argv[2];
const ROOT = process.cwd();
const BASE_DIR = join(ROOT, ".local-postgres");
const DATA_DIR = join(BASE_DIR, "data");
const LOG_FILE = join(BASE_DIR, "postgres.log");
const PORT = process.env.OWO_DB_PORT ?? "5433";
const USER = process.env.OWO_DB_USER ?? "owocrm";
const DB_NAME = process.env.OWO_DB_NAME ?? "owocrm";

function run(cmd, args, allowFailure = false) {
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0 && !allowFailure) {
    throw new Error(`${cmd} ${args.join(" ")} failed with code ${result.status ?? -1}`);
  }

  return result.status ?? 1;
}

function runCapture(cmd, args) {
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
    encoding: "utf8",
  });

  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function ensureInit() {
  if (existsSync(DATA_DIR)) {
    return;
  }

  mkdirSync(DATA_DIR, { recursive: true });
  run("initdb", ["-D", DATA_DIR, "-A", "trust", "-U", USER]);
}

function ensureDatabase() {
  const check = runCapture("psql", [
    "-h",
    "127.0.0.1",
    "-p",
    PORT,
    "-U",
    USER,
    "-d",
    "postgres",
    "-tAc",
    `SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'`,
  ]);

  if (check.status === 0 && check.stdout.trim() === "1") {
    return;
  }

  run("psql", [
    "-h",
    "127.0.0.1",
    "-p",
    PORT,
    "-U",
    USER,
    "-d",
    "postgres",
    "-c",
    `CREATE DATABASE ${DB_NAME};`,
  ]);
}

function start() {
  if (!existsSync(BASE_DIR)) {
    mkdirSync(BASE_DIR, { recursive: true });
  }

  const ready = runCapture("pg_isready", ["-h", "127.0.0.1", "-p", PORT]);
  if (ready.status === 0) {
    process.stdout.write(
      `Local Postgres already running on 127.0.0.1:${PORT} (db: ${DB_NAME}, user: ${USER})\n`,
    );
    return;
  }

  ensureInit();
  run("pg_ctl", ["-D", DATA_DIR, "-l", LOG_FILE, "-o", `-p ${PORT}`, "start"], true);
  ensureDatabase();
  process.stdout.write(
    `Local Postgres ready on 127.0.0.1:${PORT} (db: ${DB_NAME}, user: ${USER})\n`,
  );
}

function stop() {
  if (!existsSync(DATA_DIR)) {
    process.stdout.write("Local Postgres data dir not found, nothing to stop.\n");
    return;
  }

  run("pg_ctl", ["-D", DATA_DIR, "stop", "-m", "fast"], true);
  process.stdout.write("Local Postgres stopped.\n");
}

if (ACTION === "start") {
  start();
} else if (ACTION === "stop") {
  stop();
} else {
  process.stderr.write("Usage: node scripts/db-local.mjs <start|stop>\n");
  process.exit(1);
}
