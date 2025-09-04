import React, { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import useMainStore from "../store/useMainStore";

const SettingsPanel = () => {
	const {
		audioDevices,
		setAudioDevices,
		selectedDevice,
		setSelectedDevice,
		settings,
		setSettings,
		isGradientShapes,
		setIsGradientShapes,
	} = useMainStore();

	useEffect(() => {
		invoke("get_devices")
			.then((devices) => {
				setAudioDevices(devices);
				// Pilih default device stereo jika ada
				const stereoDevice = devices.find((d) => d.name && d.name.toLowerCase().includes("stereo"));
				if (stereoDevice) {
					setSelectedDevice(String(stereoDevice.index));
					invoke("select_device", { index: parseInt(stereoDevice.index, 10) }).catch(console.error);
				}
			})
			.catch((err) => {
				console.error("Failed to get devices:", err);
			});
	}, [setAudioDevices, setSelectedDevice]);

	const handleSliderChange = (key, value) => {
		setSettings({ ...settings, [key]: value });
	};

	const handleDeviceChange = (e) => {
		const newDeviceIndex = e.target.value;
		setSelectedDevice(newDeviceIndex);
		invoke("select_device", { index: parseInt(newDeviceIndex, 10) }).catch(console.error);
	};

	const handleGradientShapes = () => setIsGradientShapes(!isGradientShapes);

	return (
		<div className="w-80 p-4 rounded-2xl shadow-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
			<div className="grid gap-4">
				<div className="space-y-2">
					<h4 className="font-medium leading-none">Settings</h4>
					<p className="text-sm text-gray-500">Adjust visualizer parameters.</p>
				</div>
				<div className="grid gap-3">
					<div>
						<label className="text-sm font-medium">Audio Input</label>
						<select
							value={selectedDevice}
							onChange={handleDeviceChange}
							disabled={audioDevices.length === 0}
							className="mt-1 w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 outline-none">
							{audioDevices.length === 0 ? (
								<option>Loading devices...</option>
							) : (
								audioDevices.map((device) => (
									<option key={device.index} value={String(device.index)}>
										{device.name}
									</option>
								))
							)}
						</select>
					</div>
					<div>
						<label className="text-sm">Rhythm Pulse ({settings.rhythmFactor.toFixed(2)})</label>
						<input
							type="range"
							min="0.005"
							max="0.2"
							step="0.005"
							value={settings.rhythmFactor}
							onChange={(e) => handleSliderChange("rhythmFactor", parseFloat(e.target.value))}
							className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
						/>
					</div>
					<div>
						<label className="text-sm">Decay Rate ({settings.decayRate.toFixed(3)})</label>
						<input
							type="range"
							min="0.9"
							max="0.999"
							step="0.001"
							value={settings.decayRate}
							onChange={(e) => handleSliderChange("decayRate", parseFloat(e.target.value))}
							className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
						/>
					</div>
					<div>
						<label className="text-sm">Max Shapes ({settings.maxShapes})</label>
						<input
							type="range"
							min="10"
							max="200"
							step="10"
							value={settings.maxShapes}
							onChange={(e) => handleSliderChange("maxShapes", parseInt(e.target.value))}
							className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
						/>
					</div>
					<div>
						<label className="text-sm">Line Width ({settings.lineWidth})</label>
						<input
							type="range"
							min="1"
							max="20"
							step="1"
							value={settings.lineWidth}
							onChange={(e) => handleSliderChange("lineWidth", parseInt(e.target.value))}
							className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
						/>
					</div>
					<div className="flex items-center space-x-2">
						<div className="relative">
							<input
								type="checkbox"
								checked={isGradientShapes}
								onChange={handleGradientShapes}
								className="sr-only"
								id="gradient-toggle"
							/>
							<label
								htmlFor="gradient-toggle"
								className={`flex items-center justify-center w-4 h-4 border-2 rounded cursor-pointer transition-colors duration-200 ${
									isGradientShapes
										? "bg-blue-500 border-blue-500"
										: "bg-transparent border-gray-400 dark:border-gray-500"
								}`}>
								{isGradientShapes && (
									<svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
										<path
											fillRule="evenodd"
											d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
											clipRule="evenodd"
										/>
									</svg>
								)}
							</label>
						</div>
						<label htmlFor="gradient-toggle" className="text-sm cursor-pointer">
							Gradient Shapes
						</label>
					</div>
				</div>
			</div>
		</div>
	);
};

export default SettingsPanel;
