import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { syncManager } from "./db/sync.ts";

// Start autoSync for offline-first background synchronization
syncManager.startAutoSync();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
