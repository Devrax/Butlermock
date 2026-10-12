import { page } from "fresh";
import EditorView from "../islands/EditorView.tsx";
import { define } from "../utils.ts";

export const handler = define.handlers({
  GET: (ctx) => {
    if (ctx.url.hostname === "butlermock.deno.dev") {
      return new Response(null, {
        status: 301,
        headers: { location: "https://butlermock.online/" },
      });
    }
    return page();
  },
});

export default define.page(function Home() {
  return (
    <main class="max-w-[2000px] mx-auto" id="butlermock-content">
      <header>
        <section class="w-full text-monaco-50 pt-3 md:pt-12 flex justify-center items-center">
          <button type="button" class="w-12 h-12" title="Project's logo">
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

      <a
        href="https://github.com/Devrax/Butlermock"
        rel="noopener noreferrer"
        class="w-12 h-12 text-white fixed bottom-[18px] left-[18px] 2xl:w-24 2xl:h-24"
        title="Project's repository"
        target="_blank"
      >
        <img
          src="/github.svg"
          alt="Github logo"
          class="w-12 h-12 2xl:w-24 2xl:h-24 inline-block"
        />
      </a>
    </main>
  );
});
