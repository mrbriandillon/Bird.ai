// Bird.ai — main app logic.
// Flow: pick a file → hash it into a bird → fetch a real photo from iNaturalist
// → render the result card → let the user share or download it.

(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const views = {
    intro: $('[data-view="intro"]'),
    analyzing: $('[data-view="analyzing"]'),
    result: $('[data-view="result"]'),
  };

  function showView(name) {
    for (const [k, el] of Object.entries(views)) el.hidden = k !== name;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---------- Upload handling ----------
  const fileInput = $("#file-input");
  const dropzone = $("#dropzone");
  const chooseBtn = $("#choose-btn");
  const cameraBtn = $("#camera-btn");

  chooseBtn.addEventListener("click", () => {
    fileInput.removeAttribute("capture");
    fileInput.click();
  });
  cameraBtn.addEventListener("click", () => {
    fileInput.setAttribute("capture", "user");
    fileInput.click();
  });

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) handleFile(file);
  });

  ["dragenter", "dragover"].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropzone.classList.add("is-drag");
    })
  );
  ["dragleave", "drop"].forEach((ev) =>
    dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      dropzone.classList.remove("is-drag");
    })
  );
  dropzone.addEventListener("drop", (e) => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  });

  async function handleFile(file) {
    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      return;
    }
    showView("analyzing");
    await runAnalyzeSequence(file);
  }

  // ---------- Analyze sequence ----------
  const statusLine = $("#status-line");
  const progressBar = $("#progress-bar");

  const STATUS_LINES = [
    "Warming up the oracle.",
    "Counting feathers.",
    "Consulting the flock.",
    "Matching aura to plumage.",
    "Cross-referencing the field guide.",
    "Whispering to a crow.",
  ];

  async function runAnalyzeSequence(file) {
    progressBar.style.width = "0%";
    const steps = STATUS_LINES.length;
    const delay = 400;

    // Start the bird selection in parallel; it's fast but let the UI breathe.
    const pickPromise = window.pickBirdForImage(file);

    for (let i = 0; i < steps; i++) {
      statusLine.textContent = STATUS_LINES[i];
      progressBar.style.width = `${Math.round(((i + 1) / steps) * 85)}%`;
      await sleep(delay);
    }

    const bird = await pickPromise;
    statusLine.textContent = `Your bird is a ${bird.commonName}.`;
    progressBar.style.width = "100%";
    await sleep(450);

    await renderResult(bird);
    showView("result");
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------- iNaturalist image fetching ----------
  const PHOTO_CACHE_KEY = "birdai:photocache:v1";
  const photoCache = loadPhotoCache();

  function loadPhotoCache() {
    try {
      return JSON.parse(sessionStorage.getItem(PHOTO_CACHE_KEY) || "{}");
    } catch {
      return {};
    }
  }
  function savePhotoCache() {
    try {
      sessionStorage.setItem(PHOTO_CACHE_KEY, JSON.stringify(photoCache));
    } catch {
      /* storage full or unavailable — non-fatal */
    }
  }

  async function fetchBirdPhoto(bird) {
    if (photoCache[bird.id]) return photoCache[bird.id];

    const endpoints = [
      bird.taxonId
        ? `https://api.inaturalist.org/v1/taxa/${bird.taxonId}`
        : null,
      `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(
        bird.scientificName
      )}&rank=species&per_page=1`,
      `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(
        bird.commonName
      )}&per_page=1`,
    ].filter(Boolean);

    for (const url of endpoints) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const data = await res.json();
        const taxon = data.results && data.results[0];
        if (!taxon || !taxon.default_photo) continue;
        const dp = taxon.default_photo;
        const info = {
          url: dp.medium_url || dp.url || dp.square_url || "",
          squareUrl: dp.square_url || dp.url || "",
          attribution: dp.attribution || "iNaturalist",
          wikipediaUrl: taxon.wikipedia_url || null,
        };
        if (info.url) {
          photoCache[bird.id] = info;
          savePhotoCache();
          return info;
        }
      } catch (err) {
        // network or CORS — try next endpoint
      }
    }
    return null;
  }

  // ---------- Render the result card ----------
  let currentBird = null;
  let currentPhoto = null;

  function setCardAccent(palette) {
    const card = $("#birdcard");
    if (!palette || !palette.length) return;
    const [c1, c2, c3, c4] = palette;
    card.style.setProperty("--bird-c1", c1 || "var(--accent)");
    card.style.setProperty("--bird-c2", c2 || "var(--accent-2)");
    card.style.setProperty("--bird-c3", c3 || "var(--accent-3)");
    card.style.setProperty("--bird-c4", c4 || "var(--accent-4)");
  }

  async function renderResult(bird) {
    currentBird = bird;
    currentPhoto = null;

    setCardAccent(bird.palette);

    const idx = BIRDS.findIndex((b) => b.id === bird.id);
    $("#card-num").textContent = String(idx + 1).padStart(3, "0");
    $("#card-archetype").textContent = bird.archetype;
    $("#card-common").textContent = bird.commonName;
    $("#card-sci").textContent = bird.scientificName;
    $("#card-vibe").textContent = bird.vibe;
    $("#card-habitat").textContent = bird.habitat;
    $("#card-diet").textContent = bird.diet;
    $("#card-wingspan").textContent = bird.wingspan;
    $("#card-fact").textContent = bird.funFact;
    $("#card-personality").textContent = bird.personality;
    $("#card-stamp").textContent = `Specimen ${String.fromCharCode(
      65 + (idx % 26)
    )}`;

    const img = $("#card-photo");
    img.classList.remove("is-loaded");
    img.removeAttribute("src");
    img.alt = `Photograph of a ${bird.commonName} (${bird.scientificName})`;
    $("#card-credit").innerHTML = "photo: loading from iNaturalist…";

    const photo = await fetchBirdPhoto(bird);
    if (photo && photo.url) {
      currentPhoto = photo;
      img.onload = () => img.classList.add("is-loaded");
      img.src = photo.url;
      const credit = photo.attribution.replace(/\(c\)/gi, "©");
      $("#card-credit").innerHTML = `📷 ${escapeHtml(credit)} · via iNaturalist`;
    } else {
      $(
        "#card-credit"
      ).textContent = `photo unavailable — showing illustration`;
    }
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // ---------- Share / Download / Reset ----------
  $("#again-btn").addEventListener("click", () => {
    fileInput.value = "";
    showView("intro");
  });

  $("#download-btn").addEventListener("click", async () => {
    try {
      const blob = await renderCardToBlob();
      if (!blob) return toast("Could not render the card. Try again.");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `birdai-${currentBird.id}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast("Saved to your downloads.");
    } catch (err) {
      console.error(err);
      toast("Download failed. Try again?");
    }
  });

  $("#share-btn").addEventListener("click", async () => {
    const text = `I'm a ${currentBird.commonName} — ${currentBird.archetype}. ${currentBird.vibe}`;
    try {
      const blob = await renderCardToBlob();
      const files =
        blob && "File" in window
          ? [new File([blob], `birdai-${currentBird.id}.png`, { type: "image/png" })]
          : null;

      if (
        navigator.share &&
        files &&
        navigator.canShare &&
        navigator.canShare({ files })
      ) {
        await navigator.share({
          title: "Bird.ai",
          text,
          files,
        });
        return;
      }

      if (navigator.share) {
        await navigator.share({ title: "Bird.ai", text });
        return;
      }

      await navigator.clipboard.writeText(`${text} — find yours at Bird.ai`);
      toast("Copied to your clipboard.");
    } catch (err) {
      if (err && err.name === "AbortError") return;
      console.error(err);
      toast("Sharing wasn't available. Try download instead.");
    }
  });

  const toastEl = $("#toast");
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 2600);
  }

  // ---------- Canvas renderer (for share/download image) ----------
  // Draws a self-contained PNG version of the bird card.
  async function renderCardToBlob() {
    const bird = currentBird;
    if (!bird) return null;

    const W = 1080;
    const H = 1350;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    const [c1, c2, c3, c4] = bird.palette;

    // Paper background
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#fffdf7");
    bg.addColorStop(1, "#f4ecd8");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Color washes in corners
    drawRadial(ctx, W * 0.1, H * 0.1, W * 0.7, mix(c1, "#ffffff", 0.55) + "aa", "transparent");
    drawRadial(ctx, W * 0.95, H * 0.95, W * 0.7, mix(c3, "#ffffff", 0.55) + "aa", "transparent");

    // Grain
    ctx.save();
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 2500; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? "#000" : "#888";
      ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    }
    ctx.restore();

    // Outer border
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#1a1a1a";
    roundRect(ctx, 40, 40, W - 80, H - 80, 42);
    ctx.stroke();
    // Inner dashed frame
    ctx.save();
    ctx.setLineDash([8, 10]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(0,0,0,0.28)";
    roundRect(ctx, 60, 60, W - 120, H - 120, 32);
    ctx.stroke();
    ctx.restore();

    // Washi tape — top-left
    ctx.save();
    ctx.translate(160, 52);
    ctx.rotate((-7 * Math.PI) / 180);
    ctx.fillStyle = "rgba(255, 220, 120, 0.75)";
    ctx.fillRect(0, 0, 220, 48);
    ctx.strokeStyle = "rgba(0,0,0,0.2)";
    ctx.setLineDash([6, 8]);
    ctx.strokeRect(0, 0, 220, 48);
    ctx.restore();

    // Brand + number
    ctx.fillStyle = "#1a1a1a";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = "700 44px 'DM Serif Display', 'Fraunces', Georgia, serif";
    const brand = "Bird";
    ctx.fillText(brand, 90, 110);
    const brandW = ctx.measureText(brand).width;
    ctx.fillStyle = c1;
    ctx.fillText(".", 90 + brandW, 110);
    ctx.fillStyle = "#1a1a1a";
    ctx.font = "italic 700 44px 'DM Serif Display', 'Fraunces', Georgia, serif";
    ctx.fillText("ai", 90 + brandW + ctx.measureText(".").width, 110);

    ctx.font = "600 16px 'Space Grotesk', sans-serif";
    ctx.fillStyle = "#2b2b2b";
    const idx = BIRDS.findIndex((b) => b.id === bird.id);
    ctx.fillText(`FIELD GUIDE N° ${String(idx + 1).padStart(3, "0")}`, 90, 168);

    // Archetype pill
    const pillText = bird.archetype;
    ctx.font = "700 34px 'Caveat', cursive";
    const pillW = ctx.measureText(pillText).width + 48;
    const pillX = W - 90 - pillW;
    const pillY = 108;
    const pillH = 56;
    ctx.save();
    ctx.translate(pillX + pillW / 2, pillY + pillH / 2);
    ctx.rotate((-2 * Math.PI) / 180);
    ctx.fillStyle = mix(c2, "#ffffff", 0.45);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 3;
    roundRect(ctx, -pillW / 2, -pillH / 2, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = c4;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(pillText, 0, 2);
    ctx.restore();

    // Photo frame
    const frameX = 90;
    const frameY = 230;
    const frameW = 420;
    const frameH = 420;

    // Frame background gradient
    const frameGrad = ctx.createLinearGradient(frameX, frameY, frameX + frameW, frameY + frameH);
    frameGrad.addColorStop(0, mix(c1, "#ffffff", 0.55));
    frameGrad.addColorStop(1, mix(c3, "#ffffff", 0.55));
    ctx.fillStyle = frameGrad;
    roundRect(ctx, frameX, frameY, frameW, frameH, 22);
    ctx.fill();

    // Draw the photo if we have one
    const img = await loadImageForCanvas(currentPhoto && currentPhoto.url);
    if (img) {
      ctx.save();
      roundRect(ctx, frameX, frameY, frameW, frameH, 22);
      ctx.clip();
      // cover-fit
      const iar = img.width / img.height;
      const far = frameW / frameH;
      let dw, dh, dx, dy;
      if (iar > far) {
        dh = frameH;
        dw = iar * dh;
        dx = frameX - (dw - frameW) / 2;
        dy = frameY;
      } else {
        dw = frameW;
        dh = dw / iar;
        dx = frameX;
        dy = frameY - (dh - frameH) / 2;
      }
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    } else {
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "160px serif";
      ctx.fillText("🪶", frameX + frameW / 2, frameY + frameH / 2);
    }

    // Frame border + shadow block
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(frameX + 10, frameY + frameH + 2, frameW, 10);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#1a1a1a";
    roundRect(ctx, frameX, frameY, frameW, frameH, 22);
    ctx.stroke();

    // Specimen stamp
    ctx.save();
    ctx.translate(frameX + frameW - 90, frameY + frameH - 40);
    ctx.rotate((-5 * Math.PI) / 180);
    ctx.fillStyle = "rgba(255,253,247,0.95)";
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2;
    roundRect(ctx, -60, -18, 120, 36, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#1a1a1a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 14px 'Space Grotesk', sans-serif";
    ctx.fillText(
      `SPECIMEN ${String.fromCharCode(65 + (idx % 26))}`,
      0,
      1
    );
    ctx.restore();

    // Names — right side of photo
    const textX = frameX + frameW + 40;
    const textW = W - 90 - textX;
    ctx.fillStyle = "#1a1a1a";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = "400 58px 'DM Serif Display', 'Fraunces', Georgia, serif";
    const nameLines = wrap(ctx, bird.commonName, textW);
    let cy = frameY + 10;
    for (const line of nameLines) {
      ctx.fillText(line, textX, cy);
      cy += 62;
    }
    ctx.font = "italic 400 26px 'Fraunces', Georgia, serif";
    ctx.fillStyle = "#2b2b2b";
    ctx.fillText(bird.scientificName, textX, cy + 6);
    cy += 44;
    ctx.font = "500 32px 'Caveat', cursive";
    ctx.fillStyle = c1;
    const vibeLines = wrap(ctx, `"${bird.vibe}"`, textW);
    for (const line of vibeLines) {
      ctx.fillText(line, textX, cy);
      cy += 36;
    }

    // Facts panel
    const factsY = 700;
    const factsX = 90;
    const factsW = W - 180;
    const factsH = 200;
    ctx.fillStyle = mix(c2, "#ffffff", 0.75);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 3;
    roundRect(ctx, factsX, factsY, factsW, factsH, 14);
    ctx.fill();
    ctx.stroke();

    const colW = factsW / 2 - 24;
    drawFact(ctx, "HABITAT", bird.habitat, factsX + 20, factsY + 18, colW);
    drawFact(ctx, "DIET", bird.diet, factsX + 20 + factsW / 2, factsY + 18, colW);
    drawFact(ctx, "WINGSPAN", bird.wingspan, factsX + 20, factsY + 108, colW);
    drawFact(ctx, "FIELD NOTE", bird.funFact, factsX + 20 + factsW / 2, factsY + 108, colW);

    // Reading panel
    const readY = factsY + factsH + 24;
    const readH = 340;
    ctx.fillStyle = "#fffdf7";
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 3;
    roundRect(ctx, factsX, readY, factsW, readH, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = c4;
    ctx.font = "400 36px 'DM Serif Display', 'Fraunces', Georgia, serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Which means you are…", factsX + 24, readY + 20);

    ctx.fillStyle = "#1a1a1a";
    ctx.font = "400 24px 'Fraunces', Georgia, serif";
    const pLines = wrap(ctx, bird.personality, factsW - 48);
    let py = readY + 72;
    const maxLines = Math.floor((readH - 80) / 34);
    for (let i = 0; i < Math.min(pLines.length, maxLines); i++) {
      ctx.fillText(pLines[i], factsX + 24, py);
      py += 34;
    }

    // Footer
    ctx.fillStyle = "#2b2b2b";
    ctx.font = "italic 500 26px 'Caveat', cursive";
    ctx.fillText(
      "“Every bird is a mirror. This one is yours.”",
      90,
      H - 120
    );

    ctx.font = "400 16px 'Space Grotesk', sans-serif";
    ctx.fillStyle = "#2b2b2b";
    const credit = currentPhoto
      ? `photo: ${stripParens(currentPhoto.attribution)} · via iNaturalist`
      : "bird.ai";
    ctx.textAlign = "right";
    ctx.fillText(truncate(credit, 72), W - 90, H - 86);

    return await new Promise((res) => canvas.toBlob(res, "image/png", 0.95));
  }

  function drawFact(ctx, label, value, x, y, w) {
    ctx.fillStyle = "#2b2b2b";
    ctx.font = "700 14px 'Space Grotesk', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(label, x, y);
    ctx.fillStyle = "#1a1a1a";
    ctx.font = "400 20px 'Fraunces', Georgia, serif";
    const lines = wrap(ctx, value, w);
    let yy = y + 22;
    for (let i = 0; i < Math.min(lines.length, 3); i++) {
      ctx.fillText(lines[i], x, yy);
      yy += 26;
    }
  }

  function drawRadial(ctx, cx, cy, r, from, to) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, from);
    g.addColorStop(1, to);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function wrap(ctx, text, maxWidth) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = "";
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function truncate(s, n) {
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
  }
  function stripParens(s) {
    return String(s).replace(/\(c\)/gi, "©");
  }

  function loadImageForCanvas(url) {
    if (!url) return Promise.resolve(null);
    // Try the original URL first; if CORS blocks it (canvas needs the image
    // to be CORS-clean to call toBlob), fall back to a CORS-friendly proxy.
    return loadCorsImage(url).then((img) => {
      if (img) return img;
      const proxied =
        "https://images.weserv.nl/?url=" +
        encodeURIComponent(url.replace(/^https?:\/\//, ""));
      return loadCorsImage(proxied);
    });
  }

  function loadCorsImage(url) {
    return new Promise((res) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.referrerPolicy = "no-referrer";
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = url;
    });
  }

  function mix(hexA, hexB, t) {
    const a = parseHex(hexA);
    const b = parseHex(hexB);
    const r = Math.round(a[0] + (b[0] - a[0]) * t);
    const g = Math.round(a[1] + (b[1] - a[1]) * t);
    const bl = Math.round(a[2] + (b[2] - a[2]) * t);
    return (
      "#" +
      [r, g, bl].map((v) => v.toString(16).padStart(2, "0")).join("")
    );
  }
  function parseHex(hex) {
    const h = hex.replace("#", "");
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16),
    ];
  }
})();
