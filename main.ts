import { staticFiles } from "fresh";
import { createApp } from "./app.ts";

export const app = createApp();

app.use(staticFiles());

// Include file-system based routes here
app.fsRoutes();
