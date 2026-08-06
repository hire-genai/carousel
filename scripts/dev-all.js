/**
 * Starts both the Next.js dev server and the publish worker in one command.
 * Run: node scripts/dev-all.js  OR  npm run dev:all
 */

const { spawn } = require("child_process");
const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

const COLORS = { server: "\x1b[36m", worker: "\x1b[33m", reset: "\x1b[0m" };

function prefix(label, color) {
  return `${color}[${label}]${COLORS.reset} `;
}

function spawnLabeled(label, color, cmd, args, opts) {
  const proc = spawn(cmd, args, { ...opts, stdio: ["ignore", "pipe", "pipe"] });

  proc.stdout.on("data", (d) =>
    process.stdout.write(prefix(label, color) + d.toString())
  );
  proc.stderr.on("data", (d) =>
    process.stderr.write(prefix(label, color) + d.toString())
  );

  proc.on("exit", (code) => {
    console.log(`${prefix(label, color)}exited with code ${code}`);
    process.exit(code ?? 1);
  });

  return proc;
}

const server = spawnLabeled("server", COLORS.server, npmCmd, ["run", "dev"], {
  env: process.env,
  shell: isWin,
});

// Give Next.js ~3 seconds to bind before starting the worker
setTimeout(() => {
  spawnLabeled("worker", COLORS.worker, "node", ["scripts/publish-worker.js"], {
    env: process.env,
    shell: isWin,
  });
}, 3000);

function cleanup() {
  server.kill("SIGTERM");
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

console.log("Starting Next.js dev server + publish worker...\n");
