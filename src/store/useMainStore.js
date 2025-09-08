import { create } from "zustand";

const useMainStore = create((set) => ({
	isDarkMode: true,
	isFullscreen: false,
	isPlaying: true,
	isGradientShapes: false,
	isSettingsOpen: false,
	canvasDimensions: { width: 800, height: 600 },
	settings: {
		rhythmFactor: 0.05,
		decayRate: 0.98,
		maxShapes: 50,
		lineWidth: 2,
	},
	audioDevices: [],
	selectedDevice: "",
	// Actions
	setIsDarkMode: (val) => set({ isDarkMode: val }),
	setIsFullscreen: (val) => set({ isFullscreen: val }),
	setIsPlaying: (val) => set({ isPlaying: val }),
	setIsGradientShapes: (val) => set({ isGradientShapes: val }),
	setIsSettingsOpen: (val) => set({ isSettingsOpen: val }),
	setCanvasDimensions: (val) => set({ canvasDimensions: val }),
	setSettings: (val) => set({ settings: val }),
	setAudioDevices: (val) => set({ audioDevices: val }),
	setSelectedDevice: (val) => set({ selectedDevice: val }),
	// Reset visualizer shapes (to be used by VisualizerCanvas)
	// Reset trigger for visualizer shapes
	resetShapesFlag: false,
	resetShapes: () => set((state) => ({ resetShapesFlag: !state.resetShapesFlag })),
}));

export default useMainStore;
