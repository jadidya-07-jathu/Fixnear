
// FixNear - Frontend application
// Demo storage: browser localStorage only.
// This is not a secure production login system.

const STORAGE_KEYS = {
  workers: "fixnear_workers_v2",
  orders: "fixnear_orders_v2",
  wages: "fixnear_wages_v2",
  theme: "fixnear_theme_v2"
};

const SERVICES = [
  { name: "Electrician", icon: "⚡", description: "Electrical repairs and wiring" },
  { name: "Plumber", icon: "🚰", description: "Pipes, taps and water leaks" },
  { name: "Mechanic", icon: "🔧", description: "Vehicle repair and maintenance" },
  { name: "Cleaning", icon: "🧹", description: "Home and office cleaning" },
  { name: "Carpenter", icon: "🪚", description: "Furniture and woodwork" },
  { name: "AC Repair", icon: "❄️", description: "Air conditioner service" },
  { name: "Painter", icon: "🖌️", description: "Home and building painting" },
  { name: "Appliance Repair", icon: "🛠️", description: "Repairs for home appliances" }
];

const DEMO_PROVIDERS = [
  {
    id: "demo-electrician",
    name: "City Electrical Services",
    service: "Electrician",
    location: "Main town",
    price: 300,
    experience: 5,
    description: "Sample electrical repair and installation service.",
    type: "Demo shop",
    rating: 4.5,
    lat: 17.0000,
    lng: 81.8000
  },
  {
    id: "demo-plumber",
    name: "Quick Plumbing Shop",
    service: "Plumber",
    location: "Market area",
    price: 250,
    experience: 4,
    description: "Sample plumbing and leakage repair service.",
    type: "Demo shop",
    rating: 4.2,
    lat: 17.0050,
    lng: 81.8050
  },
  {
    id: "demo-mechanic",
    name: "Local Auto Care",
    service: "Mechanic",
    location: "Bus stand road",
    price: 400,
    experience: 6,
    description: "Sample vehicle maintenance and repair service.",
    type: "Demo shop",
    rating: 4.4,
    lat: 17.0100,
    lng: 81.8100
  },
  {
    id: "demo-cleaning",
    name: "Fresh Home Cleaning",
    service: "Cleaning",
    location: "Residential area",
    price: 500,
    experience: 3,
    description: "Sample home and office cleaning service.",
    type: "Demo shop",
    rating: 4.1,
    lat: 16.9950,
    lng: 81.7950
  },
  {
    id: "demo-carpenter",
    name: "Woodcraft Workshop",
    service: "Carpenter",
    location: "Workshop street",
    price: 350,
    experience: 7,
    description: "Sample furniture and carpentry service.",
    type: "Demo shop",
    rating: 4.3,
    lat: 17.0020,
    lng: 81.8030
  },
  {
    id: "demo-ac",
    name: "Cool Air Service",
    service: "AC Repair",
    location: "Main road",
    price: 450,
    experience: 5,
    description: "Sample air conditioner maintenance service.",
    type: "Demo shop",
    rating: 4.6,
    lat: 17.0080,
    lng: 81.8070
  }
];

let activeRole = null;
let activeWorkerId = null;
let activeCustomerName = "";
let activeCustomerPhone = "";
let editingWorkerId = null;
let toastTimer = null;

const $ = (selector) => document.querySelector(selector);

function readStorage(key, fallback = []) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error("Unable to read saved data:", error);
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error("Unable to save data:", error);
    showToast("Could not save data. Check browser storage.");
    return false;
  }
}

function getWorkers() {
  return readStorage(STORAGE_KEYS.workers, []);
}

function saveWorkers(workers) {
  return writeStorage(STORAGE_KEYS.workers, workers);
}

function getOrders() {
  return readStorage(STORAGE_KEYS.orders, []);
}

function saveOrders(orders) {
  return writeStorage(STORAGE_KEYS.orders, orders);
}

function getWages() {
  return readStorage(STORAGE_KEYS.wages, []);
}

function saveWages(entries) {
  return writeStorage(STORAGE_KEYS.wages, entries);
}

