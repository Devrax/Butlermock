import { App, cors } from "fresh";
import { define, type State } from "./utils.ts";

/**
 * Permissive CORS for the public `/api/mock` endpoint. `/api/typemocker` is
 * for the web UI and stays same-origin.
 *
 * `cors()` answers `OPTIONS` preflights with a 204 and adds
 * `Access-Control-Allow-Origin` to every other response. The method and header
 * allow-lists were also sent on every actual response before, so they are
 * still added here.
 */
export const mockCors = [
  cors<State>({
    origin: "*",
    allowMethods: ["POST"],
    allowHeaders: ["Content-Type"],
  }),
  define.middleware(async (ctx) => {
    const res = await ctx.next();
    res.headers.set("Access-Control-Allow-Methods", "POST");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type");
    return res;
  }),
];

/**
 * The app without static files and file-system routes (`main.ts` adds those,
 * which need the Vite build), so tests can mount the real middleware and
 * route handlers on it with a plain `Request`.
 */
export function createApp(): App<State> {
  return new App<State>().use("/api/mock", ...mockCors);
}
