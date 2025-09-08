import React, { useRef } from "react";
import { Sun, Moon, Maximize, Minimize, SlidersHorizontal } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useFullscreen } from "../context/FullscreenContext";

const TopRightControls = ({ children }) => {
	const { isDarkMode, setIsDarkMode } = useTheme();
	const { isFullscreen, setIsFullscreen } = useFullscreen();
	const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
	const settingsPanelRef = useRef(null);

	const handleToggleDarkMode = () => setIsDarkMode(!isDarkMode);
	const handleToggleFullscreen = () => setIsFullscreen(!isFullscreen);
	const handleToggleSettings = () => setIsSettingsOpen((prev) => !prev);

	React.useEffect(() => {
		if (!isSettingsOpen) return;
		function handleClickOutside(event) {
			if (settingsPanelRef.current && !settingsPanelRef.current.contains(event.target)) {
				setIsSettingsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [isSettingsOpen]);

	return (
		<div className="absolute top-4 right-4 z-10 flex space-x-2">
			<button
				onClick={handleToggleDarkMode}
				className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full shadow-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200">
				{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
			</button>
			<button
				onClick={handleToggleFullscreen}
				className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full shadow-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200">
				{isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
			</button>
			<div className="relative group" ref={settingsPanelRef}>
				<button
					onClick={handleToggleSettings}
					className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full shadow-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200">
					<SlidersHorizontal size={20} />
				</button>
				{isSettingsOpen && (
					<div className="absolute right-0 mt-2 z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-xl p-4 min-w-[300px]">
						{children}
					</div>
				)}
			</div>
		</div>
	);
};

export default TopRightControls;
