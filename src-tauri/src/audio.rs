use once_cell::sync::OnceCell;
// Global state untuk akses dari command
pub static AUDIO_STATE: OnceCell<Arc<Mutex<AudioState>>> = OnceCell::new();
pub static APP_HANDLE: OnceCell<tauri::AppHandle> = OnceCell::new();
#[tauri::command]
pub fn select_device(index: usize) {
	if let Some(audio_state) = AUDIO_STATE.get() {
		let mut state = audio_state.lock().unwrap();
		state.current_device_index = index;
		drop(state);
		// Restart audio stream
		if let Some(app_handle) = APP_HANDLE.get() {
			start_audio_stream(app_handle.clone(), audio_state.clone());
			// Kirim ulang daftar device ke frontend
			let devices_info = get_input_devices();
			let _ = app_handle.emit("device_list", devices_info);
		}
	}
}

// Porting dari backend Python ke Rust
// Semua nama variabel dan port dipertahankan

use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, Instant};
use serde::{Serialize, Deserialize};
use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use rustfft::FftPlanner;
use rustfft::num_complex::Complex;

// Audio stream parameters
pub const CHUNK: usize = 2046;
pub const CHANNELS: u16 = 1;
pub const RATE: u32 = 44100;

// Beat and rhythm detection variables
pub const BEAT_VELOCITY_THRESHOLD: f32 = 5000.0;
static mut LAST_BASS_ENERGY: f32 = 0.0;
static mut LAST_BEAT_TRIGGER: u128 = 0;

pub struct AudioState {
	pub current_device_index: usize,
	// pub stream: Option<Stream>, // Dihapus agar AudioState bisa di-thread
}

impl AudioState {
	pub fn new() -> Self {
		Self {
			current_device_index: 2,
		}
	}
}

#[derive(Serialize, Deserialize, Debug)]
pub struct AudioDataPayload {
	pub is_beat: bool,
	pub rhythm_factor: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DeviceInfo {
	pub index: usize,
	pub name: String,
}

pub fn get_input_devices() -> Vec<DeviceInfo> {
	let host = cpal::default_host();
	let devices = match host.input_devices() {
		Ok(devs) => devs.collect::<Vec<_>>(),
		Err(_) => vec![],
	};
	devices.iter().enumerate().map(|(i, dev)| {
		let name = dev.name().unwrap_or_else(|_| "Unknown".to_string());
		DeviceInfo { index: i, name }
	}).collect()
}
use tauri::Emitter;


pub fn start_audio_stream(app_handle: tauri::AppHandle, audio_state: Arc<Mutex<AudioState>>) {
	// Kirim daftar device ke frontend setiap kali stream dimulai
	let devices_info = get_input_devices();
	let _ = app_handle.emit("device_list", devices_info);
	thread::spawn(move || {
		let host = cpal::default_host();
		let devices: Vec<_> = match host.input_devices() {
			Ok(devs) => devs.collect(),
			Err(_) => Vec::new(),
		};
		let device_index = audio_state.lock().unwrap().current_device_index;
		let device = devices.get(device_index)
			.cloned()
			.or_else(|| host.default_input_device());
		if device.is_none() {
			eprintln!("No input device found");
			return;
		}
		let device = device.unwrap();
		let config = match device.default_input_config() {
			Ok(cfg) => cfg,
			Err(e) => {
				eprintln!("Failed to get default input config: {}", e);
				return;
			}
		};

		let sample_format = config.sample_format();
		let config: cpal::StreamConfig = config.into();

		let mut planner = FftPlanner::<f32>::new();
		let fft = planner.plan_fft_forward(CHUNK);

		let mut last_bass_energy: f32 = 0.0;
		let mut last_beat_trigger: u128 = 0;

		let app_handle = app_handle.clone();
		let err_fn = |err| eprintln!("an error occurred on stream: {}", err);

		use cpal::SampleFormat;
		let stream = match sample_format {
			SampleFormat::F32 => device.build_input_stream(
				&config,
				move |data: &[f32], _| {
					process_audio_chunk(
						data,
						&app_handle,
						&*fft,
						&mut last_bass_energy,
						&mut last_beat_trigger,
					);
				},
				err_fn,
				None
			),
			SampleFormat::I16 => device.build_input_stream(
				&config,
				move |data: &[i16], _| {
					let data: Vec<f32> = data.iter().map(|&x| x as f32).collect();
					process_audio_chunk(
						&data,
						&app_handle,
						&*fft,
						&mut last_bass_energy,
						&mut last_beat_trigger,
					);
				},
				err_fn,
				None
			),
			SampleFormat::U16 => device.build_input_stream(
				&config,
				move |data: &[u16], _| {
					let data: Vec<f32> = data.iter().map(|&x| x as f32 - 32768.0).collect();
					process_audio_chunk(
						&data,
						&app_handle,
						&*fft,
						&mut last_bass_energy,
						&mut last_beat_trigger,
					);
				},
				err_fn,
				None
			),
			_ => {
				eprintln!("Unsupported sample format");
				return;
			}
		};

		match stream {
			Ok(s) => {
				s.play().unwrap();
				loop {
					thread::sleep(Duration::from_millis(100));
				}
			}
			Err(e) => {
				eprintln!("Failed to open stream: {}", e);
			}
		}
	});
}

fn process_audio_chunk(
	data: &[f32],
	app_handle: &tauri::AppHandle,
	fft: &dyn rustfft::Fft<f32>,
	last_bass_energy: &mut f32,
	last_beat_trigger: &mut u128,
) {
	if data.len() < CHUNK {
		return;
	}
	let mut buffer: Vec<Complex<f32>> = data.iter().take(CHUNK).map(|&x| Complex{ re: x, im: 0.0 }).collect();
	fft.process(&mut buffer);
	let fft_magnitude: Vec<f32> = buffer.iter().map(|c| c.norm()).collect();

	// Frequency bins
	let frequencies: Vec<f32> = (0..CHUNK/2).map(|i| i as f32 * RATE as f32 / CHUNK as f32).collect();
	let bass_band: Vec<usize> = frequencies.iter().enumerate().filter(|(_, &f)| f >= 20.0 && f < 250.0).map(|(i, _)| i).collect();
	let mids_band: Vec<usize> = frequencies.iter().enumerate().filter(|(_, &f)| f >= 250.0 && f < 4000.0).map(|(i, _)| i).collect();

	let bass_energy = if !bass_band.is_empty() {
		bass_band.iter().map(|&i| fft_magnitude[i]).sum::<f32>() / bass_band.len() as f32
	} else { 0.0 };
	let mids_energy = if !mids_band.is_empty() {
		mids_band.iter().map(|&i| fft_magnitude[i]).sum::<f32>() / mids_band.len() as f32
	} else { 0.0 };

	let bass_velocity = bass_energy - *last_bass_energy;
	*last_bass_energy = bass_energy;

	let now = Instant::now();
	let current_time_ms = now.elapsed().as_millis();
	let mut is_beat = false;
	if bass_velocity > BEAT_VELOCITY_THRESHOLD && current_time_ms - *last_beat_trigger > 200 {
		is_beat = true;
		*last_beat_trigger = current_time_ms;
	}
	let normalized_mids = (mids_energy / 10000.0).min(1.0);

	let audio_data = AudioDataPayload {
		is_beat,
		rhythm_factor: normalized_mids,
	};
	let msg = serde_json::json!({
		"type": "audio_data",
		"payload": audio_data
	});
	let _ = app_handle.emit("audio_data", msg);
}
