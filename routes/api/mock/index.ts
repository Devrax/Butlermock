import { Handlers } from "$fresh/server.ts";
import { handleMockRequest } from "@core/http/mockHandler.ts";

export const handler: Handlers = {
  POST: (req) => handleMockRequest(req),
};
