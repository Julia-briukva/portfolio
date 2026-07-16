(() => {
  const navLinks = [...document.querySelectorAll(".page-nav__link")];
  // Anchor ids are authored in HTML and must stay stable across visual changes.
  const navItems = navLinks
    .map((link) => ({
      link,
      section: document.querySelector(link.getAttribute("href")),
    }))
    .filter((item) => item.section);

  const getNavOffset = () => {
    const nav = document.querySelector(".page-nav");
    return nav ? nav.offsetHeight + 24 : 24;
  };

  const applyActiveNav = (activeItem) => {
    navItems.forEach((item) => {
      item.link.classList.toggle("page-nav__link--active", item === activeItem);
    });
  };

  const setActiveNav = () => {
    if (!navItems.length) return;

    const marker = getNavOffset() + 1;
    const isPageBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    const active = isPageBottom
      ? navItems[navItems.length - 1]
      : navItems.reduce((current, item) => {
          const sectionTop = item.section.getBoundingClientRect().top;
          return sectionTop <= marker ? item : current;
        }, navItems[0]);

    applyActiveNav(active);
  };

  let navFrame = null;
  const requestActiveNavUpdate = () => {
    if (navFrame) return;

    navFrame = requestAnimationFrame(() => {
      navFrame = null;
      setActiveNav();
    });
  };

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;

      event.preventDefault();
      const targetTop = target.getBoundingClientRect().top + window.scrollY - getNavOffset();
      window.scrollTo({ top: targetTop, behavior: "smooth" });
      applyActiveNav(navItems.find((item) => item.section === target) || navItems[0]);
    });
  });

  setActiveNav();
  window.addEventListener("scroll", requestActiveNavUpdate, { passive: true });
  window.addEventListener("resize", setActiveNav);
  window.addEventListener("load", setActiveNav);

  const projectCards = [...document.querySelectorAll(".projects .project-card")];

  projectCards.forEach((card) => {
    const link = card.querySelector(".project-card__link");
    if (!link) return;

    card.setAttribute("role", "link");
    card.setAttribute("tabindex", "0");

    card.addEventListener("click", (event) => {
      if (event.target.closest("a")) return;

      link.click();
    });

    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;

      event.preventDefault();
      link.click();
    });
  });

  const caseImageWrappers = [
    ...document.querySelectorAll(".case-figure .image-wrapper, #design-system .system-item__figure"),
  ];

  if (!caseImageWrappers.length) return;

  const getImageSource = (image) => {
    if (!image) return "";

    return (image.currentSrc || image.src || image.getAttribute("src") || "").split(/[?#]/)[0];
  };

  const getSequenceKey = (image) => {
    const source = getImageSource(image);
    const fileName = source.split("/").pop();
    const match = fileName && fileName.match(/^(.+?)[-_]?(\d+)(\.[^.]+)$/);

    if (!match) return null;

    const directory = source.slice(0, source.length - fileName.length);
    return {
      key: `${directory}${match[1]}${match[3]}`,
      order: Number(match[2]),
    };
  };

  const imageItems = caseImageWrappers
    .map((wrapper) => {
      const image = wrapper.querySelector("img");
      const sequence = getSequenceKey(image);

      return { wrapper, image, sequence };
    })
    .filter((item) => item.image);

  const sequenceMap = new Map();

  imageItems.forEach((item) => {
    if (!item.sequence) return;

    if (!sequenceMap.has(item.sequence.key)) sequenceMap.set(item.sequence.key, []);
    sequenceMap.get(item.sequence.key).push(item);
  });

  sequenceMap.forEach((items, key) => {
    const orderedItems = items
      .sort((a, b) => a.sequence.order - b.sequence.order)
      .filter((item, index, list) => index === 0 || item.sequence.order !== list[index - 1].sequence.order);

    if (orderedItems.length > 1) {
      sequenceMap.set(key, orderedItems);
    } else {
      sequenceMap.delete(key);
    }
  });

  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.hidden = true;
  lightbox.setAttribute("role", "dialog");
  lightbox.setAttribute("aria-modal", "true");

  const backdrop = document.createElement("button");
  backdrop.className = "lightbox__backdrop";
  backdrop.type = "button";
  backdrop.setAttribute("aria-label", "Закрыть увеличенное изображение");

  const content = document.createElement("div");
  content.className = "lightbox__content";

  const closeButton = document.createElement("button");
  closeButton.className = "lightbox__close";
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Закрыть увеличенное изображение");
  closeButton.textContent = "×";

  content.append(closeButton);
  lightbox.append(backdrop, content);
  document.body.append(lightbox);

  let activeTrigger = null;
  let activeGallery = null;
  let activeGalleryIndex = 0;

  const clearContent = () => {
    [...content.children].forEach((child) => {
      if (child !== closeButton) child.remove();
    });
  };

  const closeLightbox = () => {
    lightbox.hidden = true;
    document.body.classList.remove("is-lightbox-open");
    clearContent();

    if (activeTrigger) activeTrigger.focus();
    activeTrigger = null;
    activeGallery = null;
    activeGalleryIndex = 0;
  };

  const renderLightboxImage = (image) => {
    clearContent();

    const enlargedImage = document.createElement("img");
    enlargedImage.className = "lightbox__image";
    enlargedImage.src = image.currentSrc || image.src;
    enlargedImage.alt = image.alt || "";
    content.prepend(enlargedImage);
  };

  const showGalleryImage = (index) => {
    if (!activeGallery) return;

    activeGalleryIndex = (index + activeGallery.length) % activeGallery.length;
    const currentItem = activeGallery[activeGalleryIndex];

    clearContent();

    const enlargedImage = document.createElement("img");
    enlargedImage.className = "lightbox__image";
    enlargedImage.src = currentItem.image.currentSrc || currentItem.image.src;
    enlargedImage.alt = currentItem.image.alt || "";

    const previousButton = document.createElement("button");
    previousButton.className = "lightbox__nav lightbox__nav--prev";
    previousButton.type = "button";
    previousButton.setAttribute("aria-label", "Предыдущий экран");
    previousButton.textContent = "←";

    const nextButton = document.createElement("button");
    nextButton.className = "lightbox__nav lightbox__nav--next";
    nextButton.type = "button";
    nextButton.setAttribute("aria-label", "Следующий экран");
    nextButton.textContent = "→";

    const counter = document.createElement("p");
    counter.className = "caption lightbox__counter";
    counter.textContent = `${activeGalleryIndex + 1} / ${activeGallery.length}`;

    previousButton.addEventListener("click", () => showGalleryImage(activeGalleryIndex - 1));
    nextButton.addEventListener("click", () => showGalleryImage(activeGalleryIndex + 1));

    content.prepend(enlargedImage, previousButton, nextButton, counter);
  };

  const openLightbox = (trigger, image) => {
    activeTrigger = trigger;
    activeGallery = null;
    activeGalleryIndex = 0;

    if (image) {
      const imageItem = imageItems.find((item) => item.image === image);
      const gallery = imageItem?.sequence ? sequenceMap.get(imageItem.sequence.key) : null;

      if (gallery) {
        activeGallery = gallery;
        showGalleryImage(gallery.findIndex((item) => item.image === image));
      } else {
        renderLightboxImage(image);
      }
    } else {
      clearContent();
      const scheme = trigger.cloneNode(true);
      scheme.classList.add("lightbox__scheme");
      scheme.removeAttribute("tabindex");
      scheme.removeAttribute("role");
      scheme.removeAttribute("aria-label");
      content.prepend(scheme);
    }

    lightbox.hidden = false;
    document.body.classList.add("is-lightbox-open");
    closeButton.focus();
  };

  caseImageWrappers.forEach((wrapper) => {
    wrapper.classList.add("image-wrapper--zoomable");
    wrapper.setAttribute("tabindex", "0");
    wrapper.setAttribute("role", "button");
    wrapper.setAttribute("aria-label", "Открыть изображение в увеличенном виде");

    wrapper.addEventListener("click", (event) => {
      openLightbox(wrapper, event.target.closest("img"));
    });

    wrapper.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;

      event.preventDefault();
      openLightbox(wrapper, wrapper.querySelector("img"));
    });
  });

  backdrop.addEventListener("click", closeLightbox);
  closeButton.addEventListener("click", closeLightbox);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !lightbox.hidden) closeLightbox();
    if (event.key === "ArrowLeft" && activeGallery && !lightbox.hidden) {
      event.preventDefault();
      showGalleryImage(activeGalleryIndex - 1);
    }
    if (event.key === "ArrowRight" && activeGallery && !lightbox.hidden) {
      event.preventDefault();
      showGalleryImage(activeGalleryIndex + 1);
    }
  });
})();