function makeId(prefix) {
  return prefix + "-" + Date.now().toString(36) +
    "-" + Math.random().toString(36).slice(2, 8);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function formatMoney(value) {
  return "₹" + Number(value || 0).toLocaleString("en-IN");
}

function formatDate(value) {
  if (!value) return "Not specified";

  const date = new Date(value + (value.length === 10 ? "T00:00:00" : ""));
  if (Number.isNaN(date.getTime())) return "Not specified";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function isRole(role) {
  return activeRole === role;
}

function setRoleVisibility() {
  document.querySelectorAll(".customer-only").forEach((element) => {
    element.classList.toggle("hidden", activeRole !== "customer");
  });

  document.querySelectorAll(".worker-only").forEach((element) => {
    element.classList.toggle("hidden", activeRole !== "worker");
  });
}

function enterSite(role, options = {}) {
  activeRole = role;

  $("#welcomeScreen").classList.add("hidden");
  $("#app").classList.remove("hidden");
  $("#currentRole").textContent = role === "worker" ? "Worker" : "Customer";

  setRoleVisibility();

  if (role === "customer") {
    activeWorkerId = null;
    renderCustomerDashboard();
  }

  if (role === "worker") {
    renderWorkerDashboard();
    $("#workerRegistration").classList.toggle(
      "hidden",
      Boolean(activeWorkerId) && !options.editProfile
    );

    if (options.editProfile) {
      $("#workerRegistration").classList.remove("hidden");
      fillWorkerForm();
      $("#workerRegistration").scrollIntoView({ behavior: "smooth" });
    } else if (activeWorkerId) {
      $("#workerDashboard").scrollIntoView({ behavior: "smooth" });
    } else {
      $("#workerRegistration").scrollIntoView({ behavior: "smooth" });
    }
  }

  renderServices();
  renderProviders();
  populateProviderSelect();

  $("#mainNav").classList.remove("open");
  $("#menuToggle").setAttribute("aria-expanded", "false");
}

function leaveRole() {
  activeRole = null;
  activeWorkerId = null;
  activeCustomerName = "";
  activeCustomerPhone = "";
  editingWorkerId = null;

  $("#app").classList.add("hidden");
  $("#welcomeScreen").classList.remove("hidden");
  $("#mainNav").classList.remove("open");
}

function askCustomerDetails() {
  const name = prompt("Enter your name to continue:");
  if (!name || !name.trim()) {
    showToast("Please enter your name.");
    return;
  }

  activeCustomerName = name.trim().slice(0, 60);
  activeCustomerPhone = "";
  enterSite("customer");
  $("#customerName").value = activeCustomerName;
  showToast("Welcome! You can now browse and request services.");
}

function chooseWorkerProfile() {
  const workers = getWorkers();

  const name = prompt(
    "Enter your registered worker name.\n" +
    "If you are new, choose Cancel and register below."
  );

  if (name && name.trim()) {
    const match = workers.find(
      (worker) => worker.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (match) {
      activeWorkerId = match.id;
      enterSite("worker");
      showToast("Welcome back, " + match.name + "!");
      return;
    }

    const shouldRegister = confirm(
      "No worker profile was found for that name. Register a new profile?"
    );

    if (!shouldRegister) return;
  }

  activeWorkerId = null;
  editingWorkerId = null;
  enterSite("worker");
  $("#workerRegistration").classList.remove("hidden");
  $("#workerDashboard").classList.add("hidden");
  showToast("Complete the worker registration form.");
}

function getActiveWorker() {
  return getWorkers().find((worker) => worker.id === activeWorkerId) || null;
}

function getAllProviders() {
  const workers = getWorkers().filter((worker) => worker.available !== false);

  const workerProviders = workers.map((worker) => ({
    ...worker,
    type: worker.type || "Independent",
    price: Number(worker.price || 0),
    experience: Number(worker.experience || 0),
    rating: Number(worker.rating || 0),
    isWorker: true
  }));

  return [...workerProviders, ...DEMO_PROVIDERS];
}

function renderServices() {
  const grid = $("#serviceGrid");
  if (!grid) return;

  grid.innerHTML = SERVICES.map((service) => `
    <button class="service-card" type="button"
      data-service="${escapeHTML(service.name)}">
      <span class="service-icon">${service.icon}</span>
      <strong>${escapeHTML(service.name)}</strong>
      <small>${escapeHTML(service.description)}</small>
    </button>
  `).join("");
}

function mapsDirectionsURL(provider) {
  const query = encodeURIComponent(
    [provider.name, provider.location].filter(Boolean).join(", ")
  );

  if (
    Number.isFinite(Number(provider.lat)) &&
    Number.isFinite(Number(provider.lng)) &&
    provider.lat !== "" &&
    provider.lng !== ""
  ) {
    return "https://www.google.com/maps/dir/?api=1&destination=" +
      encodeURIComponent(provider.lat + "," + provider.lng);
  }

  return "https://www.google.com/maps/dir/?api=1&destination=" + query;
}

function renderProviders() {
  const grid = $("#providerGrid");
  if (!grid) return;

  const searchTerm = ($("#providerSearch")?.value || "").trim().toLowerCase();
  const selectedService = $("#serviceFilter")?.value || "All";

  const providers = getAllProviders().filter((provider) => {
    const searchable = [
      provider.name,
      provider.service,
      provider.location,
      provider.shop,
      provider.type
    ].join(" ").toLowerCase();

    const matchesSearch = !searchTerm || searchable.includes(searchTerm);
    const matchesService =
      selectedService === "All" || provider.service === selectedService;

    return matchesSearch && matchesService;
  });

  if (!providers.length) {
    grid.innerHTML = `
      <div class="empty-state">
        No providers match your search. Try another service or location.
      </div>
    `;
    return;
  }

  grid.innerHTML = providers.map((provider) => {
    const icon = SERVICES.find((service) =>
      service.name === provider.service
    )?.icon || "🧰";

    const rating = Number(provider.rating || 0);
    const ratingText = rating > 0 ? rating.toFixed(1) + " ★" : "New profile";
    const priceText = formatMoney(provider.price);

    return `
      <article class="provider-card">
        <div class="provider-top">
          <div class="provider-avatar">${icon}</div>
          <div>
            <h3>${escapeHTML(provider.name)}</h3>
            <p>${escapeHTML(provider.service)} · ${escapeHTML(provider.type)}</p>
          </div>
        </div>

        <div class="provider-meta">
          <span class="pill">${escapeHTML(ratingText)}</span>
          <span class="pill">${escapeHTML(String(provider.experience || 0))} years experience</span>
          <span class="pill">From ${escapeHTML(priceText)}</span>
        </div>

        <p class="provider-details">
          <strong>Area:</strong> ${escapeHTML(provider.location || "Not provided")}
        </p>

        <p class="provider-details">
          ${escapeHTML(provider.description || provider.skills || "Local service provider.")}
        </p>

        <div class="provider-actions">
          <a href="${mapsDirectionsURL(provider)}" target="_blank"
            rel="noopener noreferrer">Directions</a>
          <button type="button" class="book-provider"
            data-book-provider="${escapeHTML(provider.id)}"
            data-book-service="${escapeHTML(provider.service)}">
            Request Service
          </button>
        </div>
      </article>
    `;
  }).join("");
}

function populateProviderSelect() {
  const select = $("#requestProvider");
  if (!select) return;

  const currentValue = select.value;
  const providers = getAllProviders();

  select.innerHTML = '<option value="">Any matching provider</option>' +
    providers.map((provider) => `
      <option value="${escapeHTML(provider.id)}"
        data-service="${escapeHTML(provider.service)}">
        ${escapeHTML(provider.name)} — ${escapeHTML(provider.service)}
      </option>
    `).join("");

  if ([...select.options].some((option) => option.value === currentValue)) {
    select.value = currentValue;
  }

  filterProviderOptions();
}

function filterProviderOptions() {
  const service = $("#requestService")?.value || "";
  const select = $("#requestProvider");
  if (!select) return;

  [...select.options].forEach((option, index) => {
    if (index === 0) {
      option.hidden = false;
      return;
    }

    option.hidden = Boolean(service) && option.dataset.service !== service;

    if (option.hidden && option.selected) {
      select.value = "";
    }
  });
}

function scrollToRequest(service = "", providerId = "") {
  if (!isRole("customer")) {
    showToast("Switch to the customer role to submit a service request.");
    return;
  }

  if (service) {
    $("#requestService").value = service;
    filterProviderOptions();
  }

  if (providerId) {
    $("#requestProvider").value = providerId;
  }

  $("#requestSection").scrollIntoView({ behavior: "smooth" });
}

function createOrder(event) {
  event.preventDefault();

  if (!isRole("customer")) {
    showToast("Choose the customer role to submit a request.");
    return;
  }

  const name = $("#customerName").value.trim();
  const phone = $("#customerPhone").value.trim();
  const service = $("#requestService").value;
  const providerId = $("#requestProvider").value;
  const address = $("#customerAddress").value.trim();
  const description = $("#requestDescription").value.trim();
  const date = $("#requestDate").value;
  const budget = $("#requestBudget").value;

  if (!name || !phone || !service || !address || !description) {
    showToast("Please complete all required fields.");
    return;
  }

  const providers = getAllProviders();
  const provider = providers.find((item) => item.id === providerId);

  if (provider && provider.service !== service) {
    showToast("Choose a provider matching the selected service.");
    return;
  }

  const orders = getOrders();

  const order = {
    id: makeId("order"),
    customerName: name,
    customerPhone: phone,
    service,
    providerId: provider ? provider.id : "",
    providerName: provider ? provider.name : "Any matching provider",
    assignedWorkerId: provider?.isWorker ? provider.id : "",
    address,
    description,
    preferredDate: date,
    budget: budget === "" ? null : Number(budget),
    status: "Pending",
    createdAt: new Date().toISOString(),
    rating: null,
    feedback: ""
  };

  orders.unshift(order);

  if (!saveOrders(orders)) return;

  activeCustomerName = name;
  activeCustomerPhone = phone;

  $("#requestForm").reset();
  $("#customerName").value = activeCustomerName;
  populateProviderSelect();

  renderCustomerDashboard();
  renderProviders();

  showToast("Your service request has been saved.");
  $("#customerDashboard").scrollIntoView({ behavior: "smooth" });
}

function renderCustomerDashboard() {
  if (!$("#customerOrders")) return;

  const allOrders = getOrders();
  const customerOrders = allOrders.filter((order) =>
    order.customerName.toLowerCase() === activeCustomerName.toLowerCase()
  );

  const completed = customerOrders.filter(
    (order) => order.status === "Completed"
  ).length;

  const pending = customerOrders.filter(
    (order) => order.status === "Pending"
  ).length;

  $("#customerStats").innerHTML = `
    <div class="stat-card">
      <span>Total requests</span>
      <strong>${customerOrders.length}</strong>
    </div>
    <div class="stat-card">
      <span>Pending requests</span>
      <strong>${pending}</strong>
    </div>
    <div class="stat-card">
      <span>Completed services</span>
      <strong>${completed}</strong>
    </div>
  `;

  if (!customerOrders.length) {
    $("#customerOrders").innerHTML = `
      <div class="empty-state">
        You have no requests yet. Browse services to get started.
      </div>
    `;
    return;
  }

  $("#customerOrders").innerHTML = customerOrders.map((order) => {
    const canRate = order.status === "Completed" && !order.rating;

    return `
      <article class="order-card">
        <div class="order-card-head">
          <div>
            <h3>${escapeHTML(order.service)} request</h3>
            <p>Request ID: ${escapeHTML(order.id)}</p>
          </div>
          <span class="status-pill">${escapeHTML(order.status)}</span>
        </div>

        <p><strong>Provider:</strong> ${escapeHTML(order.providerName)}</p>
        <p><strong>Address:</strong> ${escapeHTML(order.address)}</p>
        <p><strong>Issue:</strong> ${escapeHTML(order.description)}</p>
        <p><strong>Preferred date:</strong> ${escapeHTML(formatDate(order.preferredDate))}</p>
        <p><strong>Budget:</strong> ${order.budget == null ? "Not specified" : escapeHTML(formatMoney(order.budget))}</p>
        <p><strong>Created:</strong> ${escapeHTML(formatDate(order.createdAt))}</p>

        ${order.rating
          ? `<p><strong>Your rating:</strong> ${"★".repeat(order.rating)}${"☆".repeat(5 - order.rating)}
              ${escapeHTML(order.feedback || "")}</p>`
          : ""}

        ${canRate ? `
          <div class="order-actions">
            <select class="rating-select" id="rating-${escapeHTML(order.id)}"
              aria-label="Choose rating">
              <option value="5">5 stars</option>
              <option value="4">4 stars</option>
              <option value="3">3 stars</option>
              <option value="2">2 stars</option>
              <option value="1">1 star</option>
            </select>
            <input id="feedback-${escapeHTML(order.id)}"
              type="text" maxlength="250" placeholder="Optional feedback">
            <button type="button" data-rate-order="${escapeHTML(order.id)}">
              Submit Rating
            </button>
          </div>
        ` : ""}
      </article>
    `;
  }).join("");
}

function submitRating(orderId) {
  const orders = getOrders();
  const order = orders.find((item) => item.id === orderId);

  if (!order) {
    showToast("Request not found.");
    return;
  }

  if (order.customerName.toLowerCase() !== activeCustomerName.toLowerCase()) {
    showToast("You can only rate your own requests in this demo.");
    return;
  }

  if (order.status !== "Completed") {
    showToast("You can rate a request after it is completed.");
    return;
  }

  if (order.rating) {
    showToast("This request has already been rated.");
    return;
  }

  const ratingInput = $("#rating-" + orderId);
  const feedbackInput = $("#feedback-" + orderId);

  const rating = Number(ratingInput?.value);
  const feedback = feedbackInput?.value.trim() || "";

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    showToast("Choose a rating between 1 and 5.");
    return;
  }

  order.rating = rating;
  order.feedback = feedback;

  if (!saveOrders(orders)) return;

  updateWorkerRating(order.assignedWorkerId, rating);
  renderCustomerDashboard();
  renderWorkerDashboard();
  renderProviders();

  showToast("Thank you for your feedback!");
}

function updateWorkerRating(workerId, newRating) {
  if (!workerId) return;

  const workers = getWorkers();
  const worker = workers.find((item) => item.id === workerId);

  if (!worker) return;

  const ratedOrders = getOrders().filter((order) =>
    order.assignedWorkerId === workerId && order.rating
  );

  const total = ratedOrders.reduce((sum, order) => sum + order.rating, 0);

  worker.ratingCount = ratedOrders.length;
  worker.rating = ratedOrders.length ? total / ratedOrders.length : 0;

  saveWorkers(workers);
}

function workerRegistrationSubmit(event) {
  event.preventDefault();

  if (!isRole("worker")) {
    showToast("Choose the worker role first.");
    return;
  }

  const name = $("#workerName").value.trim();
  const phone = $("#workerPhone").value.trim();
  const age = Number($("#workerAge").value);
  const education = $("#workerEducation").value;
  const service = $("#workerService").value;
  const experience = Number($("#workerExperience").value);
  const type = $("#workerType").value;
  const shop = $("#workerShop").value.trim();
  const location = $("#workerLocation").value.trim();
  const price = Number($("#workerPrice").value);
  const wageValue = $("#workerWage").value;
  const monthlyWage = wageValue === "" ? 0 : Number(wageValue);
  const skills = $("#workerSkills").value.trim();
  const available = $("#workerAvailable").checked;

  if (!name || !phone || !education || !service || !type || !location) {
    showToast("Please complete the required worker details.");
    return;
  }

  if (age < 18 || age > 100) {
    showToast("Worker registration requires an age of 18 or above in this demo.");
    return;
  }

  if (experience < 0 || experience > 70 || price < 0 || monthlyWage < 0) {
    showToast("Check the experience and price fields.");
    return;
  }

  if (type === "Shop employee" && !shop) {
    showToast("Enter the shop name for a shop employee.");
    return;
  }

  const workers = getWorkers();

  const duplicate = workers.find((worker) =>
    worker.name.toLowerCase() === name.toLowerCase() &&
    worker.id !== editingWorkerId
  );

  if (duplicate) {
    showToast("A profile with that name already exists in this browser.");
    return;
  }

  const oldWorker = workers.find((worker) => worker.id === editingWorkerId);

  const worker = {
    id: editingWorkerId || makeId("worker"),
    name,
    phone,
    age,
    education,
    service,
    experience,
    type,
    shop,
    location,
    price,
    monthlyWage,
    skills,
    available,
    rating: oldWorker?.rating || 0,
    ratingCount: oldWorker?.ratingCount || 0,
    createdAt: oldWorker?.createdAt || new Date().toISOString()
  };

  const existingIndex = workers.findIndex((item) => item.id === worker.id);

  if (existingIndex >= 0) {
    workers[existingIndex] = worker;
  } else {
    workers.unshift(worker);
  }

  if (!saveWorkers(workers)) return;

  activeWorkerId = worker.id;
  editingWorkerId = null;

  $("#workerForm").reset();
  $("#workerAvailable").checked = true;

  renderProviders();
  populateProviderSelect();
  renderWorkerDashboard();

  $("#workerRegistration").classList.add("hidden");
  $("#workerDashboard").classList.remove("hidden");
  showToast("Worker profile saved successfully.");
  $("#workerDashboard").scrollIntoView({ behavior: "smooth" });
}

function fillWorkerForm() {
  const worker = getWorkers().find((item) => item.id === editingWorkerId);

  if (!worker) {
    $("#workerForm").reset();
    $("#workerAvailable").checked = true;
    return;
  }

  $("#workerName").value = worker.name || "";
  $("#workerPhone").value = worker.phone || "";
  $("#workerAge").value = worker.age || "";
  $("#workerEducation").value = worker.education || "";
  $("#workerService").value = worker.service || "";
  $("#workerExperience").value = worker.experience ?? "";
  $("#workerType").value = worker.type || "";
  $("#workerShop").value = worker.shop || "";
  $("#workerLocation").value = worker.location || "";
  $("#workerPrice").value = worker.price ?? "";
  $("#workerWage").value = worker.monthlyWage ?? "";
  $("#workerSkills").value = worker.skills || "";
  $("#workerAvailable").checked = worker.available !== false;
}

function renderWorkerDashboard() {
  const worker = getActiveWorker();

  if (!worker) {
    $("#workerDashboard").classList.add("hidden");
    $("#workerRegistration").classList.remove("hidden");
    return;
  }

  $("#workerDashboard").classList.remove("hidden");

  const orders = getOrders().filter(
    (order) => order.assignedWorkerId === worker.id
  );

  const pending = orders.filter((order) => order.status === "Pending").length;
  const inProgress = orders.filter(
    (order) => order.status === "In Progress"
  ).length;
  const completed = orders.filter(
    (order) => order.status === "Completed"
  ).length;

  const wageEntries = getWages().filter(
    (entry) => entry.workerId === worker.id
  );

  const extraEarnings = wageEntries.reduce(
    (sum, entry) => sum + Number(entry.amount || 0), 0
  );

  const completedBudgetTotal = orders
    .filter((order) => order.status === "Completed")
    .reduce((sum, order) => sum + Number(order.budget || 0), 0);

  $("#workerSummary").innerHTML = `
    <div class="stat-card">
      <span>Pending requests</span>
      <strong>${pending}</strong>
    </div>
    <div class="stat-card">
      <span>In progress</span>
      <strong>${inProgress}</strong>
    </div>
    <div class="stat-card">
      <span>Completed jobs</span>
      <strong>${completed}</strong>
    </div>
    <div class="stat-card">
      <span>Manual earnings entries</span>
      <strong>${escapeHTML(formatMoney(extraEarnings))}</strong>
    </div>
    <div class="stat-card">
      <span>Completed order budgets</span>
      <strong>${escapeHTML(formatMoney(completedBudgetTotal))}</strong>
    </div>
    <div class="stat-card">
      <span>Average rating</span>
      <strong>${worker.ratingCount ? Number(worker.rating).toFixed(1) + " ★" : "New"}</strong>
    </div>
  `;

  $("#workerProfileDetails").innerHTML = `
    <div class="profile-line"><span>Name</span>${escapeHTML(worker.name)}</div>
    <div class="profile-line"><span>Service</span>${escapeHTML(worker.service)}</div>
    <div class="profile-line"><span>Phone</span>${escapeHTML(worker.phone)}</div>
    <div class="profile-line"><span>Age</span>${escapeHTML(worker.age)}</div>
    <div class="profile-line"><span>Education</span>${escapeHTML(worker.education)}</div>
    <div class="profile-line"><span>Experience</span>${escapeHTML(worker.experience)} years</div>
    <div class="profile-line"><span>Work type</span>${escapeHTML(worker.type)}</div>
    <div class="profile-line"><span>Shop</span>${escapeHTML(worker.shop || "Not specified")}</div>
    <div class="profile-line"><span>Location</span>${escapeHTML(worker.location)}</div>
    <div class="profile-line"><span>Starting price</span>${escapeHTML(formatMoney(worker.price))}</div>
    <div class="profile-line"><span>Monthly wage</span>${worker.monthlyWage ? escapeHTML(formatMoney(worker.monthlyWage)) : "Not specified"}</div>
    <div class="profile-line"><span>Availability</span>${worker.available ? "Available" : "Unavailable"}</div>
    <div class="profile-line"><span>Skills</span>${escapeHTML(worker.skills || "Not specified")}</div>
  `;

  const ratedOrders = orders.filter((order) => order.rating);

  $("#workerRatings").innerHTML = ratedOrders.length
    ? ratedOrders.map((order) => `
        <div class="rating-line">
          <strong>${"★".repeat(order.rating)}${"☆".repeat(5 - order.rating)}</strong>
          <p>${escapeHTML(order.feedback || "No written feedback.")}</p>
          <p>Service: ${escapeHTML(order.service)}</p>
        </div>
      `).join("")
    : '<p class="muted">No customer ratings yet.</p>';

  if (!orders.length) {
    $("#workerOrders").innerHTML = `
      <div class="empty-state">
        No requests have been assigned to this worker profile yet.
      </div>
    `;
  } else {
    $("#workerOrders").innerHTML = orders.map((order) => `
      <article class="order-card">
        <div class="order-card-head">
          <div>
            <h3>${escapeHTML(order.service)} request</h3>
            <p>Request ID: ${escapeHTML(order.id)}</p>
          </div>
          <span class="status-pill">${escapeHTML(order.status)}</span>
        </div>

        <p><strong>Customer:</strong> ${escapeHTML(order.customerName)}</p>
        <p><strong>Contact:</strong> ${escapeHTML(order.customerPhone)}</p>
        <p><strong>Address:</strong> ${escapeHTML(order.address)}</p>
        <p><strong>Issue:</strong> ${escapeHTML(order.description)}</p>
        <p><strong>Preferred date:</strong> ${escapeHTML(formatDate(order.preferredDate))}</p>
        <p><strong>Customer budget:</strong> ${order.budget == null ? "Not specified" : escapeHTML(formatMoney(order.budget))}</p>

        <div class="order-actions">
          ${order.status === "Pending" ? `
            <button type="button" data-order-action="accept"
              data-order-id="${escapeHTML(order.id)}">Accept</button>
            <button type="button" data-order-action="decline"
              data-order-id="${escapeHTML(order.id)}">Decline</button>
          ` : ""}

          ${order.status === "In Progress" ? `
            <button type="button" data-order-action="complete"
              data-order-id="${escapeHTML(order.id)}">Mark Completed</button>
          ` : ""}
        </div>
      </article>
    `).join("");
  }

  renderWageEntries();
}

function updateOrderStatus(orderId, action) {
  if (!isRole("worker") || !activeWorkerId) {
    showToast("Enter your worker profile first.");
    return;
  }

  const orders = getOrders();
  const order = orders.find((item) =>
    item.id === orderId && item.assignedWorkerId === activeWorkerId
  );

  if (!order) {
    showToast("This request is not assigned to your profile.");
    return;
  }

  if (action === "accept" && order.status === "Pending") {
    order.status = "In Progress";
  } else if (action === "decline" && order.status === "Pending") {
    order.status = "Declined";
  } else if (action === "complete" && order.status === "In Progress") {
    order.status = "Completed";
  } else {
    showToast("This status update is not available.");
    return;
  }

  if (!saveOrders(orders)) return;

  renderWorkerDashboard();
  renderCustomerDashboard();

  showToast("Request status updated to " + order.status + ".");
}

function addWageEntry(event) {
  event.preventDefault();

  if (!isRole("worker") || !activeWorkerId) {
    showToast("Register or select a worker profile first.");
    return;
  }

  const amount = Number($("#wageAmount").value);
  const note = $("#wageNote").value.trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    showToast("Enter a valid earnings amount.");
    return;
  }

  const entries = getWages();

  entries.unshift({
    id: makeId("wage"),
    workerId: activeWorkerId,
    amount,
    note,
    date: new Date().toISOString()
  });

  if (!saveWages(entries)) return;

  $("#wageForm").reset();
  renderWorkerDashboard();

  showToast("Earnings entry added.");
}

function renderWageEntries() {
  const container = $("#wageEntries");
  if (!container || !activeWorkerId) return;

  const entries = getWages().filter(
    (entry) => entry.workerId === activeWorkerId
  );

  if (!entries.length) {
    container.innerHTML = `
      <div class="empty-state">No earnings entries have been added.</div>
    `;
    return;
  }

  container.innerHTML = entries.map((entry) => `
    <div class="wage-entry">
      <strong>${escapeHTML(formatMoney(entry.amount))}</strong>
      <p>${escapeHTML(entry.note || "Earnings entry")}</p>
      <p>${escapeHTML(formatDate(entry.date))}</p>
      <div class="order-actions">
        <button type="button" data-delete-wage="${escapeHTML(entry.id)}">
          Delete Entry
        </button>
      </div>
    </div>
  `).join("");
}

function deleteWageEntry(entryId) {
  if (!activeWorkerId) return;

  const entries = getWages();
  const entry = entries.find((item) =>
    item.id === entryId && item.workerId === activeWorkerId
  );

  if (!entry) {
    showToast("Earnings entry not found.");
    return;
  }

  if (!confirm("Delete this earnings entry?")) return;

  const updated = entries.filter((item) => item.id !== entryId);

  if (!saveWages(updated)) return;

  renderWorkerDashboard();
  showToast("Earnings entry deleted.");
}

function editWorkerProfile() {
  const worker = getActiveWorker();

  if (!worker) {
    showToast("Register your worker profile first.");
    $("#workerRegistration").scrollIntoView({ behavior: "smooth" });
    return;
  }

  editingWorkerId = worker.id;
  fillWorkerForm();

  $("#workerRegistration").classList.remove("hidden");
  $("#workerRegistration").scrollIntoView({ behavior: "smooth" });
}

function applySavedTheme() {
  const theme = localStorage.getItem(STORAGE_KEYS.theme);

  if (theme === "light") {
    document.body.classList.add("light-theme");
    $("#themeToggle").textContent = "☀";
  } else {
    document.body.classList.remove("light-theme");
    $("#themeToggle").textContent = "☾";
  }
}

function toggleTheme() {
  const light = document.body.classList.toggle("light-theme");
  localStorage.setItem(STORAGE_KEYS.theme, light ? "light" : "dark");
  $("#themeToggle").textContent = light ? "☀" : "☾";
}

function initializeDates() {
  const dateInput = $("#requestDate");
  if (!dateInput) return;

  const today = new Date();
  const localDate = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
  ).toISOString().slice(0, 10);

  dateInput.min = localDate;
}

