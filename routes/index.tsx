import { Head } from "$fresh/runtime.ts";
import EditorView from "../islands/EditorView.tsx";

export default function Home() {
  return (
    <>
      <Head>
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
      </body>
    </>
  );
}
