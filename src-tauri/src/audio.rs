use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{Device, SampleFormat, SizedSample, Stream};
use rustfft::num_complex::Complex;
use rustfft::FftPlanner;
use serde::{Deserialize, Serialize};
use std::sync::mpsc::{Receiver, Sender};
use std::sync::{Arc, Mutex};
use std::time::Instant;
use tauri::{AppHandle, Emitter, State};

// --- Constants ---
const CHUNK: usize = 2048;
const RATE: u32 = 44100;
// sesuaikan lagi agar deteksi beat lebih sensitif?
const BEAT_VELOCITY_THRESHOLD: f32 = 0.1; 
const RHYTHM_NORMALIZATION_FACTOR: f32 = 0.05; 

// --- Message Passing for Audio Thread ---
#[allow(dead_code)]
pub enum AudioCommand {
    SelectDevice(usize),
    Stop,
}


pub struct AudioThreadManager {
    pub sender: Mutex<Sender<AudioCommand>>,
}

// --- State Management (for processing) ---
pub struct AudioState {
    pub beat_detector: BeatDetector,
}

impl AudioState {
    pub fn new() -> Self {
        Self {
            beat_detector: BeatDetector::new(),
        }
    }
}

pub struct BeatDetector {
    last_bass_energy: f32,
    last_beat_trigger: Instant,
}

impl BeatDetector {
    fn new() -> Self {
        Self {
            last_bass_energy: 0.0,
            last_beat_trigger: Instant::now(),
        }
    }
    
    // Fungsi baru untuk mereset state detektor
    fn reset(&mut self) {
        self.last_bass_energy = 0.0;
        self.last_beat_trigger = Instant::now();
    }

    fn detect_beat(&mut self, fft_magnitude: &[f32]) -> (bool, f32) {
        let frequencies: Vec<f32> = (0..CHUNK / 2)
            .map(|i| i as f32 * RATE as f32 / CHUNK as f32)
            .collect();
        let bass_band: Vec<usize> = frequencies
            .iter()
            .enumerate()
            .filter(|(_, &f)| f >= 20.0 && f < 250.0)
            .map(|(i, _)| i)
            .collect();

        let bass_energy = if !bass_band.is_empty() {
            bass_band.iter().map(|&i| fft_magnitude[i]).sum::<f32>() / bass_band.len() as f32
        } else {
            0.0
        };

        let bass_velocity = bass_energy - self.last_bass_energy;
        self.last_bass_energy = bass_energy;

        // Cetak nilai untuk debugging
        // println!("Bass Energy: {:.4}, Bass Velocity: {:.4}", bass_energy, bass_velocity);

        let now = Instant::now();
        let is_beat = bass_velocity > BEAT_VELOCITY_THRESHOLD
            && now.duration_since(self.last_beat_trigger).as_millis() > 200;
        if is_beat {
            self.last_beat_trigger = now;
        }
        (is_beat, bass_velocity)
    }
}

