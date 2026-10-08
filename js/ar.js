/* Marker-Based AR — kontrol animasi glTF + HUD
   A-Frame 1.6.0 tidak menyediakan komponen animation-mixer bawaan,
   sehingga mixer dibuat manual dengan THREE.AnimationMixer. */

var ROBOT_LABELS = {
  Idle: "Berdiri",
  Dance: "Menari",
  Walking: "Berjalan",
  Running: "Berlari",
  Jump: "Loncat",
  Sitting: "Duduk",
  Standing: "Tegak",
  Death: "Tumbang",
  WalkJump: "Lompat Jalan",
  blink: "Kedip",
};

var ONE_SHOT = ["Jump", "Death"];
var TARGET_HEIGHT = 10.0;

if (window.AFRAME) {
  AFRAME.registerComponent("robot-controller", {
    init: function () {
      this.mixer = null;
      this.actions = {};
      this.currentName = null;
      this.clock = new THREE.Clock();
      this.onModelLoaded = this.onModelLoaded.bind(this);
      this.el.addEventListener("model-loaded", this.onModelLoaded);
    },

    remove: function () {
      this.el.removeEventListener("model-loaded", this.onModelLoaded);
      if (this.mixer) this.mixer.stopAllAction();
    },

    onModelLoaded: function () {
      var model = this.el.getObject3D("model");
      if (!model) return;

      this.fitToMarker(model);

      this.mixer = new THREE.AnimationMixer(model);
      var clips = model.animations || [];
      for (var i = 0; i < clips.length; i++) {
        var clip = clips[i];
        var name = clip.name || "clip" + i;
        var action = this.mixer.clipAction(clip);
        if (ONE_SHOT.indexOf(name) !== -1) {
          action.setLoop(THREE.LoopOnce);
          action.clampWhenFinished = true;
        }
        this.actions[name] = action;
      }

      var names = Object.keys(this.actions);
      if (names.length) this.play(names.indexOf("Idle") !== -1 ? "Idle" : names[0]);

      document.dispatchEvent(new CustomEvent("robot-ready", { detail: { clips: names } }));
      this.el.emit("robot-ready", { clips: names });
    },

    /* Skala & posisi otomatis agar model selalu pas di atas marker */
    fitToMarker: function (model) {
      model.updateWorldMatrix(true, true);
      var inv = new THREE.Matrix4().copy(model.matrixWorld).invert();
      var box = new THREE.Box3();
      var m = new THREE.Matrix4();
      var self = this;

      model.traverse(function (obj) {
        if (!obj.isMesh || !obj.geometry) return;
        if (!obj.geometry.boundingBox) {
          obj.geometry.boundingBox = new THREE.Box3().setFromBufferAttribute(obj.geometry.attributes.position);
        }
        m.multiplyMatrices(inv, obj.matrixWorld);
        box.union(obj.geometry.boundingBox.clone().applyMatrix4(m));
      });

      var size = box.getSize(new THREE.Vector3());
      if (!isFinite(size.y) || size.y <= 0) return;

      var s = TARGET_HEIGHT / size.y;
      var center = box.getCenter(new THREE.Vector3());

      self.el.setAttribute("scale", { x: s, y: s, z: s });
      self.el.setAttribute("position", {
        x: -center.x * s,
        y: -box.min.y * s,
        z: -center.z * s,
      });
    },

    play: function (name) {
      var next = this.actions[name];
      if (!next || this.currentName === name) return;
      var prev = this.actions[this.currentName];
      if (prev) prev.fadeOut(0.2);
      next.reset().fadeIn(0.2).play();
      this.currentName = name;
      document.dispatchEvent(new CustomEvent("robot-anim", { detail: { name: name } }));
    },

    tick: function () {
      if (this.mixer) this.mixer.update(this.clock.getDelta());
    },
  });
}

