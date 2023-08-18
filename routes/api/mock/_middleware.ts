import { MiddlewareHandlerContext } from "$fresh/server.ts";

interface State {
  data: string;
}

const allowCORS = (resp: Response, req: Request) => {
  let handler = resp;
  resp.headers.set("Access-Control-Allow-Origin", "*"); // Allow any origin to access the resource
  resp.headers.set("Access-Control-Allow-Methods", "POST");
  resp.headers.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    handler = new Response(resp.body, { status: 204, headers: resp.headers });
  }

  return handler;
};

export async function handler(
  req: Request,
  ctx: MiddlewareHandlerContext<State>,
) {
  return allowCORS(await ctx.next(), req);
}
