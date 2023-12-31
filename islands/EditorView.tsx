import { useSignal } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";
import EditorResponse from "../components/EditorResponse.tsx";

declare var theEditor: any;

declare var previewer: any;

const fetchTransformation = async (
  value: string,
  valueForAny: string,
  mustReturn = "",
  quantity = 1,
) => {
  const json = await fetch(new URL("/api/typemocker", location.origin).href, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      value,
      valueForAny,
      mustReturn,
      quantity,
    }),
  });
  return JSON.stringify(await json.json(), null, 2);
};

export default function EditorView() {
  const dataList = useSignal<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputNumberRef = useRef<HTMLInputElement>(null);
  const isLoading = useSignal(false);
  const codeToShow = useSignal("");
  const valueForAny = useSignal<string>("null");
  const valuesForAny = ["null", "{}", "0", '"lorem ipsum"'];

  const fetchAndShow = async () => {
    try {
      isLoading.value = true;
      const code = await fetchTransformation(
        theEditor.getValue(),
        valueForAny.value,
        inputRef.current!.value,
        inputNumberRef.current!.valueAsNumber,
      );
      codeToShow.value = code;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchAndCopy = async () => {
    navigator.clipboard.writeText(previewer.getValue());
  };

  const cleanEditors = () => {
    inputRef.current!.value = "";
    inputNumberRef.current!.value = "";
    theEditor.setValue("");
    previewer.setValue("");
  };

  function checkInterfacesAndTypesName() {
    const regex = () => /(interface([0-9A-Za-z ]+){|type([0-9A-Za-z ]+)=)/g;
    const searchTypesAndInterface = (theEditor.getValue() as string).match(
      regex(),
    );

    dataList.value = searchTypesAndInterface === null
      ? []
      : searchTypesAndInterface
        .map((m: string) => {
          const result = regex().exec(m);
          return ((result && (result[2] || result[3])?.trim()) || "").replace(/extends([A-Za-z0-9 ]+)/, '');
        })
        .filter(Boolean);
  }

  useEffect(() => {
    setTimeout(() => {
      theEditor?.onDidPaste(() => fetchAndShow());
      theEditor?.onDidBlurEditorText(() => checkInterfacesAndTypesName());
      inputRef.current!.onfocus = checkInterfacesAndTypesName;
    }, 500);
  }, []);

  return (
    <>
      <article>
        <section class="flex justify-center items-center gap-5 flex-wrap my-3">
          <div class="bg-[white] text-center rounded h-[50px] flex items-center p-2">
            <label for="Any-values">any:</label>
            <select
              name="any-values"
              id="Any-values"
              class="text-center"
              onChange={(e) => {
                valueForAny.value = (e.target as any).value;
                fetchAndShow();
              }}
            >
              {valuesForAny.map((v, index) => (
                <option value={v} key={index}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div class="text-monaco-950 fill-monaco-950 bg-monaco-50 rounded w-[150px] h-[50px] flex justify-evenly items-center">
            <button
              onClick={() => fetchAndShow()}
              title="Show me mock"
              disabled={isLoading.value}
              class="active:bg-monaco-950 hover:bg-monaco-800 hover:fill-monaco-50 hover:text-monaco-50 rounded-full p-1"
            >
              {isLoading.value
                ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-6 h-6"
                    viewBox="0 0 135 135"
                  >
                    <path d="M67.447 58c5.523 0 10-4.477 10-10s-4.477-10-10-10-10 4.477-10 10 4.477 10 10 10zm9.448 9.447c0 5.523 4.477 10 10 10 5.522 0 10-4.477 10-10s-4.478-10-10-10c-5.523 0-10 4.477-10 10zm-9.448 9.448c-5.523 0-10 4.477-10 10 0 5.522 4.477 10 10 10s10-4.478 10-10c0-5.523-4.477-10-10-10zM58 67.447c0-5.523-4.477-10-10-10s-10 4.477-10 10 4.477 10 10 10 10-4.477 10-10z">
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0 67 67"
                        to="-360 67 67"
                        dur="2.5s"
                        repeatCount="indefinite"
                      />
                    </path>
                    <path d="M28.19 40.31c6.627 0 12-5.374 12-12 0-6.628-5.373-12-12-12-6.628 0-12 5.372-12 12 0 6.626 5.372 12 12 12zm30.72-19.825c4.686 4.687 12.284 4.687 16.97 0 4.686-4.686 4.686-12.284 0-16.97-4.686-4.687-12.284-4.687-16.97 0-4.687 4.686-4.687 12.284 0 16.97zm35.74 7.705c0 6.627 5.37 12 12 12 6.626 0 12-5.373 12-12 0-6.628-5.374-12-12-12-6.63 0-12 5.372-12 12zm19.822 30.72c-4.686 4.686-4.686 12.284 0 16.97 4.687 4.686 12.285 4.686 16.97 0 4.687-4.686 4.687-12.284 0-16.97-4.685-4.687-12.283-4.687-16.97 0zm-7.704 35.74c-6.627 0-12 5.37-12 12 0 6.626 5.373 12 12 12s12-5.374 12-12c0-6.63-5.373-12-12-12zm-30.72 19.822c-4.686-4.686-12.284-4.686-16.97 0-4.686 4.687-4.686 12.285 0 16.97 4.686 4.687 12.284 4.687 16.97 0 4.687-4.685 4.687-12.283 0-16.97zm-35.74-7.704c0-6.627-5.372-12-12-12-6.626 0-12 5.373-12 12s5.374 12 12 12c6.628 0 12-5.373 12-12zm-19.823-30.72c4.687-4.686 4.687-12.284 0-16.97-4.686-4.686-12.284-4.686-16.97 0-4.687 4.686-4.687 12.284 0 16.97 4.686 4.687 12.284 4.687 16.97 0z">
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0 67 67"
                        to="360 67 67"
                        dur="8s"
                        repeatCount="indefinite"
                      />
                    </path>
                  </svg>
                )
                : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    class="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                    />
                  </svg>
                )}
            </button>
            <button
              onClick={() => fetchAndCopy()}
              title="Just copy, I trust on butlermock"
              disabled={isLoading.value}
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
              onClick={() => cleanEditors()}
              disabled={isLoading.value}
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
          </div>

          <div class="bg-[white] text-center rounded h-[50px] flex items-center p-2">
            <input
              list="interface-and-types"
              type="text"
              class="w-[225px]"
              ref={inputRef}
              placeholder="Interface's or Type's name"
              title="type the exact name of the interface's mock you want"
            />
            <datalist id="interface-and-types">
              {dataList.value.map((n) => (
                <option key={n.trim()} value={n.trim()} />
              ))}
            </datalist>
          </div>

          <div class="bg-[white] text-center rounded h-[50px] flex items-center p-2">
            <input
              type="number"
              inputMode="numeric"
              class="w-[100px]"
              ref={inputNumberRef}
              placeholder="2 or more"
            />
          </div>
        </section>
      </article>
      <article class="w-full h-[70dvh] lg:px-12 py-5 flex relative">
        <section id="container" style="width: 50%; height: 100%;"></section>
        <div class="flex w-full h-full justify-center items-center text-white absolute top-0 left-0" id="loader-for-monaco">
            <img src="/butler.svg" alt="butler loader" class="w-20 h-20 animate-bounce" id="butler-spin" />
          </div>
        <EditorResponse codeToShow={codeToShow.value} />
      </article>

       <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.26.1/min/vs/loader.min.js">
      </script>
      <script src="/script/load-editor.js"></script>
    </>
  );
}