document.addEventListener("DOMContentLoaded", function () {
  var overlay = document.getElementById("arOverlay");
  var overlayCard = overlay ? overlay.querySelector(".overlay-card") : null;
  var overlayTitle = document.getElementById("overlayTitle");
  var overlayText = document.getElementById("overlayText");
  var overlayHowto = document.getElementById("overlayHowto");
  var overlayBtn = document.getElementById("overlayBtn");
  var statusEl = document.getElementById("arStatus");
  var controlsEl = document.getElementById("arControls");
  var scene = document.querySelector("a-scene");
  var robotEl = document.querySelector("#robot");
  var started = false;

  function setStatus(state, label) {
    if (!statusEl) return;
    statusEl.dataset.state = state;
    statusEl.textContent = label;
  }

  function removeSpinner() {
    var sp = document.getElementById("arSpinner");
    if (sp) sp.remove();
  }

  function showError(title, text) {
    if (!overlay) return;
    removeSpinner();
    overlay.classList.remove("hidden");
    if (overlayCard) overlayCard.classList.add("error");
    if (overlayTitle) overlayTitle.textContent = title;
    if (overlayText) overlayText.textContent = text;
    if (overlayHowto) overlayHowto.hidden = true;
    if (overlayBtn) { overlayBtn.hidden = false; overlayBtn.textContent = "Tutup"; }
    setStatus("error", "Kamera bermasalah");
  }

  function showIntro(title, text) {
    if (!overlay) return;
    removeSpinner();
    overlay.classList.remove("hidden");
    if (overlayCard) overlayCard.classList.remove("error");
    if (overlayTitle) overlayTitle.textContent = title;
    if (overlayText) overlayText.textContent = text;
    if (overlayHowto) overlayHowto.hidden = false;
    if (overlayBtn) { overlayBtn.hidden = false; overlayBtn.textContent = "Mulai"; }
  }

  function setBusy(label, sub) {
    if (!overlay) return;
    overlay.classList.remove("hidden");
    if (overlayCard) overlayCard.classList.remove("error");
    if (overlayTitle) overlayTitle.textContent = label;
    if (overlayText) overlayText.textContent = sub || "";
    if (overlayHowto) overlayHowto.hidden = true;
    if (overlayBtn) overlayBtn.hidden = true;
    if (!document.getElementById("arSpinner")) {
      var sp = document.createElement("div");
      sp.className = "spinner";
      sp.id = "arSpinner";
      if (overlayCard) overlayCard.insertBefore(sp, overlayCard.firstChild);
    }
  }

  if (overlayBtn) {
    overlayBtn.addEventListener("click", function () {
      if (overlayCard && overlayCard.classList.contains("error")) {
        overlay.classList.add("hidden");
        return;
      }
      overlay.classList.add("hidden");
      started = true;
      watchCamera();
    });
  }

  /* Preflight: context aman (HTTPS/localhost) + dukungan kamera */
  if (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showError(
      "Kamera Tidak Bisa Diakses",
      "Halaman harus dibuka lewat HTTPS (github.io sudah HTTPS) atau localhost, dan browser harus mendukung getUserMedia."
    );
    return;
  }

  if (!window.AFRAME || !window.THREE) {
    showError("Gagal Memuat Library", "A-Frame/AR.js gagal dimuat. Periksa koneksi internet lalu muat ulang halaman.");
    return;
  }

  setBusy("Menyiapkan AR…", "Mengaktifkan kamera dan memuat model 3D.");
  setStatus("searching", "Menginisialisasi kamera…");

  var sceneReady = false;
  var modelReady = false;

  function onReady() {
    if (!sceneReady || !modelReady) return;
    showIntro(
      "Marker-Based AR Siap",
      "Arahkan kamera ke marker Hiro untuk menampilkan model 3D."
    );
    setStatus("searching", "Mencari marker…");
  }

  if (scene) {
    if (scene.hasLoaded) { sceneReady = true; onReady(); }
    else {
      scene.addEventListener("loaded", function () {
        sceneReady = true;
        onReady();
      });
    }
  } else {
    sceneReady = true;
  }

  setTimeout(function () {
    if (!modelReady) {
      modelReady = true;
      onReady();
    }
  }, 8000);

  document.addEventListener("robot-ready", function (e) {
    buildControls(e.detail.clips || []);
    modelReady = true;
    onReady();
  });

  if (robotEl) {
    var comp = robotEl.components && robotEl.components["robot-controller"];
    if (comp && Object.keys(comp.actions).length) buildControls(Object.keys(comp.actions));
  }

  /* Deteksi kamera tidak menghasilkan frame (izin ditolak dsb.) */
  function watchCamera() {
    var tries = 0;
    var timer = setInterval(function () {
      tries++;
      var videos = document.querySelectorAll("video");
      var ok = false;
      for (var i = 0; i < videos.length; i++) {
        if (videos[i].videoWidth > 0) { ok = true; break; }
      }
      if (ok) {
        clearInterval(timer);
        setStatus("searching", "Mencari marker…");
      } else if (tries >= 12) {
        clearInterval(timer);
        showError(
          "Kamera Tidak Aktif",
          "Izin kamera kemungkinan ditolak. Buka pengaturan situs di browser, izinkan Camera, lalu muat ulang halaman."
        );
      }
    }, 1000);
  }

  /* Status marker — AR.js mengirim event di window dan di elemen marker */
  function onFound() { if (started) setStatus("found", "Marker terdeteksi ✓"); }
  function onLost() { if (started) setStatus("searching", "Marker hilang — cari lagi"); }

  window.addEventListener("markerFound", onFound);
  window.addEventListener("markerLost", onLost);
  var markerEl = document.querySelector("#marker");
  if (markerEl) {
    markerEl.addEventListener("markerFound", onFound);
    markerEl.addEventListener("markerLost", onLost);
  }

  /* Kontrol animasi */
  function buildControls(clips) {
    if (!controlsEl || !clips.length || controlsEl.childElementCount) return;
    clips.forEach(function (name) {
      var b = document.createElement("button");
      b.className = "anim-btn";
      b.dataset.anim = name;
      b.textContent = ROBOT_LABELS[name] || name;
      b.addEventListener("click", function () {
        var c = robotEl && robotEl.components["robot-controller"];
        if (c) c.play(name);
      });
      controlsEl.appendChild(b);
    });
    markActive(clips.indexOf("Idle") !== -1 ? "Idle" : clips[0]);
  }

  function markActive(name) {
    if (!controlsEl) return;
    var btns = controlsEl.querySelectorAll(".anim-btn");
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle("active", btns[i].dataset.anim === name);
    }
  }

  document.addEventListener("robot-anim", function (e) {
    markActive(e.detail.name);
  });
});
