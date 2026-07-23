const menuToggle = document.querySelector("#menu-toggle");
const siteNav = document.querySelector("#site-nav");
const siteHeader = document.querySelector(".site-header");

function closeMobileMenu() {
  if (!menuToggle || !siteNav) return;

  menuToggle.setAttribute("aria-expanded", "false");
  siteNav.classList.remove("open");
}

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";

    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    siteNav.classList.toggle("open", !isOpen);
  });

  siteNav.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMobileMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 720) closeMobileMenu();
  });
}

if (siteHeader) {
  const updateHeaderState = () => {
    siteHeader.classList.toggle("scrolled", window.scrollY > 12);
  };

  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });
}

function addSentenceLink() {
  if (!siteNav) return;

  const isInsidePages = window.location.pathname.includes("/pages/");
  const sentencesHref = isInsidePages ? "sentences.html" : "pages/sentences.html";
  const existingSentenceLink = [...siteNav.querySelectorAll("a")].find((link) => {
    const href = link.getAttribute("href") || "";
    return href.endsWith("sentences.html");
  });

  if (existingSentenceLink) return;

  const sentenceLink = document.createElement("a");
  sentenceLink.href = sentencesHref;
  sentenceLink.textContent = "Sentences";

  const howItWorksLink = [...siteNav.querySelectorAll("a")].find((link) => {
    const href = link.getAttribute("href") || "";
    return href.endsWith("how-it-works.html");
  });

  siteNav.insertBefore(sentenceLink, howItWorksLink || siteNav.querySelector(".play-link") || null);
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existingScript = [...document.scripts].find((script) => script.src === src);

    if (existingScript) {
      if (src.includes("supabase-js") && window.supabase) {
        resolve();
        return;
      }

      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function ensureSupabaseClient() {
  if (window.supabaseClient) return window.supabaseClient;

  if (!window.supabase) {
    await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
  }

  const isInsidePages = window.location.pathname.includes("/pages/");
  const configPath = isInsidePages ? "../assets/js/supabase.js" : "assets/js/supabase.js";
  await loadScript(new URL(configPath, window.location.href).href);

  return window.supabaseClient;
}

async function addAccountLink() {
  if (!siteNav) return;

  const isInsidePages = window.location.pathname.includes("/pages/");
  const loginHref = isInsidePages ? "login.html" : "pages/login.html";
  const profileHref = isInsidePages ? "profile.html" : "pages/profile.html";
  const existingAccountLink = [...siteNav.querySelectorAll("a")].find((link) => {
    const href = link.getAttribute("href") || "";
    return href.endsWith("login.html") || href.endsWith("profile.html");
  });
  const accountLink = existingAccountLink || document.createElement("a");

  accountLink.dataset.accountLink = "true";
  accountLink.href = loginHref;
  accountLink.textContent = "Login";

  if (!existingAccountLink) {
    const playLink = siteNav.querySelector(".play-link");
    siteNav.insertBefore(accountLink, playLink || null);
  }

  try {
    const client = await ensureSupabaseClient();
    const { data, error } = await client.auth.getSession();

    if (error) throw error;

    if (data.session?.user) {
      accountLink.href = profileHref;
      accountLink.textContent = "Profile";
    }
  } catch (error) {
    console.error("Account link could not be updated:", error);
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    const isInsidePages = window.location.pathname.includes("/pages/");
    const appRoot = new URL(isInsidePages ? "../" : "./", window.location.href);
    const serviceWorkerUrl = new URL("service-worker.js", appRoot);

    try {
      await navigator.serviceWorker.register(serviceWorkerUrl.href, {
        scope: appRoot.pathname
      });
    } catch (error) {
      console.error("Service worker could not be registered:", error);
    }
  });
}

addSentenceLink();
addAccountLink();
registerServiceWorker();