function bindEvents() {
  $("#chooseCustomer").addEventListener("click", askCustomerDetails);
  $("#chooseWorker").addEventListener("click", chooseWorkerProfile);
  $("#switchRole").addEventListener("click", leaveRole);
  $("#themeToggle").addEventListener("click", toggleTheme);

  $("#menuToggle").addEventListener("click", () => {
    const nav = $("#mainNav");
    const open = nav.classList.toggle("open");
    $("#menuToggle").setAttribute("aria-expanded", String(open));
  });

  $("#mainNav").addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      $("#mainNav").classList.remove("open");
      $("#menuToggle").setAttribute("aria-expanded", "false");
    }
  });

  $("#providerSearch").addEventListener("input", renderProviders);
  $("#serviceFilter").addEventListener("change", renderProviders);

  $("#requestService").addEventListener("change", filterProviderOptions);
  $("#requestForm").addEventListener("submit", createOrder);
  $("#workerForm").addEventListener("submit", workerRegistrationSubmit);
  $("#wageForm").addEventListener("submit", addWageEntry);
  $("#editWorkerProfile").addEventListener("click", editWorkerProfile);

  $("#serviceGrid").addEventListener("click", (event) => {
    const card = event.target.closest("[data-service]");
    if (!card) return;

    const service = card.dataset.service;

    $("#serviceFilter").value = service;
    renderProviders();

    if (isRole("customer")) {
      scrollToRequest(service);
    } else {
      $("#shops").scrollIntoView({ behavior: "smooth" });
      showToast("Showing providers for " + service + ".");
    }
  });

  $("#providerGrid").addEventListener("click", (event) => {
    const button = event.target.closest("[data-book-provider]");
    if (!button) return;

    scrollToRequest(
      button.dataset.bookService,
      button.dataset.bookProvider
    );
  });

  $("#customerOrders").addEventListener("click", (event) => {
    const button = event.target.closest("[data-rate-order]");
    if (button) submitRating(button.dataset.rateOrder);
  });

  $("#workerOrders").addEventListener("click", (event) => {
    const button = event.target.closest("[data-order-action]");
    if (!button) return;

    updateOrderStatus(
      button.dataset.orderId,
      button.dataset.orderAction
    );
  });

  $("#wageEntries").addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-wage]");
    if (button) deleteWageEntry(button.dataset.deleteWage);
  });
}

