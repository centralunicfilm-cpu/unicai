import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import ErrorBoundary from "@/components/ErrorBoundary.tsx";
import "./index.css";

// Rejeições não tratadas (ex: rede instável) viram log visível em vez de silêncio.
window.addEventListener("unhandledrejection", (event) => {
  console.error("Promessa rejeitada sem tratamento:", event.reason);
});

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
