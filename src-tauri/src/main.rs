#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::mpsc;
use std::sync::{Arc, Mutex};
use std::thread;
mod audio;

fn main() {
    // 1. Create a channel for communicating with the audio thread.
    let (tx, rx) = mpsc::channel();

    // 2. Create the state that will be shared with the audio thread (for processing).
    let audio_state = Arc::new(Mutex::new(audio::AudioState::new()));

    // 3. Create the state that will be managed by Tauri (for sending commands).
    // NOTE: The `sender` field in AudioThreadManager is a Mutex, so we must wrap the tx here.
    let thread_manager = audio::AudioThreadManager { sender: Mutex::new(tx) };

    tauri::Builder::default()
        .manage(thread_manager)
        .manage(audio_state.clone())
        .setup(move |app| {
            let app_handle = app.handle().clone();

            // 4. Spawn the dedicated audio thread.
            thread::spawn(move || {
                audio::audio_thread_main(app_handle, audio_state, rx);
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            audio::get_devices,
            audio::select_device
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
