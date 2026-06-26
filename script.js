const statsKey = "wk-pruik-stats";
const statsDefaults = {
  pageviews: 0,
  clicks: 0,
  videoOpens: 0,
  ctaClicks: 0
};

const imageMap = {
  front: "assets/wig-main.png",
  close: "assets/thumb-close.png",
  back: "assets/thumb-back.png",
  side: "assets/thumb-side.png"
};

const modal = document.getElementById("video-modal");
const promoVideo = document.getElementById("promo-video");
const quantityEl = document.getElementById("quantity");
const mainImage = document.getElementById("main-product-image");
let reverseInterval = null;
let playbackDirection = 1;
const statTargets = {
  pageviews: document.getElementById("stat-pageviews"),
  clicks: document.getElementById("stat-clicks"),
  videoOpens: document.getElementById("stat-video-opens"),
  ctaClicks: document.getElementById("stat-cta-clicks")
};

function readStats() {
  try {
    const parsed = JSON.parse(localStorage.getItem(statsKey));
    return { ...statsDefaults, ...parsed };
  } catch {
    return { ...statsDefaults };
  }
}

function writeStats(stats) {
  localStorage.setItem(statsKey, JSON.stringify(stats));
}

function renderStats() {
  const stats = readStats();
  statTargets.pageviews.textContent = stats.pageviews;
  statTargets.clicks.textContent = stats.clicks;
  statTargets.videoOpens.textContent = stats.videoOpens;
  statTargets.ctaClicks.textContent = stats.ctaClicks;
}

function bumpStat(key, amount = 1) {
  const stats = readStats();
  stats[key] = (stats[key] || 0) + amount;
  writeStats(stats);
  renderStats();
}

function track(eventName, detail = {}) {
  if (window.dataLayer) {
    window.dataLayer.push({ event: eventName, ...detail });
  }

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, detail);
  }

  console.info("[WK-pruik tracking]", eventName, detail);
}

function clearReverseLoop() {
  if (reverseInterval) {
    window.clearInterval(reverseInterval);
    reverseInterval = null;
  }
}

function startForwardPlayback() {
  clearReverseLoop();
  playbackDirection = 1;
  promoVideo.playbackRate = 1;
  promoVideo.play().catch(() => {});
}

function startReversePlayback() {
  clearReverseLoop();
  playbackDirection = -1;
  promoVideo.pause();

  reverseInterval = window.setInterval(() => {
    const nextTime = Math.max(0, promoVideo.currentTime - 0.04);
    promoVideo.currentTime = nextTime;

    if (nextTime <= 0.04) {
      startForwardPlayback();
    }
  }, 40);
}

function openModal(source = "unknown") {
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  promoVideo.currentTime = 0;
  startForwardPlayback();
  bumpStat("videoOpens");
  track("video_open", { source });
}

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  clearReverseLoop();
  promoVideo.pause();
  promoVideo.currentTime = 0;
}

document.addEventListener("DOMContentLoaded", () => {
  const initialStats = readStats();
  initialStats.pageviews += 1;
  writeStats(initialStats);
  renderStats();
  track("page_view", { page_title: document.title });

  document.querySelectorAll(".adsbygoogle").forEach((adElement) => {
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch (error) {
      console.warn("Adsense kon niet initialiseren", error, adElement);
    }
  });

  document.querySelectorAll("[data-image]").forEach((button) => {
    button.addEventListener("click", () => {
      const imageKey = button.dataset.image;
      mainImage.src = imageMap[imageKey];
      document.querySelectorAll(".thumb").forEach((thumb) => thumb.classList.remove("is-active"));
      button.classList.add("is-active");
      bumpStat("clicks");
      track("gallery_select", { image: imageKey });
    });
  });

  document.querySelectorAll("[data-video-trigger]").forEach((element) => {
    element.addEventListener("click", () => {
      bumpStat("clicks");
      const name = element.dataset.track || "generic_click";
      track("element_click", { target: name });
      openModal(name);

      if (name.startsWith("cta-")) {
        bumpStat("ctaClicks");
      }
    });
  });

  document.querySelectorAll("[data-quantity]").forEach((button) => {
    button.addEventListener("click", () => {
      const current = Number(quantityEl.textContent);
      const next = Math.max(1, current + Number(button.dataset.quantity));
      quantityEl.textContent = String(next);
      bumpStat("clicks");
      track("quantity_change", { value: next });
    });
  });

  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });

  promoVideo.addEventListener("timeupdate", () => {
    if (playbackDirection === 1 && promoVideo.duration && promoVideo.currentTime >= promoVideo.duration - 0.08) {
      startReversePlayback();
    }
  });

  document.getElementById("reset-stats").addEventListener("click", () => {
    writeStats({ ...statsDefaults });
    renderStats();
    track("stats_reset");
  });
});
