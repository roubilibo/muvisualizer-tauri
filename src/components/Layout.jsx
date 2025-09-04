import React from "react";

const Layout = ({ children, isDarkMode }) => {
	return (
		<div
			className={`flex flex-col items-center justify-center min-h-screen p-4 font-sans transition-colors duration-500 ${
				isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"
			}`}>
			{children}
		</div>
	);
};

export default Layout;
