(() => {
  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  const themeToggle = document.querySelector("[data-theme-toggle]");
  const year = document.querySelector("[data-year]");
  const loadMoreBtn = document.querySelector("[data-load-more]");
  const loadMoreWrap = document.querySelector("[data-load-more-wrap]");
  const projectItems = [...document.querySelectorAll("[data-project-item]")];
  const countEl = document.querySelector("[data-count]");
  const INITIAL_PROJECTS = 6;

  if (year) year.textContent = String(new Date().getFullYear());

  const getTheme = () =>
    document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";

  const setTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#f4f7fb" : "#0a0c10");
    if (themeToggle) {
      themeToggle.setAttribute(
        "aria-label",
        theme === "light" ? "Switch to dark mode" : "Switch to light mode"
      );
    }
  };

  if (themeToggle) {
    setTheme(getTheme());
    themeToggle.addEventListener("click", () => {
      setTheme(getTheme() === "light" ? "dark" : "light");
    });
  }

  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        toggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
      });
    });
  }

  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  const setLoadMoreVisibility = (visible) => {
    if (loadMoreBtn) {
      loadMoreBtn.hidden = !visible;
      loadMoreBtn.style.display = visible ? "" : "none";
    }
    if (loadMoreWrap) {
      loadMoreWrap.hidden = !visible;
      loadMoreWrap.style.display = visible ? "" : "none";
    }
  };

  setLoadMoreVisibility(false);

  if (projectItems.length > INITIAL_PROJECTS && loadMoreBtn) {
    projectItems.forEach((item, i) => {
      const show = i < INITIAL_PROJECTS;
      item.hidden = !show;
      item.classList.toggle("is-hidden", !show);
    });
    setLoadMoreVisibility(true);

    loadMoreBtn.addEventListener("click", () => {
      projectItems.forEach((item) => {
        item.hidden = false;
        item.classList.remove("is-hidden");
        item.classList.add("is-visible");
      });
      setLoadMoreVisibility(false);
    });
  } else {
    projectItems.forEach((item) => {
      item.hidden = false;
      item.classList.remove("is-hidden");
    });
    setLoadMoreVisibility(false);
  }

  if (countEl) {
    const target = Number(countEl.getAttribute("data-count") || "9");
    const animate = () => {
      const start = performance.now();
      const duration = 1100;
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        countEl.textContent = String(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if ("IntersectionObserver" in window) {
      const cio = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            animate();
            cio.disconnect();
          });
        },
        { threshold: 0.4 }
      );
      cio.observe(countEl);
    } else {
      animate();
    }
  }

  const formatInstalls = (n) => {
    const value = Number(n) || 0;
    if (value >= 1000000) return `${Math.floor(value / 1000000)}M+`;
    if (value >= 1000) return `${Math.floor(value / 1000)}k+`;
    if (value >= 100) return `${Math.floor(value / 10) * 10}+`;
    if (value > 0) return `${value}+`;
    return "0+";
  };

  const fetchActiveInstalls = async (type, slug) => {
    const base =
      type === "theme"
        ? "https://api.wordpress.org/themes/info/1.2/?action=theme_information"
        : "https://api.wordpress.org/plugins/info/1.2/?action=plugin_information";
    const endpoint = `${base}&request[slug]=${encodeURIComponent(slug)}&request[fields][sections]=false&request[fields][description]=false&request[fields][active_installs]=1`;

    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`WP.org ${type} lookup failed`);
    const data = await res.json();
    return data && typeof data.active_installs !== "undefined"
      ? data.active_installs
      : null;
  };

  document.querySelectorAll("[data-active-installs]").forEach(async (el) => {
    const raw = el.getAttribute("data-active-installs") || "";
    const [type, slug] = raw.split(":");
    if (!type || !slug) return;

    try {
      const installs = await fetchActiveInstalls(type, slug);
      if (installs === null) throw new Error("missing installs");
      el.textContent = formatInstalls(installs);
    } catch {
      const fallbacks = {
        "plugin:sm-easy-duplicator": "100+",
        "plugin:comments-tinymce": "80+",
        "plugin:gift-pack-for-woocommerce": "200+",
        "theme:bloggerwp": "50+",
      };
      el.textContent = fallbacks[raw] || "—";
    }
  });

  document.querySelectorAll(".medal").forEach((medal) => {
    const name = medal.querySelector(".mn")?.textContent?.trim() || "";
    const year = medal.querySelector(".myear")?.textContent?.trim() || "";
    const tip = year ? `${name} · ${year}` : name;
    if (!tip) return;
    medal.setAttribute("data-tip", tip);
    medal.setAttribute("tabindex", "0");
    medal.setAttribute("aria-label", tip);
  });
})();
