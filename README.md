# UTS AR — Marker-Based Augmented Reality (PP50 & PP49)

Implementasi augmented reality dengan mekanisme **marker-based** pada web, di-deploy
di situs **GitHub Pages (github.io)**.

## Teknologi

| Komponen | Versi / Detail |
|---|---|
| AR.js | 3.4.8 (build `aframe-ar.js`, marker tracking + jsartoolkit5) — CDN jsDelivr |
| A-Frame | 1.6.0 |
| Marker | Preset **Hiro** (fiducial) + smoothing |
| Konten 3D | `RobotExpressive.glb` (three.js examples, MIT) — 9 klip animasi |
| Animasi | `THREE.AnimationMixer` manual (A-Frame 1.6.0 tidak punya komponen `animation-mixer`) |
| Hosting | GitHub Pages (`https://imanuelandreas.github.io/UTS-AR/`) |

## Struktur

```
index.html    # Penjelasan teori marker-based AR + navigasi
ar.html       # Experience AR (kamera + marker Hiro + robot glTF)
marker.html   # Marker Hiro siap cetak
css/style.css # Tema & styling (termasuk print CSS untuk marker)
js/ar.js      # Komponen robot-controller + HUD (status marker, kontrol animasi)
assets/
  img/hiro.png
  models/RobotExpressive.glb
```

## Menjalankan Lokal

Kamera hanya bisa diakses lewat **HTTPS** atau **localhost**:

```bash
npx http-server . -p 8080 -c-1
# lalu buka http://localhost:8080/ar.html
```

## Deploy ke GitHub Pages

1. Push semua file ke branch `main`.
2. Repository → **Settings → Pages** → *Deploy from a branch* → branch `main`, folder `/(root)` → **Save**.
3. Buka `https://imanuelandreas.github.io/UTS-AR/`.

## Cara Pakai Demo

1. Buka `marker.html` (cetak atau tampilkan di layar kedua).
2. Buka `ar.html` di smartphone → izinkan kamera.
3. Arahkan kamera ke marker → robot muncul & bisa diganti animasinya (Berdiri, Menari, Berjalan, Loncat, dll).

## Referensi

- [AR.js](https://ar-js-org.github.io/AR.js/)
- [A-Frame](https://aframe.io/)
- [three.js RobotExpressive](https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf/RobotExpressive)
