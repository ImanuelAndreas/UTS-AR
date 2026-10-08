# UTS AR — Marker-Based Augmented Reality (PP50 & PP49)

Implementasi augmented reality dengan mekanisme **marker-based** pada web, di-deploy
di situs **GitHub Pages (github.io)**.

## Teknologi

| Komponen | Versi / Detail |
|---|---|
| AR.js | 3.4.8 (build `aframe-ar.js`, marker tracking + jsartoolkit5) — CDN jsDelivr |
| A-Frame | 1.6.0 |
| Marker | Preset **Hiro** (fiducial) + smoothing |
| Konten 3D | `luffy.glb` — Monkey D Luffy (skinned mesh, 1 klip animasi `blink`) |
| Animasi | `THREE.AnimationMixer` manual (A-Frame 1.6.0 tidak punya komponen `animation-mixer`) |
| Hosting | GitHub Pages (`https://imanuelandreas.github.io/UTS-AR/`) |

## Struktur

```
index.html    # Penjelasan teori marker-based AR + navigasi
ar.html       # Experience AR (kamera + marker Hiro + model glTF luffy.glb)
marker.html   # Marker Hiro siap cetak
css/style.css # Tema & styling (termasuk print CSS untuk marker)
js/ar.js      # Komponen robot-controller + HUD (status marker, kontrol animasi)
assets/
  img/hiro.png
  models/luffy.glb
  models/RobotExpressive.glb   # cadangan (tidak dipakai)
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
3. Arahkan kamera ke marker → model Monkey D Luffy muncul & tombol animasi (*blink*) muncul di HUD bawah.

## Referensi

- [AR.js](https://ar-js-org.github.io/AR.js/)
- [A-Frame](https://aframe.io/)
- Model `luffy.glb` — Monkey D Luffy oleh AKIN di Sketchfab (isi: sumber model, lengkapi lisensi/atribusi)
- [three.js RobotExpressive](https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf/RobotExpressive) (cadangan)
