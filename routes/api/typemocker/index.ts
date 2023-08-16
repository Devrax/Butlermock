import Interface2Mock from '@core/class/TypeMocker.ts';
import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
    async POST(req) {
        try {
            const content = await req.json();
            const prepareInterface = new Interface2Mock(content.value, JSON.parse(content.valueForAny));
            return new Response(JSON.stringify(prepareInterface.buildMock(content.mustReturn ?? '')), { status: 200, headers: { 'Content-type': 'application/json'}});
        } catch(err) {
            console.error(err);
            return new Response(JSON.stringify({ error: err?.message }), { status: 500, headers: { 'Content-Type': 'application/json'}});
        }
    }
}