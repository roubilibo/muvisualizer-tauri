import React, { useState, useEffect, useRef, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import Layout from "./components/Layout";
import TopLeftControls from "./components/TopLeftControls";
import TopRightControls from "./components/TopRightControls";
import SettingsPanel from "./components/SettingsPanel";
import VisualizerCanvas from "./components/VisualizerCanvas";
import StatusInfo from "./components/StatusInfo";
import { ThemeProvider, useTheme } from "./components/ThemeContext";
import { FullscreenProvider } from "./components/FullscreenContext";

const AppContent = () => {
	const { isDarkMode } = useTheme();
	return (
		<Layout isDarkMode={isDarkMode}>
			<TopLeftControls />
			<TopRightControls>
				<SettingsPanel />
			</TopRightControls>
			<VisualizerCanvas />
			<StatusInfo />
		</Layout>
	);
};

const App = () => {
	return (
		<ThemeProvider>
			<FullscreenProvider>
				<AppContent />
			</FullscreenProvider>
		</ThemeProvider>
	);
};

export default App;
