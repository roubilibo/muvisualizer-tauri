import Layout from "./components/Layout";
import TopLeftControls from "./components/TopLeftControls";
import TopRightControls from "./components/TopRightControls";
import SettingsPanel from "./components/SettingsPanel";
import VisualizerCanvas from "./components/VisualizerCanvas";
import StatusInfo from "./components/StatusInfo";
import { useTheme } from "./context/ThemeContext";

const App = () => {
	const { isDarkMode } = useTheme();
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
