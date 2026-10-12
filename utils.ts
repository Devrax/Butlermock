import { createDefine } from "fresh";
import { handleMockRequest } from "@core/http/mockHandler.ts";

// This specifies the type of "ctx.state" which is used to share
// data among middlewares, layouts and routes. Butlermock shares none.
export type State = Record<string, never>;

export const define = createDefine<State>();

/**
 * Route handler shared by `/api/mock` and `/api/typemocker`: `POST` goes to
 * `handleMockRequest`, every other method answers 405. Fresh 2 answers 404
 * for a route that has no handler for the request method, so the 405 has to
 * be explicit.
 */
export const mockApiHandler = define.handlers((ctx) =>
  ctx.req.method === "POST"
    ? handleMockRequest(ctx.req)
    : new Response("Method Not Allowed", {
      status: 405,
      headers: { allow: "POST" },
    })
);
