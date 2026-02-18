# Panduan Deployment Native App - DompetPintar

## Daftar Isi
1. [Prasyarat](#prasyarat)
2. [Setup Proyek Lokal](#setup-proyek-lokal)
3. [Konfigurasi Capacitor](#konfigurasi-capacitor)
4. [Push Notifications](#push-notifications)
5. [Build Android](#build-android)
6. [Build iOS](#build-ios)
7. [Troubleshooting](#troubleshooting)

---

## Prasyarat

### Umum
- Node.js >= 18
- npm atau bun
- Git

### Android
- Android Studio (versi terbaru)
- Android SDK API Level 33+
- JDK 17+
- Emulator atau perangkat fisik Android (USB debugging aktif)

### iOS
- macOS (wajib)
- Xcode 15+
- CocoaPods (`sudo gem install cocoapods`)
- Apple Developer Account (untuk deploy ke App Store)
- iPhone fisik atau Simulator

---

## Setup Proyek Lokal

### 1. Export & Clone dari Lovable

```bash
# Klik "Export to GitHub" di Lovable
# Lalu clone repository
git clone https://github.com/USERNAME/REPO_NAME.git
cd REPO_NAME
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build Proyek Web

```bash
npm run build
```

Ini akan menghasilkan folder `dist/` yang berisi aset web statis.

### 4. Tambahkan Platform Native

```bash
# Untuk Android
npx cap add android

# Untuk iOS (hanya di macOS)
npx cap add ios
```

### 5. Sinkronisasi Aset

```bash
npx cap sync
```

> **Penting:** Jalankan `npm run build && npx cap sync` setiap kali ada perubahan kode sebelum menjalankan app native.

---

## Konfigurasi Capacitor

File `capacitor.config.json` sudah dikonfigurasi:

```json
{
  "appId": "app.lovable.6c74dfdf96aa4c0bb49cc21b49a50169",
  "appName": "financee-me",
  "webDir": "dist",
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "launchAutoHide": true,
      "launchFadeOutDuration": 500,
      "backgroundColor": "#1a3a2a",
      "androidSplashResourceName": "splash",
      "androidScaleType": "CENTER_CROP",
      "showSpinner": false,
      "splashFullScreen": true,
      "splashImmersive": true
    }
  }
}
```

### Mengubah App ID untuk Produksi

Jika ingin publish ke store, ubah `appId` menjadi format reverse domain milik Anda:

```json
"appId": "com.namaanda.dompetpintar"
```

---

## Push Notifications

### Android Setup

1. **Buat project di Firebase Console** → https://console.firebase.google.com
2. Tambahkan app Android dengan package name yang sama dengan `appId`
3. Download `google-services.json`
4. Letakkan di `android/app/google-services.json`

5. Edit `android/build.gradle`, tambahkan:
```groovy
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

6. Edit `android/app/build.gradle`, tambahkan di akhir:
```groovy
apply plugin: 'com.google.gms.google-services'
```

7. Sync dan build:
```bash
npx cap sync android
```

### iOS Setup

1. Di **Firebase Console**, tambahkan app iOS
2. Download `GoogleService-Info.plist`
3. Buka Xcode → drag file ke folder App
4. Enable **Push Notifications** capability di Xcode:
   - Pilih target app → Signing & Capabilities → + Capability → Push Notifications
5. Upload APNs key ke Firebase:
   - Apple Developer → Keys → Create key dengan APNs
   - Upload ke Firebase → Project Settings → Cloud Messaging → iOS
6. Sync:
```bash
npx cap sync ios
```

### Kode Push Notification (Sudah Terintegrasi)

Hook `usePushNotifications` di `src/hooks/usePushNotifications.ts` sudah menangani:
- Request permission
- Register device token
- Listen notifikasi masuk
- Handle aksi notifikasi

---

## Build Android

### Development (Debug)

```bash
# Build web assets
npm run build

# Sync ke Android
npx cap sync android

# Buka di Android Studio
npx cap open android

# Atau jalankan langsung di emulator/device
npx cap run android
```

### Production (Release APK/AAB)

1. **Buka Android Studio:**
```bash
npx cap open android
```

2. **Generate Signed Bundle:**
   - Menu: Build → Generate Signed Bundle / APK
   - Pilih **Android App Bundle** (untuk Play Store) atau **APK** (untuk sideload)
   - Buat keystore baru jika belum ada:
     - Key store path: `android/app/release.keystore`
     - Password, Alias, dll
   - Build variant: `release`

3. **Output:**
   - AAB: `android/app/build/outputs/bundle/release/app-release.aab`
   - APK: `android/app/build/outputs/apk/release/app-release.apk`

### Install APK ke Perangkat

```bash
# Via ADB
adb install android/app/build/outputs/apk/release/app-release.apk

# Atau transfer file APK ke HP dan install manual
```

### Publish ke Google Play Store

1. Buat akun **Google Play Console** (biaya $25 sekali bayar)
2. Buat app baru → Upload AAB
3. Isi informasi: deskripsi, screenshot, ikon, kategori
4. Submit untuk review

---

## Build iOS

### Development (Debug)

```bash
npm run build
npx cap sync ios
npx cap open ios
```

Di Xcode:
1. Pilih target device atau Simulator
2. Klik ▶ Run

### Menjalankan di iPhone Fisik

1. Sambungkan iPhone via USB
2. Di Xcode → pilih device Anda sebagai target
3. Pada tab **Signing & Capabilities**:
   - Pilih Team (Apple ID Anda)
   - Pastikan Bundle Identifier sesuai
4. Klik ▶ Run
5. Di iPhone: Settings → General → Device Management → Trust developer

### Production (Release IPA)

1. **Archive Build:**
   - Xcode → Product → Archive
   - Pastikan scheme = Release

2. **Distribute App:**
   - Organizer window akan muncul
   - Pilih "Distribute App"
   - Pilih "App Store Connect" untuk publish
   - Atau pilih "Ad Hoc" untuk testing

### Publish ke Apple App Store

1. Buat akun **Apple Developer Program** ($99/tahun)
2. Di **App Store Connect**, buat app baru
3. Upload build melalui Xcode (Archive → Distribute)
4. Isi metadata: deskripsi, screenshot, kata kunci
5. Submit untuk App Review

---

## Kustomisasi Aset Native

### App Icon

File `public/app-icon.png` (1024x1024) sudah disediakan.

**Android:**
1. Buka Android Studio
2. Right-click `res` → New → Image Asset
3. Pilih `app-icon.png` sebagai source
4. Generate semua ukuran otomatis

**iOS:**
1. Buka `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
2. Gunakan tool seperti https://appicon.co untuk generate semua ukuran
3. Replace file-file di folder tersebut

### Splash Screen

File `public/splash.png` sudah disediakan.

**Android:**
- Letakkan di `android/app/src/main/res/drawable/splash.png`
- Atau gunakan Android Studio Image Asset Generator

**iOS:**
- Edit `ios/App/App/Assets.xcassets/Splash.imageset/`

---

## Responsive Design

Aplikasi sudah mendukung responsive design dengan:

- **Safe Area Insets**: CSS `env(safe-area-inset-*)` untuk notch dan home indicator
- **Viewport Fit**: `viewport-fit=cover` untuk fullscreen di iPhone X+
- **Sidebar Responsive**: Otomatis collapse di mobile, full di desktop
- **Grid Layout**: Menggunakan Tailwind responsive breakpoints (`sm:`, `md:`, `lg:`)

### Breakpoints yang Digunakan

| Breakpoint | Ukuran | Device |
|-----------|--------|--------|
| Default | < 640px | Smartphone |
| `sm:` | ≥ 640px | Smartphone landscape |
| `md:` | ≥ 768px | Tablet |
| `lg:` | ≥ 1024px | Desktop kecil |
| `xl:` | ≥ 1280px | Desktop |

---

## Troubleshooting

### Error: "Could not find google-services.json"
→ Pastikan file `google-services.json` ada di `android/app/`

### Error: "No signing certificate" (iOS)
→ Pastikan Team sudah dipilih di Xcode → Signing & Capabilities

### App blank/putih setelah build
→ Pastikan sudah menjalankan `npm run build` sebelum `npx cap sync`

### Push notification tidak muncul
→ Periksa:
1. Permission sudah granted
2. Firebase/APNs sudah dikonfigurasi dengan benar
3. Test di perangkat fisik (push tidak bekerja di emulator iOS)

### Hot Reload untuk Development

Untuk development dengan hot reload, tambahkan kembali server config di `capacitor.config.json`:

```json
"server": {
  "url": "https://6c74dfdf-96aa-4c0b-b49c-c21b49a50169.lovableproject.com?forceHideBadge=true",
  "cleartext": true
}
```

> **Hapus blok `server` sebelum build produksi!**

---

## Workflow Ringkas

```
┌─────────────────────────────────┐
│  1. Edit kode di Lovable        │
│  2. Export ke GitHub             │
│  3. git pull                    │
│  4. npm install                 │
│  5. npm run build               │
│  6. npx cap sync                │
│  7. npx cap run android/ios     │
│  8. Test di device/emulator     │
│  9. Build release (Studio/Xcode)│
│ 10. Upload ke Play Store/       │
│     App Store                   │
└─────────────────────────────────┘
```

---

## Checklist Deploy

- [ ] App icon (1024x1024) sudah disiapkan
- [ ] Splash screen sudah disiapkan
- [ ] `npm run build` berhasil tanpa error
- [ ] `npx cap sync` berhasil
- [ ] Push notification terkonfigurasi (Firebase)
- [ ] Blok `server` dihapus dari capacitor.config.json
- [ ] Signing certificate/keystore sudah dibuat
- [ ] Test di perangkat fisik
- [ ] Screenshot untuk store listing
- [ ] Deskripsi app dan metadata lengkap
- [ ] Privacy policy URL (wajib untuk App Store)
- [ ] Submit ke store review
