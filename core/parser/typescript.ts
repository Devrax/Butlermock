// The guard must be imported before the compiler: modules are evaluated in
// import order, so `process.browser` is set while TypeScript initializes.
import { restore } from "@core/parser/ts_sys_guard.ts";
import ts from "typescript";

restore();

export default ts;
