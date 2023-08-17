import { Head } from "$fresh/runtime.ts";
import EditorView from "../islands/EditorView.tsx";

export default function Home() {
  return (
    <>
      <Head>
        <meta name="description" content="Easily create mock data for your TypeScript interfaces and types using them as JSON schema for building the mocks" />
        <meta name="keywords" content="mock data, TypeScript, JSON schema, development, testing, interfaces, types, Fakerjs" />
        <meta name="author" content="Devrafx" />

        <meta property="og:title" content="Butlermock: Generate Mock Data from typescrypt's interface/type" />
        <meta property="og:description" content="Easily create mock data for your TypeScript interfaces and types using them as JSON schema for building the mocks" />
        <meta property="og:image" content="https://butlermock.deno.dev/bartender.png" />
        <meta property="og:url" content="https://butlermock.deno.dev/" />
        <meta property="og:type" content="website" />
        <title>Butlermock</title>
        <script async data-id="101422815" src="/7f6f3974c4167b6.js"></script>
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
      </body>
    </>
  );
}