function initializeApp() {
  applySavedTheme();
  renderServices();
  renderProviders();
  populateProviderSelect();
  initializeDates();
  bindEvents();

  // Restore only the interface, not a secure authenticated session.
  // Users choose their role each time the page is loaded.
}

document.addEventListener("DOMContentLoaded", initializeApp);

const$ = (selector) => document.querySelector(selector);

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

function makeCell(value) {
  const td = document.createElement("td");
  td.textContent = value == null ? "" : String(value);
  return td;
}

function addTableRow(tbody, values) {
  const row = document.createElement("tr");
  values.forEach(value => row.appendChild(makeCell(value)));
  tbody.appendChild(row);
  return row;
}

function makeButton(label, callback) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "button secondary";
  button.textContent = label;
  button.addEventListener("click", callback);
  return button;
}

// Mobile navigation
$("#menuToggle").addEventListener("click", () => {
  const nav = $("#mainNav");
  const open = nav.classList.toggle("open");
  $("#menuToggle").setAttribute("aria-expanded", String(open));
});

$("#mainNav").querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    $("#mainNav").classList.remove("open");
    $("#menuToggle").setAttribute("aria-expanded", "false");
  });
});

// Load service categories from MySQL through Flask.
async function loadServices() {
  try {
    const services = await api("/api/services");
    const list = $("#serviceList");
    const requestSelect = $("#requestService");
    const workerSelect = $("#workerService");

    list.replaceChildren();
    [requestSelect, workerSelect].forEach(select => {
      const placeholder = select.options[0];
      select.replaceChildren(placeholder);
    });

    services.forEach(service => {
      const option = document.createElement("option");
      option.value = service.name;
      option.textContent = service.name;
      requestSelect.appendChild(option);

      const workerOption = document.createElement("option");
      workerOption.value = String(service.id);
      workerOption.textContent = service.name;
      workerSelect.appendChild(workerOption);

      const card = document.createElement("article");
      card.className = "service-card";

      const title = document.createElement("h3");
      title.textContent = service.name;

      const description = document.createElement("p");
      description.textContent = service.description || "Local service available.";

      const bookButton = document.createElement("button");
      bookButton.type = "button";
      bookButton.className = "button";
      bookButton.textContent = "Book service";
      bookButton.addEventListener("click", () => {
        requestSelect.value = service.name;
        $("#request").scrollIntoView({ behavior: "smooth" });
      });

      card.append(title, description, bookButton);
      list.appendChild(card);
    });

    if (!services.length) {
      list.textContent = "No services are available at the moment.";
    }
  } catch (error) {
    $("#serviceList").textContent = "Unable to load services. Please try again later.";
    showToast(error.message);
  }
}

