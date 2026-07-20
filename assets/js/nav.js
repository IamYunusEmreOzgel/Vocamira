const menuToggle = document.querySelector("#menu-toggle");
const siteNav = document.querySelector("#site-nav");

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";

    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    siteNav.classList.toggle("open", !isOpen);
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menuToggle.setAttribute("aria-expanded", "false");
      siteNav.classList.remove("open");
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 720) {
      menuToggle.setAttribute("aria-expanded", "false");
      siteNav.classList.remove("open");
    }
  });
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
  if (window.supabaseClient) {
    return window.supabaseClient;
  }

  if (!window.supabase) {
    await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
  }

  const isInsidePages = window.location.pathname.includes("/Pages/");
  const configPath = isInsidePages ? "../assets/js/supabase.js" : "assets/js/supabase.js";
  await loadScript(new URL(configPath, window.location.href).href);

  return window.supabaseClient;
}

async function addAccountLink() {
  if (!siteNav || siteNav.querySelector("[data-account-link]")) {
    return;
  }

  const isInsidePages = window.location.pathname.includes("/Pages/");
  const loginHref = isInsidePages ? "login.html" : "Pages/login.html";
  const profileHref = isInsidePages ? "profile.html" : "Pages/profile.html";
  const accountLink = document.createElement("a");

  accountLink.dataset.accountLink = "true";
  accountLink.href = loginHref;
  accountLink.textContent = "Login";
  siteNav.appendChild(accountLink);

  try {
    const client = await ensureSupabaseClient();
    const { data, error } = await client.auth.getSession();

    if (error) {
      throw error;
    }

    if (data.session?.user) {
      accountLink.href = profileHref;
      accountLink.textContent = "Profile";
    }
  } catch (error) {
    console.error("Account link could not be updated:", error);
  }

  accountLink.addEventListener("click", () => {
    if (menuToggle) {
      menuToggle.setAttribute("aria-expanded", "false");
    }
    siteNav.classList.remove("open");
  });
}

addAccountLink();
