import { Head } from "$fresh/runtime.ts";
import EditorView from "../islands/EditorView.tsx";

export default function Home() {
  return (
    <>
      <Head>
        <title>Butlermock</title>
      </Head>
      <body class="bg-monaco-950 min-h-[100dvh]" >
        <main>

          <header>

            <section class="w-full text-center text-monaco-50 pt-12">
                <h3 title="Butlermock" aria-label="Butlermock's title" class="text-4xl">Butlermock</h3>
                <span aria-hidden>Just type that mock!</span>
            </section>

          </header>

         <EditorView />

        </main>
      </body>
    </>
  );
}
