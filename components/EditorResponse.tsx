import { useEffect } from "preact/hooks"

declare var previewer: any;

interface EditorResponseProps {
    codeToShow: string;
}

export default function EditorResponse({ codeToShow }: EditorResponseProps) {

    useEffect(() => {
        previewer?.setValue(codeToShow);
    }, [codeToShow]);

    return (
        <>
        <section id="preview-code" style="width: 50%; height: 100%;"></section>
        </>
    )
}