// --- Tauri Commands & Payloads ---
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AudioDataPayload {
    pub is_beat: bool,
    pub rhythm_factor: f32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DeviceInfo {
    pub index: usize,
    pub name: String,
}

#[tauri::command]
pub fn get_devices() -> Result<Vec<DeviceInfo>, String> {
    let host = cpal::default_host();
    let devices = host
        .input_devices()
        .map_err(|e| format!("Failed to get input devices: {}", e))?;

    let devices_info: Vec<DeviceInfo> = devices
        .enumerate()
        .map(|(i, dev)| {
            let name = dev.name().unwrap_or_else(|_| "Unknown".to_string());
            DeviceInfo { index: i, name }
        })
        .collect();

    Ok(devices_info)
}

#[tauri::command]
pub fn select_device(
    index: usize,
    manager: State<'_, AudioThreadManager>,
) -> Result<(), String> {
    manager
        .sender
        .lock()
        .unwrap()
        .send(AudioCommand::SelectDevice(index))
        .map_err(|e| format!("Failed to send command to audio thread: {}", e))
}

// --- Audio Thread Logic ---
pub fn audio_thread_main(
    app_handle: AppHandle,
    audio_state_mutex: Arc<Mutex<AudioState>>,
    rx: Receiver<AudioCommand>,
) {
    let mut stream: Option<Stream> = None;

    for command in rx {
        match command {
            AudioCommand::SelectDevice(index) => {
                println!("Audio thread received SelectDevice({}) command.", index);
                if let Some(s) = stream.take() {
                    drop(s);
                }
                
                // Reset beat detector state
                audio_state_mutex.lock().unwrap().beat_detector.reset();

                match start_audio_stream(index, app_handle.clone(), audio_state_mutex.clone()) {
                    Ok(s) => stream = Some(s),
                    Err(e) => eprintln!("Failed to change audio device: {}", e),
                }
            }
            AudioCommand::Stop => {
                if let Some(s) = stream.take() {
                    drop(s);
                }
                break;
            }
        }
    }
    println!("Audio thread terminated.");
}

pub fn start_audio_stream(
    device_index: usize,
    app_handle: AppHandle,
    audio_state_mutex: Arc<Mutex<AudioState>>,
) -> Result<Stream, String> {
    let host = cpal::default_host();
    let mut devices = host
        .input_devices()
        .map_err(|e| format!("Failed to get input devices: {}", e))?;
    let device = devices
        .nth(device_index)
        .or_else(|| host.default_input_device())
        .ok_or("No input device found".to_string())?;

    println!("Selected device: {}", device.name().unwrap_or_default());

    let config = device
        .default_input_config()
        .map_err(|e| format!("Failed to get default input config: {}", e))?;

    let sample_format = config.sample_format();
    let stream_config: cpal::StreamConfig = config.into();
    let err_fn = |err| eprintln!("an error occurred on stream: {}", err);

    let stream = match sample_format {
        SampleFormat::F32 => build_stream::<f32>(&device, &stream_config, app_handle, audio_state_mutex, err_fn),
        SampleFormat::I16 => build_stream::<i16>(&device, &stream_config, app_handle, audio_state_mutex, err_fn),
        SampleFormat::U16 => build_stream::<u16>(&device, &stream_config, app_handle, audio_state_mutex, err_fn),
        _ => Err(format!("Unsupported sample format: {:?}", sample_format)),
    }?;

    stream
        .play()
        .map_err(|e| format!("Failed to play stream: {}", e))?;

    Ok(stream)
}

fn build_stream<T>(
    device: &Device,
    config: &cpal::StreamConfig,
    app_handle: AppHandle,
    audio_state_mutex: Arc<Mutex<AudioState>>,
    err_fn: fn(cpal::StreamError),
) -> Result<Stream, String>
where
    T: cpal::Sample + SizedSample,
    f32: cpal::FromSample<T>,
{
    let fft_planner_arc = Arc::new(Mutex::new(FftPlanner::<f32>::new()));
    let fft_arc = {
        let mut planner = fft_planner_arc.lock().unwrap();
        Arc::new(planner.plan_fft_forward(CHUNK))
    };

    device
        .build_input_stream(
            config,
            move |data: &[T], _| {
                let local_app_handle = app_handle.clone();
                let local_fft = fft_arc.clone();
                let local_state_mutex = audio_state_mutex.clone();
                
                let samples: Vec<f32> = data.iter().map(|&s| s.to_sample::<f32>()).collect();
                process_audio_chunk(&samples, &local_app_handle, &local_fft, &local_state_mutex);
            },
            err_fn,
            None,
        )
        .map_err(|e| format!("Failed to build input stream: {}", e))
}

fn process_audio_chunk(
    data: &[f32],
    app_handle: &AppHandle,
    fft: &Arc<dyn rustfft::Fft<f32>>,
    audio_state_mutex: &Arc<Mutex<AudioState>>,
) {
    let mut buffer: Vec<Complex<f32>> = data
        .iter()
        .take(CHUNK)
        .map(|&x| Complex { re: x, im: 0.0 })
        .collect();

    if buffer.len() < CHUNK {
        buffer.resize(CHUNK, Complex { re: 0.0, im: 0.0 });
    }

    fft.process(&mut buffer);

    let fft_magnitude: Vec<f32> = buffer.iter().map(|c| c.norm()).collect();

    let (is_beat, _) = {
        let mut state = audio_state_mutex.lock().unwrap();
        state.beat_detector.detect_beat(&fft_magnitude)
    };

    let frequencies: Vec<f32> = (0..CHUNK / 2)
        .map(|i| i as f32 * RATE as f32 / CHUNK as f32)
        .collect();
    let mids_band: Vec<usize> = frequencies
        .iter()
        .enumerate()
        .filter(|(_, &f)| f >= 250.0 && f < 4000.0)
        .map(|(i, _)| i)
        .collect();

    let mids_energy = if !mids_band.is_empty() {
        mids_band.iter().map(|&i| fft_magnitude[i]).sum::<f32>() / mids_band.len() as f32
    } else {
        0.0
    };

    let normalized_mids = (mids_energy / RHYTHM_NORMALIZATION_FACTOR).min(1.0);
    println!("Mids Energy: {:.4}, Normalized Mids: {:.4}", mids_energy, normalized_mids);

    let payload = AudioDataPayload {
        is_beat,
        rhythm_factor: normalized_mids,
    };
    let _ = app_handle.emit("audio_data", payload);
}
