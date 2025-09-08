import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./context/ThemeContext";
import { FullscreenProvider } from "./context/FullscreenContext";

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<ThemeProvider>
			<FullscreenProvider>
				<App />
			</FullscreenProvider>
		</ThemeProvider>
	</React.StrictMode>
);
