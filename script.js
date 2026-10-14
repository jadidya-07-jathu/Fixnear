
// FixNear - Complete Frontend JavaScript

document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  const KEYS = {
    theme: "fixnear_theme_v2",
    user: "fixnear_user_v2",
    role: "fixnear_role_v2",
    ratings: "fixnear_ratings_v2",
    attendance: "fixnear_attendance_v2",
    requests: "fixnear_requests_v2"
  };

  function readStore(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeStore(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function showToast(message) {
    const toast = $("toast");
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }

  // ---------------- SHOP DATA ----------------

  const shops = [
    {
      id: 1,
      name: "Sri Lakshmi Electrical Works",
      category: "Electrician",
      rating: 4.8,
      reviews: 120,
      phone: "9876543210",
      lat: 17.0005,
      lng: 81.8040,
      active: true
    },
    {
      id: 2,
      name: "Raju Plumbing Services",
      category: "Plumber",
      rating: 4.6,
      reviews: 85,
      phone: "9876543211",
      lat: 17.0050,
      lng: 81.7900,
      active: false
    },
    {
      id: 3,
      name: "Smart Mobile Repair",
      category: "Mobile Repair",
      rating: 4.9,
      reviews: 150,
      phone: "9876543212",
      lat: 16.9980,
      lng: 81.7850,
      active: true
    },
    {
      id: 4,
      name: "Quick Home Cleaning",
      category: "Cleaning",
      rating: 4.5,
      reviews: 65,
      phone: "9876543213",
      lat: 17.0100,
      lng: 81.8000,
      active: false
    }
  ];

  // These are demo shops and sample locations.
  const attendance = readStore(KEYS.attendance, {});
  const ratings = readStore(KEYS.ratings, {});

  function refreshShopData() {
    shops.forEach((shop) => {
      if (Array.isArray(ratings[shop.id]) && ratings[shop.id].length) {
        const scores = ratings[shop.id];
        shop.rating = (
          scores.reduce((sum, score) => sum + score, 0) / scores.length
        ).toFixed(1);
        shop.reviews = shop.baseReviews + scores.length;
      }
      if (Object.prototype.hasOwnProperty.call(attendance, shop.id)) {
        shop.active = Boolean(attendance[shop.id]);
      }
    });
  }

  shops.forEach((shop) => {
    shop.baseReviews = shop.reviews;
  });

  refreshShopData();

  // ---------------- THEME ----------------

  const themeToggle = $("themeToggle");

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(KEYS.theme, theme);

    if (themeToggle) {
      themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
      themeToggle.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      );
    }
  }

  setTheme(localStorage.getItem(KEYS.theme) || "light");

  themeToggle?.addEventListener("click", () => {
    const current =
      document.documentElement.getAttribute("data-theme");
    setTheme(current === "dark" ? "light" : "dark");
  });

  // ---------------- MOBILE NAVIGATION ----------------

  const navigation = $("navigation");
  const menuToggle = $("menuToggle");

  menuToggle?.addEventListener("click", () => {
    const open = navigation.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.textContent = open ? "✕" : "☰";
  });

  navigation?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navigation.classList.remove("open");
      menuToggle.textContent = "☰";
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });

  // Highlight the currently selected navigation link.
  navigation?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navigation.querySelectorAll("a").forEach((item) => {
        item.classList.remove("active");
      });
      link.classList.add("active");
    });
  });

  // ---------------- LOGIN AND LOGOUT ----------------

  const loginModal = $("loginModal");
  const loginBtn = $("loginBtn");
  const logoutBtn = $("logoutBtn");
  const loginForm = $("loginForm");

  function getRole() {
    return localStorage.getItem(KEYS.role) || "";
  }

  function getUser() {
    return localStorage.getItem(KEYS.user) || "";
  }

  function openLogin() {
    loginModal?.classList.remove("hidden");
    $("loginName").focus();
  }

  function closeLogin() {
    loginModal?.classList.add("hidden");
  }

  loginBtn?.addEventListener("click", openLogin);
  $("closeModal")?.addEventListener("click", closeLogin);

  loginModal?.addEventListener("click", (event) => {
    if (event.target === loginModal) closeLogin();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLogin();
  });

  function updateAccountUI() {
    const role = getRole();
    const name = getUser();

    if (role && name) {
      loginBtn.textContent = name;
      loginBtn.title = `Logged in as ${role}`;
      logoutBtn?.classList.remove("hidden");
    } else {
      loginBtn.textContent = "Login";
      loginBtn.title = "Login";
      logoutBtn?.classList.add("hidden");
    }

    $("workerDashboard")?.classList.toggle("hidden", role !== "worker");

    if (role === "worker") {
      populateWorkerShopOptions();
      updateWorkerDashboard();
    }

    if (role === "customer") {
      displayCustomerRequests();
    } else if ($("customerRequests")) {
      $("customerRequests").innerHTML = "";
    }
  }

  loginForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = $("loginName").value.trim();
    const role = $("loginRole").value;

    if (!name || !["customer", "worker"].includes(role)) {
      showToast("Enter your name and select Customer or Worker.");
      return;
    }

    localStorage.setItem(KEYS.user, name);
    localStorage.setItem(KEYS.role, role);

    closeLogin();
    updateAccountUI();
    renderShops();
    showToast(`Welcome, ${name}! You are logged in as ${role}.`);

    if (role === "worker") {
      $("workerDashboard").scrollIntoView({ behavior: "smooth" });
    }
  });

  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem(KEYS.user);
    localStorage.removeItem(KEYS.role);
    updateAccountUI();
    showToast("You have logged out.");
  });

  // ---------------- SEARCH AND FILTERS ----------------

  const searchInput = $("searchInput");
  const categoryFilter = $("categoryFilter");
  const availabilityFilter = $("availabilityFilter");

  let selectedCategory = "All";

  function getFilteredShops() {
    const search = (searchInput?.value || "").trim().toLowerCase();
    const category = categoryFilter?.value || "All";
    const availability = availabilityFilter?.value || "All";

    return shops.filter((shop) => {
      const matchesSearch =
        shop.name.toLowerCase().includes(search) ||
        shop.category.toLowerCase().includes(search);

      const matchesCategory =
        category === "All" || shop.category === category;

      const matchesAvailability =
        availability !== "Active" || shop.active;

      const matchesServiceCard =
        selectedCategory === "All" ||
        shop.category === selectedCategory;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesAvailability &&
        matchesServiceCard
      );
    });
  }

  function safeText(value) {
    const span = document.createElement("span");
    span.textContent = String(value);
    return span.innerHTML;
  }

  function renderShops() {
    const container = $("shopContainer");
    if (!container) return;

    refreshShopData();
    const filtered = getFilteredShops();

    container.innerHTML = "";

    filtered.forEach((shop) => {
      const card = document.createElement("article");
      card.className = "shop-card";

      const directionsURL =
        `https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`;

      card.innerHTML = `
        <span class="eyebrow">${safeText(shop.category)}</span>
        <h3>${safeText(shop.name)}</h3>
        <p class="shop-category">Local service provider</p>
        <p class="shop-rating">⭐ ${shop.rating} <span class="muted">(${shop.reviews} reviews)</span></p>
        <span class="shop-status ${shop.active ? "active" : "offline"}">
          ${shop.active ? "● Active now" : "● Offline"}
        </span>
        <p class="shop-contact">📞 ${safeText(shop.phone)}</p>
        <div class="shop-actions">
          <button class="btn btn-primary rate-btn" data-id="${shop.id}">
            ⭐ Rate
          </button>
          <a class="btn btn-outline" href="tel:${shop.phone}">📞 Call</a>
          <a class="btn btn-outline" href="${directionsURL}"
             target="_blank" rel="noopener noreferrer">📍 Directions</a>
        </div>
      `;

      container.appendChild(card);
    });

    $("resultsCount").textContent =
      `${filtered.length} service provider${filtered.length === 1 ? "" : "s"} found`;

    $("emptyMessage").classList.toggle("hidden", filtered.length > 0);

    updateMapMarkers();
  }

  searchInput?.addEventListener("input", renderShops);
  categoryFilter?.addEventListener("change", renderShops);
  availabilityFilter?.addEventListener("change", renderShops);

  document.querySelectorAll(".service-card").forEach((button) => {
    button.addEventListener("click", () => {
      selectedCategory = button.dataset.category;

      document.querySelectorAll(".service-card").forEach((card) => {
        card.classList.toggle("selected", card === button);
      });

      categoryFilter.value = selectedCategory;
      renderShops();
      $("shops").scrollIntoView({ behavior: "smooth" });
    });
  });

  $("clearFiltersBtn")?.addEventListener("click", () => {
    searchInput.value = "";
    categoryFilter.value = "All";
    availabilityFilter.value = "All";
    selectedCategory = "All";

    document.querySelectorAll(".service-card").forEach((card) => {
      card.classList.remove("selected");
    });

    renderShops();
    showToast("Filters cleared.");
  });

  // ---------------- SHOP RATINGS ----------------

  $("shopContainer")?.addEventListener("click", (event) => {
    const button = event.target.closest(".rate-btn");
    if (!button) return;

    if (getRole() !== "customer") {
      showToast("Please log in as a customer to rate a shop.");
      openLogin();
      return;
    }

    const shopId = Number(button.dataset.id);
    const shop = shops.find((item) => item.id === shopId);
    if (!shop) return;

    const input = prompt(
      `Rate ${shop.name} from 1 to 5 stars.`
    );

    if (input === null) return;

    const score = Number(input);

    if (!Number.isInteger(score) || score < 1 || score > 5) {
      showToast("Enter a whole number between 1 and 5.");
      return;
    }

    if (!Array.isArray(ratings[shopId])) ratings[shopId] = [];
    ratings[shopId].push(score);

    writeStore(KEYS.ratings, ratings);
    refreshShopData();
    renderShops();
    showToast("Thank you! Your rating was saved in this browser.");
  });

  // ---------------- WORKER ATTENDANCE ----------------

  function populateWorkerShopOptions() {
    const select = $("workerShop");
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = "";

    shops.forEach((shop) => {
      const option = document.createElement("option");
      option.value = shop.id;
      option.textContent = `${shop.name} — ${shop.category}`;
      select.appendChild(option);
    });

    if (shops.some((shop) => String(shop.id) === currentValue)) {
      select.value = currentValue;
    }
  }

  function updateWorkerDashboard() {
    if (getRole() !== "worker") return;

    const shopId = Number($("workerShop")?.value || shops[0].id);
    const shop = shops.find((item) => item.id === shopId);
    if (!shop) return;

    const active = Boolean(attendance[shopId]);

    $("workerStatus").textContent = active ? "Active now" : "Offline";
    $("workerStatus").className =
      `status-pill ${active ? "active" : "offline"}`;

    $("attendanceBtn").textContent = active
      ? "Mark Attendance / Go Offline"
      : "Mark Attendance / Go Active";

    $("attendanceMessage").textContent = active
      ? `${shop.name}: You are marked active in this browser.`
      : `${shop.name}: You are currently marked offline.`;
  }

  $("workerShop")?.addEventListener("change", updateWorkerDashboard);

  $("attendanceBtn")?.addEventListener("click", () => {
    if (getRole() !== "worker") {
      showToast("Please log in as a worker first.");
      openLogin();
      return;
    }

    const shopId = Number($("workerShop").value);
    const shop = shops.find((item) => item.id === shopId);

    if (!shop) {
      showToast("Please select a valid shop.");
      return;
    }

    attendance[shopId] = !Boolean(attendance[shopId]);
    writeStore(KEYS.attendance, attendance);

    refreshShopData();
    updateWorkerDashboard();
    renderShops();

    showToast(
      attendance[shopId]
        ? "Attendance marked. You are active in this browser."
        : "You are now marked offline in this browser."
    );
  });

  // ---------------- CUSTOMER REQUESTS ----------------

  const requestForm = $("requestForm");

  function displayCustomerRequests() {
    const container = $("customerRequests");
    if (!container || getRole() !== "customer") return;

    const requests = readStore(KEYS.requests, []);
    const mine = requests.filter((item) => item.customer === getUser());

    container.innerHTML = "";

    if (mine.length === 0) {
      container.textContent = "Your submitted requests will appear here.";
      return;
    }

    const heading = document.createElement("h3");
    heading.textContent = "Your Service Requests";
    container.appendChild(heading);

    mine.slice().reverse().forEach((request) => {
      const item = document.createElement("div");
      item.className = "request-item";

      const title = document.createElement("strong");
      title.textContent = request.service;

      const details = document.createElement("p");
      details.textContent = request.details;

      const address = document.createElement("p");
      address.textContent = `Location: ${request.address}`;

      const date = document.createElement("p");
      date.textContent = request.date;

      const status = document.createElement("p");
      status.className = "request-status";
      status.textContent = `Status: ${request.status}`;

      item.append(title, details, address, date, status);
      container.appendChild(item);
    });
  }

  requestForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    if (getRole() !== "customer") {
      showToast("Please log in as a customer to submit a request.");
      openLogin();
      return;
    }

    const service = $("requestService").value;
    const details = $("requestDetails").value.trim();
    const address = $("requestAddress").value.trim();

    if (!service || !details || !address) {
      showToast("Please complete all request fields.");
      return;
    }

    const requests = readStore(KEYS.requests, []);

    requests.push({
      id: Date.now(),
      customer: getUser(),
      service,
      details,
      address,
      date: new Date().toLocaleString(),
      status: "Pending"
    });

    writeStore(KEYS.requests, requests);
    requestForm.reset();
    displayCustomerRequests();
    showToast("Your demo service request has been saved.");
  });

  $("heroRequestBtn")?.addEventListener("click", () => {
    $("requestSection").scrollIntoView({ behavior: "smooth" });
  });

  // ---------------- INTERACTIVE LEAFLET MAP ----------------

  let map = null;
  let markers = [];

  function initializeMap() {
    const mapElement = $("map");

    if (!mapElement || typeof L === "undefined") {
      if (mapElement) {
        mapElement.innerHTML =
          "The map could not load. Check your internet connection and reload.";
      }
      return;
    }

    map = L.map("map").setView([17.0005, 81.8040], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    updateMapMarkers();

    // Fix map sizing when a user opens or resizes the page.
    setTimeout(() => map.invalidateSize(), 150);
  }

  function updateMapMarkers() {
    if (!map) return;

    markers.forEach((marker) => marker.remove());
    markers = [];

    const filtered = getFilteredShops();

    filtered.forEach((shop) => {
      const marker = L.marker([shop.lat, shop.lng]).addTo(map);

      const directionsURL =
        `https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`;

      marker.bindPopup(`
        <strong>${safeText(shop.name)}</strong><br>
        ${safeText(shop.category)}<br>
        ⭐ ${shop.rating} (${shop.reviews} reviews)<br>
        ${shop.active ? "🟢 Active now" : "⚪ Offline"}<br>
        <a href="${directionsURL}" target="_blank"
           rel="noopener noreferrer">Get directions</a><br>
        <a href="tel:${shop.phone}">Call ${shop.phone}</a>
      `);

      marker.addTo(map);
      markers.push(marker);
    });

    if (filtered.length > 0) {
      const bounds = L.latLngBounds(
        filtered.map((shop) => [shop.lat, shop.lng])
      );

      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 14 });
    }
  }

  // ---------------- INITIALIZE PAGE ----------------

  $("currentYear").textContent = new Date().getFullYear();

  updateAccountUI();
  renderShops();
  initializeMap();
});
