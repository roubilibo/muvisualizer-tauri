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
				className="p-2 rounded-full shadow-lg transition-colors duration-200 bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
				{isPlaying ? <Pause size={20} /> : <Play size={20} />}
			</button>
			<button
				onClick={handleReset}
				className="p-2 rounded-full shadow-lg transition-colors duration-200 bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
				<RefreshCcw size={20} />
			</button>
		</div>
	);
};

export default TopLeftControls;