// Customer booking form
$("#requestForm").addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());

  try {
    const result = await api("/api/requests", {
      method: "POST",
      body: JSON.stringify(data)
    });
    form.reset();
    showToast(`Request #${result.id} submitted successfully.`);
  } catch (error) {
    showToast(error.message);
  }
});

// Worker registration form
$("#workerForm").addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const raw = Object.fromEntries(new FormData(form).entries());

  const data = {
    ...raw,
    service_id: raw.service_id ? Number(raw.service_id) : null,
    experience_years: Number(raw.experience_years || 0),
    rate: Number(raw.rate || 0),
    monthly_wage: Number(raw.monthly_wage || 0)
  };

  try {
    const result = await api("/api/workers", {
      method: "POST",
      body: JSON.stringify(data)
    });
    form.reset();
    showToast(`Worker registration saved. Reference: ${result.id}`);
  } catch (error) {
    showToast(error.message);
  }
});

// Admin interface
function showAdminDashboard(username) {
  $("#adminLoginForm").hidden = true;
  $("#adminDashboard").hidden = false;
  $("#adminUsername").textContent = username || "Admin";
}

function showAdminLogin() {
  $("#adminLoginForm").hidden = false;
  $("#adminDashboard").hidden = true;
}

async function loadAdminOverview() {
  const data = await api("/api/admin/overview");
  $("#statRequests").textContent = data.total_requests;
  $("#statPending").textContent = data.pending_requests;
  $("#statWorkers").textContent = data.total_workers;
  $("#statServices").textContent = data.active_services;
  $("#statPayments").textContent =
    "₹" + Number(data.recorded_payments || 0).toLocaleString("en-IN");
}

