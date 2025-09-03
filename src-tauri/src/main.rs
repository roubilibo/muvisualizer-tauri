// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod audio;
use std::sync::{Arc, Mutex};

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let audio_state = Arc::new(Mutex::new(audio::AudioState::new()));
            let app_handle = app.handle();
            // Inisialisasi global state
            audio::AUDIO_STATE.set(audio_state.clone()).ok();
            audio::APP_HANDLE.set(app_handle.clone()).ok();
            // Mulai audio processing (thread terpisah)
            audio::start_audio_stream(app_handle.clone(), audio_state.clone());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![audio::select_device])
        .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
