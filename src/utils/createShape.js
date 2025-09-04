// Helper untuk membuat shape object
export default function createShape(x, y) {
	return {
		x,
		y,
		radius: 30,
		numVertices: Math.floor(Math.random() * 8) + 3,
		rgb: [
			Math.floor(Math.random() * 255),
			Math.floor(Math.random() * 255),
			Math.floor(Math.random() * 255),
		],
		rgb2: [
			Math.floor(Math.random() * 255),
			Math.floor(Math.random() * 255),
			Math.floor(Math.random() * 255),
		],
		lifespan: 255,
	};
}
