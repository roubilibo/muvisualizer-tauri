# MuVisualizer

MuVisualizer adalah aplikasi visualisasi berbasis Tauri + React. Repositori ini terbuka untuk kontribusi! Berikut panduan lengkap untuk calon kontributor.

## Daftar Isi

- [Persyaratan Sistem](#persyaratan-sistem)
- [Instalasi & Setup](#instalasi--setup)
- [Menjalankan Aplikasi](#menjalankan-aplikasi)
- [Build Aplikasi](#build-aplikasi)
- [Struktur Proyek](#struktur-proyek)
- [Panduan Kontribusi](#panduan-kontribusi)
- [Referensi](#referensi)

---

## Persyaratan Sistem

- Node.js >= 16.x
- Yarn (atau npm)
- Rust & Cargo
- Tauri CLI

## Instalasi & Setup

1. **Clone repositori ini:**

   ```bash
   git clone https://github.com/roubilibo/learn-rust-muvisualizer.git
   cd muvisualizer
   ```

2. **Install dependensi frontend:**

   ```bash
   yarn install
   # atau
   npm install
   ```

3. **Install Rust:**

   - Ikuti petunjuk di https://www.rust-lang.org/tools/install
   - Pastikan `cargo` sudah tersedia di terminal.

4. **Install Tauri CLI:**

   ```bash
   cargo install tauri-cli
   ```

   Jika menggunakan Yarn:

   ```bash
   yarn global add @tauri-apps/cli
   ```

   Atau dengan npm:

   ```bash
   npm install -g @tauri-apps/cli
   ```

5. **(Opsional) Update Rust toolchain:**
   ```bash
   rustup update
   ```

## Menjalankan Aplikasi

Jalankan aplikasi dalam mode pengembangan:

```bash
yarn tauri dev
# atau
npm run tauri dev
```

Aplikasi akan terbuka dalam mode desktop.

## Build Aplikasi

Untuk membangun aplikasi (release build):

```bash
yarn tauri build
# atau
npm run tauri build
```

Hasil build dapat ditemukan di `src-tauri/target/release/`.

## Struktur Proyek

- `src/` : Kode sumber React (frontend)
- `src-tauri/` : Kode sumber Rust (backend Tauri)
- `public/` : Aset publik
- `index.html`, `vite.config.js` : Konfigurasi frontend

## Panduan Kontribusi

1. **Fork** repositori ini.
2. **Buat branch baru** untuk fitur/bugfix:
   ```bash
   git checkout -b nama-fitur-anda
   ```
3. **Lakukan perubahan** dan **commit** dengan pesan yang jelas.
4. **Push** ke fork Anda dan **ajukan Pull Request** ke branch `main`.
5. Sertakan deskripsi perubahan dan, jika perlu, screenshot.

### Tips Pengembangan

- Gunakan `yarn tauri dev` untuk hot reload.
- Periksa error di terminal dan browser console.
- Dokumentasikan kode Anda jika perlu.

## Referensi

- [Dokumentasi Tauri](https://tauri.app/v1/guides/getting-started/prerequisites)
- [Dokumentasi React](https://react.dev/)
- [Rust Lang](https://www.rust-lang.org/)

---

Kontribusi Anda sangat berarti! Jangan ragu untuk membuka issue jika menemukan bug atau ingin bertanya.

This template should help get you started developing with Tauri and React in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
