import { Head } from "$fresh/runtime.ts";
import { Handlers } from "$fresh/server.ts";
import EditorView from "../islands/EditorView.tsx";

export const handler: Handlers = {
  GET: (req, ctx) => {
    if(req.url.includes('butlermock.deno.dev')) {
      return new Response('', { status: 302, headers: { location: 'https://butlermock.online' }});
    }
    return ctx.render();
  }
}

export default function Home() {
  return (
    <>
      <Head>
        <meta name="description" content="Interface to JSON: Easily create mocked data using your TypeScript interfaces and types, typescript to json online." />
        <meta name="keywords" content="Typescript to json online, typescript to JSON schema, mock data, TypeScript, JSON schema from interfaces, development with mock data, testing with mock data, interfaces to mock data, types to mock data, using Fakerjs for typescript interfaces" />
        <meta name="author" content="Devrafx" />

        <meta property="og:title" content="Interface to JSON: Create mock data from typescript interfaces" />
        <meta property="og:description" content="Interface to JSON: Easily create mocked data using your TypeScript interfaces and types" />
        <meta property="og:image" content="https://butlermock.online/bartender.png" />
        <meta property="og:url" content="https://butlermock.online/" />
        <meta property="og:type" content="website" />
        <meta name="google-site-verification" content="TYIkyMqVikn-0A3PmmOXETZMcDaNiRH_uw9GAIBM1BI" />
        <title>Butlermock</title>
        <script async data-id="101422815" src="//static.getclicky.com/js"></script>
      </Head>
      <body class="bg-monaco-950 min-h-[100dvh]">
        <main class="max-w-[2000px] px-10" id="butlermock-content">
          <header>
            <section class="w-full text-monaco-50 pt-12 flex justify-center items-center">
            <button class="w-12 h-12" title="Project's logo">
                <img src="/butler.svg" alt="Butler logo" />
              </button>
              <div class="text-center">
                <h3
                  title="Butlermock"
                  aria-label="Butlermock's title"
                  class="text-4xl"
                >
                  Butlermock
                </h3>
                <span aria-hidden>Just type that mock!</span>
              </div>
            </section>
          </header>

          <EditorView />

          <a href="https://github.com/Devrax/Butlermock" rel="noopener noreferrer" class="w-12 h-12 text-white fixed bottom-[18px] left-[18px]" title="Project's repository" target="_blank">
            <img src="/github.svg" alt="Github logo" class="w-12 h-12 inline-block"/> <span class="hidden">star us! :D</span>
          </a>
        </main>
        <div id="incorrect-device-dimension" class="text-white flex w-full h-[100dvh] justify-center items-center flex-col px-4 gap-5 text-center">
          <span><b>Sorry!</b> we detected that <b>butlermock</b> layout will be too ugly and ackward to use, we recommend that you use tablets or bigger screens in order to have a good experience, sorry, we are working on this to give you a better experience 🥲</span>

          <span>Do you like challenges? Contribute to make Butlermock accesible on mobile device's screen, we are open-source 😎 <a href="https://github.com/Devrax/Butlermock" rel="noopener noreferrer" class="text-underline">come here <img src="/github.svg" alt="Github logo" class="w-4 h-4 inline-block"/> </a></span>
        </div>
        <script data-name="BMC-Widget" data-cfasync="false" src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js" data-id="devrafx" data-description="Support me on Buy me a coffee!" data-color="#888888" data-position="Right" data-x_margin="18" data-y_margin="18"></script>
      </body>
    </>
  );
}
