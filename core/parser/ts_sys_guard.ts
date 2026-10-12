/**
 * The TypeScript compiler builds a Node "sys" object (file watching, env
 * variables, cwd) as soon as it is loaded. Under Deno that reads environment
 * variables, which needs `--allow-env`, although Butlermock only uses the
 * parser. TypeScript skips that setup when `process.browser` is set, so this
 * module sets it right before `typescript.ts` loads the compiler, and
 * `restore()` puts the previous value back right after.
 */
import process from "node:process";

const target = process as unknown as { browser?: unknown };
const hadBrowser = Object.hasOwn(target, "browser");
const previous = target.browser;
target.browser = true;

export function restore() {
  if (hadBrowser) target.browser = previous;
  else delete target.browser;
}
