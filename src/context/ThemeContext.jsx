import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
	// Inisialisasi dari localStorage jika ada
	const [isDarkMode, setIsDarkMode] = useState(() => {
		const stored = localStorage.getItem("isDarkMode");
		return stored ? JSON.parse(stored) : true;
	});

	// Sinkronkan ke localStorage setiap kali berubah
	useEffect(() => {
		localStorage.setItem("isDarkMode", JSON.stringify(isDarkMode));
	}, [isDarkMode]);

	return (
		<ThemeContext.Provider value={{ isDarkMode, setIsDarkMode }}>{children}</ThemeContext.Provider>
	);
};

export const useTheme = () => useContext(ThemeContext);
