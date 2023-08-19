import { Head } from "$fresh/runtime.ts";
import EditorView from "../islands/EditorView.tsx";

export default function Home() {
  return (
    <>
      <Head>
        <meta name="description" content="Interface to JSON: Easily create mocked data using your TypeScript interfaces and types, typescript to json online." />
        <meta name="keywords" content="Typescript to json online, typescript to JSON schema, mock data, TypeScript, JSON schema from interfaces, development with mock data, testing with mock data, interfaces to mock data, types to mock data, using Fakerjs for typescript interfaces" />
        <meta name="author" content="Devrafx" />

        <meta property="og:title" content="Generate Mock Data from typescrypt's interface/type" />
        <meta property="og:description" content="Interface to JSON: Easily create mocked data using your TypeScript interfaces and types" />
        <meta property="og:image" content="https://butlermock.deno.dev/bartender.png" />
        <meta property="og:url" content="https://butlermock.deno.dev/" />
        <meta property="og:type" content="website" />
        <meta name="google-site-verification" content="TYIkyMqVikn-0A3PmmOXETZMcDaNiRH_uw9GAIBM1BI" />
        <title>Butlermock</title>
      </Head>
      <body class="bg-monaco-950 min-h-[100dvh]">
        <main>
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
              <a href="https://github.com/Devrax/Butlermock" rel="noopener noreferrer" class="w-12 h-12" title="Project's repository" target="_blank">
                <img src="/github.svg" alt="Github logo" />
              </a>
            </section>
          </header>

          <EditorView />
        </main>

        <script data-name="BMC-Widget" data-cfasync="false" src="https://cdnjs.buymeacoffee.com/1.0.0/widget.prod.min.js" data-id="devrafx" data-description="Support me on Buy me a coffee!" data-message="Thanks for using Butlermock!" data-color="#888888" data-position="Right" data-x_margin="18" data-y_margin="18"></script>
      </body>
    </>
  );
}
