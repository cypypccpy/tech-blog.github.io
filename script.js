const tocRoot = document.getElementById("toc");
const sections = Array.from(document.querySelectorAll("[data-toc]"));
const modal = document.getElementById("video-modal");
const modalTitle = document.getElementById("video-modal-title");
const modalPlayer = document.getElementById("video-modal-player");
const openButtons = Array.from(document.querySelectorAll(".js-open-video"));
const langButtons = Array.from(document.querySelectorAll(".js-lang-toggle"));
const langPanels = Array.from(document.querySelectorAll(".lang-panel"));

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
wireVideos();
wireLanguageToggle();
primeVideoCards();

window.addEventListener("scroll", updateActiveToc, { passive: true });
