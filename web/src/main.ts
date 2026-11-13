import "./styles/workbench.css";
import { WorkbenchApp } from "./ui/app";

const rootEl = document.getElementById("app");
if (!rootEl) {
  throw new Error("Missing #app mount container");
}

const app = new WorkbenchApp(rootEl);
void app.mount();
