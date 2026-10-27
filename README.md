# Amber VU

**by Kahraman MELEK®** · [kahraman.melek@gmail.com](mailto:kahraman.melek@gmail.com) · [GitHub](https://github.com/kahraman-melek-mimar)

A Chrome extension with 15 stereo music visualizers. Audio is processed on your device; no server, microphone, account or API key is required.

## Install / Kurulum

1. Download a release ZIP and extract it completely. / ZIP’i tamamen çıkartın.
2. Open `chrome://extensions` and enable **Developer mode / Geliştirici modu**.
3. Choose **Load unpacked / Paketlenmemiş öğe yükle** and select the `extension` folder containing `manifest.json`.
4. Play music in a normal web tab, then click the Amber VU toolbar icon. / Müzik çalan sekmede Amber VU simgesine tıklayın.
5. Choose a visualizer. Close the window or select **Dinlemeyi durdur** to stop capture. **Yeniden başlat** reconnects to the same tab.

Chrome 116+ is required. This is a Chrome extension, not a standalone Windows/macOS app. The platform launchers open the installation guide; Chrome installation still requires the manual Load unpacked step.

## Collection / Koleksiyon

Vintage Hi-Fi, Studio, Cassette, Tube Amp, Retro LED, Nixie, Oscilloscope, Stereo Vectorscope, Radial Stereo, Nebula, Photon, Tesla, Glass ECG, Paper ECG and Vintage ECG.

- Independent left/right audio; Nixie clock, elapsed and remaining time.
- Two 25×25 LED matrices, glass plasma sphere and moving paper with winding rolls.
- Detailed artwork with live canvas animation. Frame rate and resolution are limited to reduce playback load.
- Author name and contact links remain visible in every theme.

## Compatibility and known issues / Uyumluluk ve bilinen sorunlar

**Live Windows verification is pending.** Automated Windows browser checks, when green, verify rendering, core logic, Web Audio processing and packaging. They do not establish that real YouTube tab capture works on every Windows installation. See [WINDOWS-TEST.md](WINDOWS-TEST.md).

**Windows üzerinde gerçek müzikle canlı test henüz tamamlanmadı.** Otomatik test sonucu ile canlı YouTube testi ayrı değerlendirilir.

**Known issue:** Amber VU and YTM AI Blocker currently do not work together when used simultaneously. Investigation is deferred. Test Amber VU with YTM AI Blocker disabled.

**Bilinen sorun:** Amber VU ve YTM AI Blocker aynı anda çalışmıyor. İnceleme sonraya bırakıldı. Windows denemesini YTM AI Blocker kapalıyken yapın.

Protected media and internal browser pages may reject capture. Track time is available for ordinary HTML audio/video in the selected tab; cross-origin frames and custom players may not expose it. Displayed analog scales are artistic visualizers, not calibrated studio instruments.

## Privacy / Gizlilik

Audio stays on the device. No external libraries or network requests are needed during normal extension operation. `tabCapture` and `offscreen` process selected-tab audio. `activeTab`/`scripting` read that tab’s media time after the user clicks the icon. `storage` saves preferences and session state. No permanent all-sites permission is requested. Email/GitHub links open only when clicked.

## Development

```sh
npm install --ignore-scripts
npx playwright install chromium
npm test
npm run test:browser
python tools/build_release.py
```

Tests run on Windows and Linux in GitHub Actions. The browser suite uses synthetic audio and mocked extension controls; its separate Web Audio test runs an actual AudioWorklet. Test artifacts include screenshots and an environment report.

© 2026 Kahraman MELEK®.
