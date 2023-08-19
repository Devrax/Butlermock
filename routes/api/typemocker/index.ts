import Interface2Mock from '@core/class/TypeMocker.ts';
import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
    async POST(req) {
        try {
            const content = await req.json();

            if(content.quantity && !isNaN(content.quantity) && content.quantity > 1) {
                if(content.quantity > 50) throw new Error('Exceeded quantity, must be lower than 50 objects');
                const mocks = [];
                for(let i = 0; i < content.quantity; i++) {
                    const buildInterface = new Interface2Mock(content.value, JSON.parse(content.valueForAny));
                    mocks.push(buildInterface.buildMock(content.mustReturn));
                }
                return new Response(JSON.stringify(mocks), { status: 200, headers: { 'Content-type': 'application/json'}});
            }

            const prepareInterface = new Interface2Mock(content.value, JSON.parse(content.valueForAny));

            return new Response(JSON.stringify(prepareInterface.buildMock(content.mustReturn ?? '')), { status: 200, headers: { 'Content-type': 'application/json'}});
        } catch(err) {
            console.error(err);
            return new Response(JSON.stringify({ error: err?.message }), { status: 500, headers: { 'Content-Type': 'application/json'}});
        }
    }
}