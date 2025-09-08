import React, { createContext, useContext, useState } from "react";

const FullscreenContext = createContext();

export const FullscreenProvider = ({ children }) => {
	const [isFullscreen, setIsFullscreen] = useState(false);
	return (
		<FullscreenContext.Provider value={{ isFullscreen, setIsFullscreen }}>
			{children}
		</FullscreenContext.Provider>
	);
};

export const useFullscreen = () => useContext(FullscreenContext);
