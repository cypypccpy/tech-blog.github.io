const tocRoot = document.getElementById("toc");
const sections = Array.from(document.querySelectorAll("[data-toc]"));
const modal = document.getElementById("video-modal");
const modalTitle = document.getElementById("video-modal-title");
const modalPlayer = document.getElementById("video-modal-player");
const langButtons = Array.from(document.querySelectorAll(".js-lang-toggle"));
const langPanels = Array.from(document.querySelectorAll(".lang-panel"));
const transferCarousels = Array.from(document.querySelectorAll("[data-transfer-carousel]"));

let activeTransferCarousel = null;

function buildToc() {
  if (!tocRoot) return;

  sections.forEach((section) => {
    const id = section.id;
    const label = section.dataset.toc;
    if (!id || !label) return;

    const link = document.createElement("a");
    link.href = `#${id}`;
    link.textContent = label;
    tocRoot.appendChild(link);
  });
}

function updateActiveToc() {
  const links = Array.from(tocRoot.querySelectorAll("a"));
  if (!links.length) return;

  let currentId = sections[0]?.id;
  const threshold = window.innerHeight * 0.24;

  sections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= threshold) {
      currentId = section.id;
    }
  });

  links.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === `#${currentId}`);
  });
}

function openVideo(src, title) {
  if (!src || !modal || !modalPlayer) return;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  modalTitle.textContent = title || "Demo Video";
  modalPlayer.src = src;
  modalPlayer.play().catch(() => {});
}

function closeVideo() {
  if (!modal || !modalPlayer) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  modalPlayer.pause();
  modalPlayer.removeAttribute("src");
  modalPlayer.load();
}

function wireVideos() {
  const openButtons = Array.from(document.querySelectorAll(".js-open-video"));

  openButtons.forEach((button) => {
    button.addEventListener("click", () => {
      openVideo(button.dataset.videoSrc, button.dataset.videoTitle);
    });
  });

  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", closeVideo);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeVideo();
    }
  });
}

function isVisible(element) {
  return Boolean(element && (element.offsetWidth || element.offsetHeight || element.getClientRects().length));
}

function syncCarouselVideo(video, shouldPlay) {
  if (!video) return;

  if (shouldPlay) {
    video.play().catch(() => {});
    return;
  }

  video.pause();
  video.currentTime = 0;
}

function buildTransferCarousel(carousel) {
  const base = carousel.dataset.videoBase;
  const count = Number(carousel.dataset.videoCount || 0);

  if (!base || !Number.isFinite(count) || count <= 0) {
    return;
  }

  const viewport = document.createElement("div");
  viewport.className = "transfer-carousel-viewport";

  const track = document.createElement("div");
  track.className = "transfer-carousel-track";

  const slides = [];

  for (let index = 1; index <= count; index += 1) {
    const slide = document.createElement("figure");
    slide.className = "transfer-slide";

    const video = document.createElement("video");
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "metadata";

    const source = document.createElement("source");
    source.src = `${base}/${index}.mp4`;
    source.type = "video/mp4";

    video.appendChild(source);
    slide.appendChild(video);
    track.appendChild(slide);
    slides.push(slide);
  }

  viewport.appendChild(track);

  const controls = document.createElement("div");
  controls.className = "transfer-carousel-controls";

  const prev = document.createElement("button");
  prev.className = "transfer-carousel-arrow";
  prev.type = "button";
  prev.setAttribute("aria-label", "Previous transfer video");
  prev.innerHTML = "<span>&larr;</span>";

  const status = document.createElement("div");
  status.className = "transfer-carousel-status";

  const next = document.createElement("button");
  next.className = "transfer-carousel-arrow";
  next.type = "button";
  next.setAttribute("aria-label", "Next transfer video");
  next.innerHTML = "<span>&rarr;</span>";

  controls.append(prev, status, next);
  carousel.append(viewport, controls);

  let currentIndex = 0;

  const applyAspectRatio = (video) => {
    if (!video || !video.videoWidth || !video.videoHeight) return;
    viewport.style.setProperty("--transfer-aspect", `${video.videoWidth} / ${video.videoHeight}`);
  };

  const refreshPlayback = () => {
    slides.forEach((slide, slideIndex) => {
      const video = slide.querySelector("video");
      const isCurrent = slideIndex === currentIndex && isVisible(carousel);

      if (isCurrent) {
        applyAspectRatio(video);
      }

      syncCarouselVideo(video, isCurrent);
    });
  };

  const setIndex = (nextIndex) => {
    if (!slides.length) return;

    if (nextIndex < 0) {
      currentIndex = slides.length - 1;
    } else if (nextIndex >= slides.length) {
      currentIndex = 0;
    } else {
      currentIndex = nextIndex;
    }

    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    status.textContent = `${currentIndex + 1} / ${slides.length}`;
    refreshPlayback();
  };

  carousel.__transferSetIndex = setIndex;
  carousel.__transferGetIndex = () => currentIndex;
  carousel.__transferRefresh = refreshPlayback;

  prev.addEventListener("click", () => {
    activeTransferCarousel = carousel;
    setIndex(currentIndex - 1);
  });

  next.addEventListener("click", () => {
    activeTransferCarousel = carousel;
    setIndex(currentIndex + 1);
  });

  ["mouseenter", "focusin", "click"].forEach((eventName) => {
    carousel.addEventListener(eventName, () => {
      activeTransferCarousel = carousel;
    });
  });

  slides.forEach((slide) => {
    const video = slide.querySelector("video");
    if (!video) return;

    video.addEventListener("loadedmetadata", () => {
      if (slide === slides[currentIndex]) {
        applyAspectRatio(video);
      }
    });
  });

  setIndex(0);
}

