const API_BASE = "https://web-project-server-xu4m.onrender.com/api";

const form = document.getElementById("signupForm");
const errorMsg = document.getElementById("errorMsg");
const successMsg = document.getElementById("successMsg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirm = document.getElementById("confirm").value;


  errorMsg.classList.remove("show");
  successMsg.classList.remove("show");

 
  if (!name || !email || !password || !confirm) {
    errorMsg.textContent = "Please fill in all fields.";
    errorMsg.classList.add("show");
    return;
  }

  if (password.length < 6) {
    errorMsg.textContent = "Password must be at least 6 characters.";
    errorMsg.classList.add("show");
    return;
  }

  if (password !== confirm) {
    errorMsg.textContent = "Passwords do not match.";
    errorMsg.classList.add("show");
    return;
  }

  try {
    const res = await fetch(API_BASE + "/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name,
        email: email,
        password: password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Signup failed");
    }

    // Show success message
    successMsg.textContent = "Account created — redirecting to log in...";
    successMsg.classList.add("show");

    // Clear form
    form.reset();
    // Redirect to login
    setTimeout(() => {
      window.location.href = "login.html";
    }, 1000);
  } catch (err) {
    errorMsg.textContent = err.message;
    errorMsg.classList.add("show");
    successMsg.classList.remove("show");
  }
});
