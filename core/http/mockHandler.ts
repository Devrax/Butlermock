import Interface2Mock, { MockInputError } from "@core/class/TypeMocker.ts";

/** Largest accepted `value` (TypeScript source), in bytes. */
export const MAX_SOURCE_BYTES = 100 * 1024;
export const MAX_QUANTITY = 10;

/** Request body accepted by `POST /api/mock` and `POST /api/typemocker`. */
export interface MockRequestBody {
  /** TypeScript source with the interfaces/types to mock. */
  value: string;
  /** JSON text used for `any`/`unknown` values, e.g. `"null"` or `"{}"`. */
  valueForAny?: string | null;
  /** Name of the declaration to return; empty returns every declaration. */
  mustReturn?: string | null;
  /** 1-10; above 1 the response is an array of mocks. */
  quantity?: number | string | null;
  /** Integer seed for repeatable output. */
  seed?: number | null;
}

class BadRequest extends Error {}

const json = (body: unknown, status: number) =>
  new Response(
    JSON.stringify(
      body,
      (_key, value) => typeof value === "bigint" ? value.toString() : value,
    ),
    { status, headers: { "Content-Type": "application/json" } },
  );

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function parseValueForAny(valueForAny: unknown): unknown {
  if (valueForAny === undefined || valueForAny === null) return null;
  if (typeof valueForAny !== "string") {
    throw new BadRequest("`valueForAny` must be a string with a JSON value");
  }
  try {
    return JSON.parse(valueForAny);
  } catch {
    throw new BadRequest(
      `\`valueForAny\` is not valid JSON: ${JSON.stringify(valueForAny)}`,
    );
  }
}

function parseQuantity(quantity: unknown): number {
  // The web UI sends null when the quantity field is empty.
  if (quantity === undefined || quantity === null || quantity === "") return 1;
  const parsed = typeof quantity === "string" ? Number(quantity) : quantity;
  if (
    typeof parsed !== "number" || !Number.isInteger(parsed) || parsed < 1 ||
    parsed > MAX_QUANTITY
  ) {
    throw new BadRequest(
      `\`quantity\` must be an integer between 1 and ${MAX_QUANTITY}`,
    );
  }
  return parsed;
}

function parseBody(body: unknown) {
  if (!isRecord(body)) throw new BadRequest("The body must be a JSON object");

  const { value, mustReturn, seed } = body;
  if (typeof value !== "string") {
    throw new BadRequest(
      "`value` must be a string with TypeScript interfaces or types",
    );
  }
  if (new TextEncoder().encode(value).length > MAX_SOURCE_BYTES) {
    throw new BadRequest(
      `\`value\` is larger than ${MAX_SOURCE_BYTES / 1024} KB`,
    );
  }
  if (
    mustReturn !== undefined && mustReturn !== null &&
    typeof mustReturn !== "string"
  ) {
    throw new BadRequest("`mustReturn` must be a string");
  }
  if (
    seed !== undefined && seed !== null &&
    !(typeof seed === "number" && Number.isSafeInteger(seed))
  ) {
    throw new BadRequest("`seed` must be an integer");
  }

  return {
    value,
    valueForAny: parseValueForAny(body.valueForAny),
    mustReturn: mustReturn ?? "",
    quantity: parseQuantity(body.quantity),
    seed: seed ?? undefined,
  };
}

/**
 * Shared implementation of the mock endpoints. Input problems answer 400
 * with `{ error }`; anything unexpected answers 500 with `{ error }`.
 * `bigint` values are serialized as strings.
 */
export async function handleMockRequest(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "The request body must be valid JSON" }, 400);
  }

  try {
    const { value, valueForAny, mustReturn, quantity, seed } = parseBody(body);
    const mocks = Array.from(
      { length: quantity },
      (_, i) =>
        new Interface2Mock(value, valueForAny, {
          // Consecutive seeds keep a batch repeatable without repeating items.
          seed: seed === undefined ? undefined : seed + i,
        }).buildMock(mustReturn),
    );
    return json(quantity > 1 ? mocks : mocks[0], 200);
  } catch (err) {
    if (err instanceof BadRequest || err instanceof MockInputError) {
      return json({ error: err.message }, 400);
    }
    console.error(err);
    return json({
      error: err instanceof Error ? err.message : "Unexpected error",
    }, 500);
  }
}
