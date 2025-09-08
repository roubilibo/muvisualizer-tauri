import { Pause, Play, RefreshCcw } from "lucide-react";
import useMainStore from "../store/useMainStore";

const TopLeftControls = () => {
	const { isPlaying, setIsPlaying, resetShapes } = useMainStore();
	const handleTogglePlayPause = () => setIsPlaying(!isPlaying);
	const handleReset = () => {
		resetShapes();
	};
	return (
		<div className="absolute top-4 left-4 z-10 flex space-x-2">
			<button
				onClick={handleTogglePlayPause}
				className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full shadow-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200">
				{isPlaying ? <Pause size={20} /> : <Play size={20} />}
			</button>
			<button
				onClick={handleReset}
				className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full shadow-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200">
				<RefreshCcw size={20} />
			</button>
		</div>
	);
};

export default TopLeftControls;
