/**
 * Minimal typing for the two Monaco editors that `static/script/load-editor.js`
 * creates once Monaco has been loaded from the CDN. They are `null` until then.
 */
export interface MonacoEditor {
  getValue(): string;
  setValue(value: string): void;
  onDidPaste(listener: () => void): unknown;
  onDidBlurEditorText(listener: () => void): unknown;
}

declare global {
  /** TypeScript input editor. */
  var theEditor: MonacoEditor | null;
  /** Read-only JSON output editor. */
  var previewer: MonacoEditor | null;
}