async function loadAdminRequests() {
  const requests = await api("/api/admin/requests");
  const body = $("#adminRequests");
  body.replaceChildren();

  requests.forEach(item => {
    const row = document.createElement("tr");

    [
      item.id, item.customer_name, item.customer_phone,
      item.service_name, item.address
    ].forEach(value => row.appendChild(makeCell(value)));

    const statusCell = document.createElement("td");
    const select = document.createElement("select");

    [
      ["pending", "Pending"],
      ["accepted", "Accepted"],
      ["in_progress", "In progress"],
      ["completed", "Completed"],
      ["cancelled", "Cancelled"]
    ].forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = item.status === value;
      select.appendChild(option);
    });

    statusCell.appendChild(select);
    row.appendChild(statusCell);

    const actionCell = document.createElement("td");
    actionCell.appendChild(makeButton("Save", async () => {
      try {
        await api(`/api/admin/requests/${item.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: select.value })
        });
        showToast("Request status updated.");
        await refreshAdmin();
      } catch (error) {
        showToast(error.message);
      }
    }));

    row.appendChild(actionCell);
    body.appendChild(row);
  });
}

async function loadAdminWorkers() {
  const workers = await api("/api/admin/workers");
  const body = $("#adminWorkers");
  body.replaceChildren();

  workers.forEach(worker => {
    addTableRow(body, [
      worker.id, worker.name, worker.phone,
      worker.service_name || "Unassigned", worker.location,
      "₹" + Number(worker.rate || 0).toLocaleString("en-IN")
    ]);
  });
}

async function loadAdminServices() {
  const services = await api("/api/admin/services");
  const body = $("#adminServices");
  body.replaceChildren();

  services.forEach(service => {
    const row = document.createElement("tr");
    [
      service.id, service.name, service.description,
      service.is_active ? "Yes" : "No"
    ].forEach(value => row.appendChild(makeCell(value)));

    const actionCell = document.createElement("td");
    actionCell.appendChild(makeButton(
      service.is_active ? "Deactivate" : "Activate",
      async () => {
        try {
          await api(`/api/admin/services/${service.id}`, {
            method: "PATCH",
            body: JSON.stringify({ is_active: !service.is_active })
          });
          showToast("Service updated.");
          await refreshAdmin();
          await loadServices();
        } catch (error) {
          showToast(error.message);
        }
      }
    ));

    row.appendChild(actionCell);
    body.appendChild(row);
  });
}

async function loadAdminWages() {
  const wages = await api("/api/admin/wages");
  const body = $("#adminWages");
  body.replaceChildren();

  wages.forEach(wage => {
    addTableRow(body, [
      wage.id,
      `${wage.worker_name} (#${wage.worker_id})`,
      "₹" + Number(wage.amount).toLocaleString("en-IN"),
      wage.entry_type, wage.note, wage.created_at
    ]);
  });
}

async function refreshAdmin() {
  try {
    await Promise.all([
      loadAdminOverview(),
      loadAdminRequests(),
      loadAdminWorkers(),
      loadAdminServices(),
      loadAdminWages()
    ]);
    $("#adminMessage").textContent = "Dashboard data updated.";
  } catch (error) {
    $("#adminMessage").textContent = error.message;
  }
}

$("#adminLoginForm").addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());

  try {
    await api("/api/admin/login", {
      method: "POST",
      body: JSON.stringify(data)
    });
    showAdminDashboard(data.username);
    $("#adminMessage").textContent = "Login successful.";
    await refreshAdmin();
  } catch (error) {
    $("#adminMessage").textContent = error.message;
  }
});

