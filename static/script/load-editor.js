// require is provided by loader.min.js.
var theEditor = null;
var previewer = null;
require.config({
  paths: {
    vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.26.1/min/vs",
  },
});

document.addEventListener("DOMContentLoaded", () => {
  require(["vs/editor/editor.main"], () => {
    theEditor = monaco.editor.create(document.getElementById("container"), {
      language: "typescript",
      theme: "vs-dark",
      autoIndent: true,
      formatOnPaste: true,
      minimap: {
        enabled: false,
      },
    });

    theEditor.setValue(`interface Example {
    image: string;
    gravatar_id: string;
    url: string;
    fixedUrl: "https\\://gleeful-anterior.com";
    fullName: string;
    location: string;
    email?: string;
    hireable: boolean;
    twitter_username?: string;
    following: number;
    created_at: Date;
    chon: string;
}

interface Hello extends Example {
  chin: string;
}

interface World extends Example {
  chon: number;
}`);

    previewer = monaco.editor.create(document.getElementById("preview-code"), {
      value: ``,
      language: "json",
      theme: "vs-dark",
      readOnly: true,
      minimap: {
        enabled: false,
      },
    });
  });
});
