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
  if (statTargets.pageviews) {
    statTargets.pageviews.textContent = stats.pageviews;
  }
  if (statTargets.clicks) {
    statTargets.clicks.textContent = stats.clicks;
  }
  if (statTargets.videoOpens) {
    statTargets.videoOpens.textContent = stats.videoOpens;
  }
  if (statTargets.ctaClicks) {
    statTargets.ctaClicks.textContent = stats.ctaClicks;
  }
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

  if (window.goatcounter && typeof window.goatcounter.count === "function") {
    window.goatcounter.count({
      path: location.pathname,
      event: true,
      title: `${eventName}:${detail.target || detail.image || detail.source || "site"}`
    });
  }

  console.info("[WK-pruik tracking]", eventName, detail);
}

function openModal(source = "unknown") {
  if (!modal || !promoVideo) {
    return;
  }

  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  promoVideo.currentTime = 0;
  promoVideo.play().catch(() => {});
  bumpStat("videoOpens");
  track("video_open", { source });
}

function closeModal() {
  if (!modal || !promoVideo) {
    return;
  }

  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
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

  document.addEventListener("click", (event) => {
    const quantityButton = event.target.closest("[data-quantity]");
    if (quantityButton) {
      event.preventDefault();
      event.stopPropagation();

      if (!quantityEl) {
        return;
      }

      const current = Number(quantityEl.textContent);
      const next = Math.max(1, current + Number(quantityButton.dataset.quantity));
      quantityEl.textContent = String(next);
      bumpStat("clicks");
      track("quantity_change", { value: next });
      return;
    }

    const closeButton = event.target.closest("[data-close-modal]");
    if (closeButton) {
      event.preventDefault();
      closeModal();
      return;
    }

    const trigger = event.target.closest("[data-video-trigger]");
    if (!trigger) {
      return;
    }

    event.preventDefault();

    const imageKey = trigger.dataset.image;
    if (imageKey) {
      if (mainImage && imageMap[imageKey]) {
        mainImage.src = imageMap[imageKey];
      }

      document.querySelectorAll(".thumb").forEach((thumb) => thumb.classList.remove("is-active"));
      trigger.classList.add("is-active");
      track("gallery_select", { image: imageKey });
    }

    bumpStat("clicks");
    const name = trigger.dataset.track || "generic_click";
    track("element_click", { target: name });

    if (name.startsWith("cta-")) {
      bumpStat("ctaClicks");
    }

    openModal(name);
  });

  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });

  const resetStatsButton = document.getElementById("reset-stats");
  if (resetStatsButton) {
    resetStatsButton.addEventListener("click", () => {
      writeStats({ ...statsDefaults });
      renderStats();
      track("stats_reset");
    });
  }
});