$("#adminLogout").addEventListener("click", async () => {
  try {
    await api("/api/admin/logout", {
      method: "POST",
      body: "{}"
    });
    showAdminLogin();
    $("#adminMessage").textContent = "You have logged out.";
  } catch (error) {
    $("#adminMessage").textContent = error.message;
  }
});

$("#refreshAdmin").addEventListener("click", refreshAdmin);

$("#adminServiceForm").addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form).entries());

  try {
    await api("/api/admin/services", {
      method: "POST",
      body: JSON.stringify(data)
    });
    form.reset();
    showToast("Service added.");
    await refreshAdmin();
    await loadServices();
  } catch (error) {
    showToast(error.message);
  }
});

$("#adminWageForm").addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const raw = Object.fromEntries(new FormData(form).entries());

  try {
    await api("/api/admin/wages", {
      method: "POST",
      body: JSON.stringify({
        ...raw,
        worker_id: Number(raw.worker_id),
        amount: Number(raw.amount)
      })
    });
    form.reset();
    showToast("Wage record saved.");
    await refreshAdmin();
  } catch (error) {
    showToast(error.message);
  }
});

async function checkAdminSession() {
  try {
    const result = await api("/api/admin/me");
    showAdminDashboard(result.username);
    await refreshAdmin();
  } catch {
    showAdminLogin();
  }
}

loadServices();
checkAdminSession();
