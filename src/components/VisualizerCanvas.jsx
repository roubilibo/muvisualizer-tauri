import React, { useRef, useEffect, useCallback, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import createShape from "../utils/createShape";
import useMainStore from "../store/useMainStore";
import { useFullscreen } from "./FullscreenContext";

const VisualizerCanvas = () => {
	const canvasRef = useRef(null);
	const canvasContainerRef = useRef(null);
	const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 600 });
	const { isPlaying, isGradientShapes, settings } = useMainStore();
	const { isFullscreen, setIsFullscreen } = useFullscreen();
	const shapesRef = useRef([]);
	const settingsRef = useRef(settings);
	const canvasDimensionsRef = useRef(canvasDimensions);
	canvasDimensionsRef.current = canvasDimensions;
	settingsRef.current = settings;

	// Listen for audio data from the backend
	useEffect(() => {
		const unlistenPromise = listen("audio_data", (event) => {
			const data = event.payload;
			const currentSettings = settingsRef.current;
			const currentDimensions = canvasDimensionsRef.current;
			let currentShapes = shapesRef.current;

			if (data.is_beat) {
				currentShapes.push(createShape(currentDimensions.width / 2, currentDimensions.height / 2));
				if (currentShapes.length > currentSettings.maxShapes) {
					shapesRef.current = currentShapes.slice(-currentSettings.maxShapes);
				}
			}
			shapesRef.current = currentShapes
				.map((shape) => ({
					...shape,
					radius:
						shape.radius + data.rhythm_factor * currentSettings.rhythmFactor * shape.radius - 1,
					lifespan: shape.lifespan * currentSettings.decayRate,
				}))
				.filter((shape) => shape.lifespan > 1);
		});
		return () => {
			unlistenPromise.then((unlisten) => unlisten());
		};
	}, []);

	// Listen for fullscreen changes to keep state in sync (handles ESC key)
	useEffect(() => {
		const handleFullscreenChange = () => {
			setIsFullscreen(!!document.fullscreenElement);
		};
		document.addEventListener("fullscreenchange", handleFullscreenChange);
		return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
	}, [setIsFullscreen]);

	// Trigger fullscreen on canvas when isFullscreen changes
	useEffect(() => {
		if (isFullscreen) {
			if (canvasContainerRef.current && !document.fullscreenElement) {
				canvasContainerRef.current.requestFullscreen().catch(() => {});
			}
		} else {
			if (document.fullscreenElement) {
				document.exitFullscreen().catch(() => {});
			}
		}
	}, [isFullscreen]);

	// Animation loop for continuous rendering
	const draw = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.lineWidth = settingsRef.current.lineWidth || 2;
		shapesRef.current.forEach((shape) => {
			ctx.beginPath();
			const points = [];
			for (let i = 0; i < shape.numVertices; i++) {
				const angle = (2 * Math.PI * i) / shape.numVertices;
				const x = shape.x + shape.radius * Math.cos(angle);
				const y = shape.y + shape.radius * Math.sin(angle);
				points.push({ x, y });
			}
			ctx.moveTo(points[0].x, points[0].y);
			for (let i = 1; i < points.length; i++) {
				ctx.lineTo(points[i].x, points[i].y);
			}
			ctx.closePath();
			if (isGradientShapes) {
				const gradient = ctx.createLinearGradient(
					shape.x - shape.radius,
					shape.y,
					shape.x + shape.radius,
					shape.y
				);
				const [r1, g1, b1] = shape.rgb;
				const [r2, g2, b2] = shape.rgb2;
				const opacity = shape.lifespan > 180 ? 1.0 : Math.max(0.6, shape.lifespan / 120);
				gradient.addColorStop(0, `rgba(${r1}, ${g1}, ${b1}, ${opacity})`);
				gradient.addColorStop(1, `rgba(${r2}, ${g2}, ${b2}, ${opacity})`);
				ctx.strokeStyle = gradient;
			} else {
				const [r, g, b] = shape.rgb;
				ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${shape.lifespan / 255})`;
			}
			ctx.stroke();
		});
	}, [isGradientShapes, settings]);

	useEffect(() => {
		let animationFrameId;
		const animationLoop = () => {
			draw();
			animationFrameId = requestAnimationFrame(animationLoop);
		};
		if (isPlaying) {
			animationLoop();
		}
		return () => {
			cancelAnimationFrame(animationFrameId);
		};
	}, [isPlaying, draw]);

	// Handle canvas resizing
	useEffect(() => {
		const handleResize = () => {
			const canvas = canvasRef.current;
			if (canvas) {
				setCanvasDimensions({
					width: canvas.parentElement.clientWidth,
					height: canvas.parentElement.clientHeight,
				});
			}
		};
		window.addEventListener("resize", handleResize);
		handleResize();
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	// Fullscreen handler
	const handleToggleFullscreen = () => {
		if (!document.fullscreenElement) {
			canvasContainerRef.current?.requestFullscreen().catch((err) => {
				console.log("Error entering fullscreen:", err);
			});
		} else {
			document.exitFullscreen().catch((err) => {
				console.log("Error exiting fullscreen:", err);
			});
		}
	};

	return (
		<div
			ref={canvasContainerRef}
			className={`relative w-full max-w-5xl aspect-video overflow-hidden rounded-3xl shadow-2xl border-2 border-transparent`}>
			{isFullscreen && (
				<button
					onClick={handleToggleFullscreen}
					className="absolute top-4 right-4 z-20 p-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full shadow-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200">
					<span>⤢</span>
				</button>
			)}
			<canvas
				ref={canvasRef}
				width={canvasDimensions.width}
				height={canvasDimensions.height}
				className="absolute top-0 left-0 w-full h-full"
			/>
		</div>
	);
};

export default VisualizerCanvas;
