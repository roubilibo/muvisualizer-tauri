import Layout from "./components/Layout";
import TopLeftControls from "./components/TopLeftControls";
import TopRightControls from "./components/TopRightControls";
import SettingsPanel from "./components/SettingsPanel";
import VisualizerCanvas from "./components/VisualizerCanvas";
import StatusInfo from "./components/StatusInfo";
import { useTheme } from "./context/ThemeContext";
import React, { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import useMainStore from "./store/useMainStore";

const App = () => {
	const { isDarkMode } = useTheme();
	const { audioDevices, setAudioDevices, selectedDevice, setSelectedDevice } = useMainStore();

	// Set class 'dark' pada body sesuai isDarkMode
	useEffect(() => {
		document.body.classList.toggle("dark", isDarkMode);
	}, [isDarkMode]);

	// Fetch devices & auto-select default device saat mount
	useEffect(() => {
		invoke("get_devices")
			.then((devices) => {
				setAudioDevices(devices);
				// Set default device ke Stereo Mix hanya jika selectedDevice masih kosong/null/undefined
				if (!selectedDevice && devices.length > 0) {
					const stereoDevice = devices.find(
						(d) => d.name && d.name.toLowerCase().includes("stereo")
					);
					const defaultDevice = stereoDevice || devices[0];
					setSelectedDevice(String(defaultDevice.index));
					invoke("select_device", { index: parseInt(defaultDevice.index, 10) }).catch(
						console.error
					);
				}
			})
			.catch((err) => {
				console.error("Failed to get devices:", err);
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

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

export default App;
