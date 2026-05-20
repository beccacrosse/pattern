import { spawn } from "node:child_process";
import net from "node:net";
import readline from "node:readline";

const LOCAL_URL_RE = /Local:\s+(https?:\/\/\S+)/;
const defaultPort = Number(process.env.PORT || 3000);

function waitForServer(port) {
  return new Promise((resolve) => {
    const tryConnect = () => {
      const socket = net.connect({ port, host: "127.0.0.1" }, () => {
        socket.end();
        resolve();
      });
      socket.on("error", () => setTimeout(tryConnect, 300));
    };
    tryConnect();
  });
}

function openBrowser(target) {
  if (process.platform === "darwin") {
    spawn("open", [target], { detached: true, stdio: "ignore" }).unref();
  } else if (process.platform === "win32") {
    spawn("cmd", ["/c", "start", "", target], {
      detached: true,
      stdio: "ignore",
    }).unref();
  } else {
    spawn("xdg-open", [target], { detached: true, stdio: "ignore" }).unref();
  }
}

let opened = false;

function maybeOpen(url) {
  if (opened) return;
  opened = true;
  const port = Number(new URL(url).port || 80);
  void waitForServer(port).then(() => openBrowser(url));
}

function forwardLines(stream, write) {
  const rl = readline.createInterface({ input: stream });
  rl.on("line", (line) => {
    write(`${line}\n`);
    const match = line.match(LOCAL_URL_RE);
    if (match) maybeOpen(match[1]);
  });
}

const child = spawn("next", ["dev", ...process.argv.slice(2)], {
  stdio: ["inherit", "pipe", "pipe"],
});

forwardLines(child.stdout, (chunk) => process.stdout.write(chunk));
forwardLines(child.stderr, (chunk) => process.stderr.write(chunk));

// Fallback if Next.js output format changes
setTimeout(() => {
  if (!opened) {
    maybeOpen(`http://127.0.0.1:${defaultPort}`);
  }
}, 15_000);

child.on("exit", (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
