import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";

type NpxInvocation = {
  args: string[];
  command: string;
};

/**
 * Runs npx without a command shell on Windows.
 *
 * Spawning `npx.cmd` requires `shell: true`, which makes otherwise safe
 * arguments vulnerable to shell metacharacters. Calling npm's JS entrypoint
 * through the current Node executable preserves argument boundaries.
 */
export function getNpxInvocation(args: readonly string[]): NpxInvocation {
  if (process.platform !== "win32") {
    return { command: "npx", args: [...args] };
  }

  const npmExecPath = process.env.npm_execpath;
  const candidates = [
    npmExecPath ? resolve(dirname(npmExecPath), "npx-cli.js") : undefined,
    resolve(dirname(process.execPath), "node_modules", "npm", "bin", "npx-cli.js")
  ].filter((candidate): candidate is string => Boolean(candidate));
  const npxCliPath = candidates.find((candidate) => existsSync(candidate));

  if (!npxCliPath) {
    throw new Error(
      "Не найден безопасный npx-cli.js. Запустите команду через npm или установите Node.js с npm."
    );
  }

  return {
    command: process.execPath,
    args: [npxCliPath, ...args]
  };
}
