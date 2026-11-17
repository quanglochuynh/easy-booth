import App from "@renderer/App";
import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error("Missing renderer root element.");
}

createRoot(rootElement).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);
