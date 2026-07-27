import { spawn } from "node:child_process";
import { createServer } from "node:net";

const host = "127.0.0.1";
const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL?.trim();
const configuredPort = process.env.PLAYWRIGHT_PORT?.trim();
const externalServer = Boolean(externalBaseURL);
let server;
let runner;
let ownsServer = false;
let stopServerPromise;

function parsePort(value) {
  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error(`Invalid PLAYWRIGHT_PORT: ${value}`);
  }

  return port;
}

function probePort(port = 0) {
  return new Promise((resolve, reject) => {
    const probe = createServer();

    probe.unref();
    probe.once("error", reject);
    probe.listen({ host, port, exclusive: true }, () => {
      const address = probe.address();
      const selectedPort =
        typeof address === "object" && address ? address.port : port;

      probe.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(selectedPort);
      });
    });
  });
}

async function resolveOwnedServerPort() {
  if (!configuredPort) {
    return probePort();
  }

  const port = parsePort(configuredPort);

  try {
    await probePort(port);
  } catch (error) {
    if (error?.code === "EADDRINUSE") {
      throw new Error(
        `PLAYWRIGHT_PORT ${port} is already occupied. Refusing to reuse a potentially stale server.`
      );
    }

    throw error;
  }

  return port;
}

function waitForProcessExit(child, timeoutMs = 5_000) {
  if (!child || child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      cleanup();
      resolve(false);
    }, timeoutMs);
    timeout.unref();

    const onExit = () => {
      cleanup();
      resolve(true);
    };
    const cleanup = () => {
      clearTimeout(timeout);
      child.off("exit", onExit);
    };

    child.once("exit", onExit);
  });
}

function runProcess(command, args, timeoutMs = 10_000) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { stdio: "ignore" });
    const timeout = setTimeout(() => {
      child.kill();
      resolve(1);
    }, timeoutMs);
    timeout.unref();
    const finish = (code) => {
      clearTimeout(timeout);
      resolve(code);
    };

    child.once("error", () => finish(1));
    child.once("exit", (code, signal) => {
      finish(code ?? (signal ? 1 : 0));
    });
  });
}

async function stopOwnedServer() {
  if (stopServerPromise) return stopServerPromise;

  stopServerPromise = (async () => {
    const ownedServer = server;

    if (
      !ownsServer ||
      !ownedServer?.pid ||
      ownedServer.exitCode !== null ||
      ownedServer.signalCode !== null
    ) {
      return;
    }

    if (process.platform === "win32") {
      await runProcess("taskkill", [
        "/pid",
        String(ownedServer.pid),
        "/T",
        "/F"
      ]);
      await waitForProcessExit(ownedServer);
      return;
    }

    try {
      process.kill(-ownedServer.pid, "SIGTERM");
    } catch {
      return;
    }

    if (await waitForProcessExit(ownedServer)) return;

    try {
      process.kill(-ownedServer.pid, "SIGKILL");
    } catch {
      return;
    }

    await waitForProcessExit(ownedServer);
  })();

  return stopServerPromise;
}

async function isServerReady(baseURL) {
  try {
    const response = await fetch(`${baseURL}/api/health`, {
      redirect: "manual",
      signal: AbortSignal.timeout(2_000)
    });
    if (response.status >= 500) return false;
    const health = await response.json();
    return health?.components?.app?.ok === true;
  } catch {
    return false;
  }
}

async function waitForServer(baseURL, ownedServer) {
  const deadline = Date.now() + 60_000;
  let startError;

  ownedServer?.once("error", (error) => {
    startError = error;
  });

  while (Date.now() < deadline) {
    if (startError) {
      throw new Error(`E2E server failed to start: ${startError.message}`);
    }

    if (
      ownedServer &&
      (ownedServer.exitCode !== null || ownedServer.signalCode !== null)
    ) {
      throw new Error(
        `E2E server exited before becoming ready (code=${ownedServer.exitCode}, signal=${ownedServer.signalCode ?? "none"}).`
      );
    }

    if (await isServerReady(baseURL)) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`E2E server did not become ready: ${baseURL}`);
}

function waitForRunner(runnerProcess, ownedServer) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      runnerProcess.off("error", onRunnerError);
      runnerProcess.off("exit", onRunnerExit);
      ownedServer?.off("error", onServerError);
      ownedServer?.off("exit", onServerExit);
    };
    const onRunnerError = (error) => {
      cleanup();
      reject(error);
    };
    const onRunnerExit = (code, signal) => {
      cleanup();
      resolve(code ?? (signal ? 1 : 0));
    };
    const onServerError = (error) => {
      cleanup();
      runnerProcess.kill();
      reject(new Error(`E2E server failed while tests were running: ${error.message}`));
    };
    const onServerExit = (code, signal) => {
      cleanup();
      runnerProcess.kill();
      reject(
        new Error(
          `E2E server exited while tests were running (code=${code}, signal=${signal ?? "none"}).`
        )
      );
    };

    runnerProcess.once("error", onRunnerError);
    runnerProcess.once("exit", onRunnerExit);
    ownedServer?.once("error", onServerError);
    ownedServer?.once("exit", onServerExit);
  });
}

async function main() {
  let baseURL = externalBaseURL;

  if (externalServer) {
    await waitForServer(baseURL);
  } else {
    const port = await resolveOwnedServerPort();
    baseURL = `http://${host}:${port}`;
    console.log(`E2E server: ${baseURL}`);

    server = spawn(
      process.execPath,
      ["node_modules/next/dist/bin/next", "start", "-H", host, "-p", String(port)],
      {
        detached: process.platform !== "win32",
        env: { ...process.env, PORT: String(port) },
        stdio: "inherit"
      }
    );
    ownsServer = true;
    await waitForServer(baseURL, server);
  }

  runner = spawn(
    process.execPath,
    ["node_modules/@playwright/test/cli.js", "test", ...process.argv.slice(2)],
    {
      env: { ...process.env, PLAYWRIGHT_BASE_URL: baseURL },
      stdio: "inherit"
    }
  );

  return Number(await waitForRunner(runner, ownsServer ? server : undefined));
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, async () => {
    runner?.kill(signal);
    await stopOwnedServer();
    process.exit(1);
  });
}

let exitCode = 1;

try {
  exitCode = await main();
} catch (error) {
  console.error(error);
} finally {
  await stopOwnedServer();
}

process.exit(exitCode);
