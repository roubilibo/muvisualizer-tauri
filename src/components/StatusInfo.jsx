import React from "react";
import useMainStore from "../store/useMainStore";

const StatusInfo = () => {
	const { audioDevices, selectedDevice } = useMainStore();
	const activeDevice = audioDevices.find((d) => String(d.index) === String(selectedDevice));
	const info = activeDevice
		? `Selected device: ${activeDevice.name}`
		: "Select an audio device to begin.";
	return (
		<div className="mt-8 w-full max-w-xl rounded-2xl shadow-xl p-6 transition-colors duration-300 bg-white border-gray-200 text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
			<h2 className="text-2xl font-bold">Generative Music Visualizer</h2>
			<p className="text-sm text-gray-500 mt-2">{info}</p>
		</div>
	);
};

export default StatusInfo;