function wireTransferCarouselKeyboard() {
  if (!transferCarousels.length) return;

  document.addEventListener("keydown", (event) => {
    if (modal && modal.classList.contains("is-open")) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    const target = event.target;
    if (
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT")
    ) {
      return;
    }

    const carousel =
      (activeTransferCarousel && isVisible(activeTransferCarousel) && activeTransferCarousel) ||
      transferCarousels.find((candidate) => isVisible(candidate));

    if (!carousel || typeof carousel.__transferSetIndex !== "function") return;

    event.preventDefault();
    const delta = event.key === "ArrowLeft" ? -1 : 1;
    carousel.__transferSetIndex(carousel.__transferGetIndex() + delta);
    carousel.focus();
  });
}

function syncVisibleTransferCarousels() {
  transferCarousels.forEach((carousel) => {
    if (typeof carousel.__transferRefresh === "function") {
      carousel.__transferRefresh();
    }
  });
}

function initTransferCarousels() {
  transferCarousels.forEach((carousel, index) => {
    buildTransferCarousel(carousel);
    if (index === 0) {
      activeTransferCarousel = carousel;
    }
  });

  wireTransferCarouselKeyboard();
  syncVisibleTransferCarousels();
}

function setLanguage(lang) {
  langPanels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.lang === lang);
  });

  langButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.targetLang === lang);
    button.setAttribute(
      "aria-pressed",
      button.dataset.targetLang === lang ? "true" : "false"
    );
  });

  window.localStorage.setItem("website_lang", lang);
  syncVisibleTransferCarousels();
}

function wireLanguageToggle() {
  if (!langButtons.length) return;

  const storedLang = window.localStorage.getItem("website_lang");
  const initialLang = storedLang || "zh";
  setLanguage(initialLang);

  langButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setLanguage(button.dataset.targetLang);
    });
  });
}

function primeVideoCards() {
  document.querySelectorAll(".video-card video, .featured-player video").forEach((video) => {
    video.addEventListener("mouseenter", () => video.play().catch(() => {}));
    video.addEventListener("mouseleave", () => {
      video.pause();
      video.currentTime = 0;
    });
  });
}

buildToc();
updateActiveToc();
initTransferCarousels();
wireVideos();
wireLanguageToggle();
primeVideoCards();

window.addEventListener("scroll", updateActiveToc, { passive: true });
