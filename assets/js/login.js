const loginForm = document.getElementById("login-form");
const loginButton = document.getElementById("login-button");
const loginMessage = document.getElementById("login-message");

async function redirectAuthenticatedUser() {
  try {
    const { data, error } = await supabaseClient.auth.getSession();

    if (error) {
      console.error("Session check failed:", error);
      return;
    }

    if (data.session) {
      window.location.replace("profile.html");
    }
  } catch (error) {
    console.error("Session check failed:", error);
  }
}

function showLoginMessage(message, type = "error") {
  loginMessage.textContent = message;
  loginMessage.className = `auth-message ${type}`;
}

function getLoginErrorMessage(error) {
  if (!navigator.onLine) {
    return "You appear to be offline. Check your internet connection and try again.";
  }

  const message = String(error?.message || "").toLowerCase();
  const isConnectionError =
    error?.status >= 500 ||
    message.includes("fetch") ||
    message.includes("network") ||
    message.includes("connection");

  return isConnectionError
    ? "The login service could not be reached. Please try again shortly."
    : "Email or password is incorrect.";
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  loginButton.disabled = true;
  loginButton.textContent = "Signing in...";
  showLoginMessage("");

  try {
    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      showLoginMessage(getLoginErrorMessage(error));
      return;
    }

    showLoginMessage("Login successful. Redirecting...", "success");
    window.location.replace("profile.html");
  } catch (error) {
    console.error("Login failed:", error);
    showLoginMessage(getLoginErrorMessage(error));
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "Sign In";
  }
});

redirectAuthenticatedUser();