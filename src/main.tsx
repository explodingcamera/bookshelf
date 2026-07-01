import "@dawdle.space/bookshelf/styles/default.css";
import "./styles/global.css";
import { createRoot } from "react-dom/client";

import { App } from "./App";

createRoot(document.getElementById("app")!).render(<App />);
