import App from "@renderer/App";
import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
	throw new Error("Missing renderer root element.");
}

createRoot(rootElement).render(
	<React.StrictMode>
		<HashRouter useTransitions={false}>
			<App />
		</HashRouter>
	</React.StrictMode>,
);
