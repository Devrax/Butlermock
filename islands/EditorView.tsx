export default function EditorView() {
  return (
    <>
      <article class="text-monaco-950 fill-monaco-950 bg-monaco-50 rounded w-[150px] mx-auto my-5 flex justify-evenly items-center h-[50px]">
        <button
          title="Show me mock"
          class="active:bg-monaco-950 hover:bg-monaco-800 hover:fill-monaco-50 hover:text-monaco-50 rounded-full p-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
            />
          </svg>
        </button>
        <button
          title="Just copy, I trust on butlermock"
          class="active:bg-monaco-950 hover:bg-monaco-800 hover:fill-monaco-50 hover:text-monaco-50 rounded-full p-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
            />
          </svg>
        </button>

        <button
          title="Clean the code"
          class="active:bg-monaco-950 hover:bg-monaco-800 hover:fill-monaco-50 hover:text-monaco-50 rounded-full p-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </article>
      <article class="w-full h-[70dvh] px-12 py-5">
        <section id="container" style="width: 100%; height: 100%;"></section>
      </article>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.26.1/min/vs/loader.min.js">
      </script>
      <script src="/script/load-editor.js"></script>
    </>
  );
}