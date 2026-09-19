import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Elemento raiz da aplicação não encontrado.");
}

createRoot(rootElement).render(<App />);
