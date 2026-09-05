const shops = [

    {
        id: 1,
        name: "FixPoint Electronics",
        category: "Phone",
        icon: "📱",
        rating: 4.9,
        distance: 0.8,
        time: "30–60 min",
        open: true,
        today: true,
        top: true,
        fast: true,
        services:
            "Screen • Battery • Charging",
        x: 24,
        y: 31
    },


    {
        id: 2,
        name: "ByteCare Laptop Lab",
        category: "Laptop",
        icon: "💻",
        rating: 4.8,
        distance: 1.4,
        time: "1–2 hrs",
        open: true,
        today: true,
        top: true,
        fast: false,
        services:
            "OS • Keyboard • Hardware",
        x: 66,
        y: 24
    },


    {
        id: 3,
        name: "City Appliance Works",
        category: "Appliance",
        icon: "🔌",
        rating: 4.6,
        distance: 2.1,
        time: "Same day",
        open: false,
        today: true,
        top: false,
        fast: false,
        services:
            "Fan • Mixer • Washing Machine",
        x: 76,
        y: 62
    },


    {
        id: 4,
        name: "QuickWheel Garage",
        category: "Bike",
        icon: "🏍️",
        rating: 4.7,
        distance: 1.1,
        time: "20–40 min",
        open: true,
        today: true,
        top: true,
        fast: true,
        services:
            "Brakes • Tyres • Chain",
        x: 34,
        y: 70
    },


    {
        id: 5,
        name: "TimeCraft Watch Repair",
        category: "Watch",
        icon: "⌚",
        rating: 4.5,
        distance: 2.7,
        time: "1 day",
        open: true,
        today: false,
        top: false,
        fast: false,
        services:
            "Battery • Strap • Movement",
        x: 81,
        y: 40
    },


    {
        id: 6,
        name: "SoleRevive",
        category: "Shoe",
        icon: "👟",
        rating: 4.4,
        distance: 1.9,
        time: "2–4 hrs",
        open: false,
        today: true,
        top: false,
        fast: false,
        services:
            "Sole • Stitching • Cleaning",
        x: 48,
        y: 80
    }

];


let activeFilter = "all";

let selectedShop = null;


/* SELECTORS */

const shopList =
    document.getElementById("shopList");

const mapPins =
    document.getElementById("mapPins");

const search =
    document.getElementById("search");

const category =
    document.getElementById("category");

const availability =
    document.getElementById("availability");


/* ESCAPE */

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, char => {

        const entities = {

            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"

        };

        return entities[char];

    });

}


/* RENDER */

function renderShops() {

    const query =
        search.value.trim().toLowerCase();

    const selectedCategory =
        category.value;

    const selectedAvailability =
        availability.value;


    let results = shops.filter(shop => {

        const matchesSearch =
            !query ||

            `${shop.name}
             ${shop.category}
             ${shop.services}`
                .toLowerCase()
                .includes(query);


        const matchesCategory =
            selectedCategory === "all" ||
            shop.category === selectedCategory;


        const matchesAvailability =
            selectedAvailability === "all" ||

            (
                selectedAvailability === "open" &&
                shop.open
            ) ||

            (
                selectedAvailability === "today" &&
                shop.today
            );


        return (
            matchesSearch &&
            matchesCategory &&
            matchesAvailability
        );

    });


    /* FILTER BUTTON */

    if (activeFilter === "top") {

        results =
            results.filter(shop => shop.top);

    }


    if (activeFilter === "fast") {

        results =
            results.filter(shop => shop.fast);

    }


    if (activeFilter === "open") {

        results =
            results.filter(shop => shop.open);

    }


    document.getElementById("resultCount")
        .textContent =
        `${results.length} result${results.length !== 1 ? "s" : ""}`;


    /* EMPTY */

    if (results.length === 0) {

        shopList.innerHTML = `

            <div class="shop">

                <div class="shop-icon">
                    🔎
                </div>

                <div>

                    <h3>
                        No matching shops
                    </h3>

                    <p>
                        Try another search or filter.
                    </p>

                </div>

            </div>

        `;

    } else {

        shopList.innerHTML =
            results.map((shop, index) => {

                return `

                <article
                    class="shop"
                    style="
                        animation-delay:
                        ${index * 0.05}s
                    "
                >

                    <div class="shop-icon">
                        ${shop.icon}
                    </div>


                    <div>

                        <h3>
                            ${escapeHTML(shop.name)}
                        </h3>

                        <p>
                            ${escapeHTML(shop.category)}
                            •
                            ${shop.distance} km away
                        </p>


                        <div class="badges">

                            <span class="badge rating">
                                ★ ${shop.rating}
                            </span>


                            <span class="badge">
                                ${escapeHTML(shop.time)}
                            </span>


                            <span
                                class="badge
                                ${shop.open ? "available" : ""}"
                            >

                                ${shop.open
                                    ? "Open now"
                                    : "Closed"}

                                ${
                                    shop.today &&
                                    !shop.open
                                    ? " • Available today"
                                    : ""
                                }

                            </span>

                        </div>


                        <p>
                            ${escapeHTML(shop.services)}
                        </p>

                    </div>


                    <button
                        class="book-btn"
                        data-shop="${shop.id}"
                    >

                        Request Repair

                    </button>

                </article>

                `;

            }).join("");

    }


    renderPins(results);

}


/* MAP PINS */

function renderPins(results) {

    mapPins.innerHTML =
        results.map(shop => {

            return `

                <button
                    class="pin"
                    title="${escapeHTML(shop.name)}"
                    data-pin="${shop.id}"
                    style="
                        left:${shop.x}%;
                        top:${shop.y}%;
                    "
                ></button>

            `;

        }).join("");

}


/* SEARCH */

document.getElementById("searchBtn")
    .addEventListener("click", function() {

        const error =
            document.getElementById("searchError");


        if (
            search.value.trim().length === 1
        ) {

            error.textContent =
                "Enter at least 2 characters.";

            return;

        }


        error.textContent = "";

        renderShops();

        document
            .getElementById("shops")
            .scrollIntoView({
                behavior: "smooth"
            });

    });


/* LIVE SEARCH */

search.addEventListener(
    "input",
    renderShops
);

category.addEventListener(
    "change",
    renderShops
);

availability.addEventListener(
    "change",
    renderShops
);


/* FILTERS */

document
    .querySelector(".filters")
    .addEventListener("click", function(event) {

        const button =
            event.target.closest(".filter");


        if (!button) {
            return;
        }


        document
            .querySelectorAll(".filter")
            .forEach(btn =>
                btn.classList.remove("active")
            );


        button.classList.add("active");


        activeFilter =
            button.dataset.filter;


        renderShops();

    });


/* OPEN BOOKING */

shopList.addEventListener(
    "click",
    function(event) {

        const button =
            event.target.closest(".book-btn");


        if (!button) {
            return;
        }


        const id =
            Number(button.dataset.shop);


        selectedShop =
            shops.find(shop => shop.id === id);


        openModal();

    }
);


/* MAP BOOKING */

mapPins.addEventListener(
    "click",
    function(event) {

        const pin =
            event.target.closest(".pin");


        if (!pin) {
            return;
        }


        const id =
            Number(pin.dataset.pin);


        selectedShop =
            shops.find(shop => shop.id === id);


        openModal();

    }
);


/* MODAL */

const modal =
    document.getElementById("modal");


function openModal() {

    document.getElementById("modalTitle")
        .textContent =
        `Request repair at
        ${selectedShop.name}`;


    modal.classList.add("show");

    document
        .getElementById("customerName")
        .focus();

}


function closeModal() {

    modal.classList.remove("show");

    document
        .getElementById("bookingForm")
        .reset();

    document
        .getElementById("bookingError")
        .textContent = "";

}


/* CLOSE */

document
    .getElementById("closeModal")
    .addEventListener(
        "click",
        closeModal
    );


modal.addEventListener(
    "click",
    function(event) {

        if (event.target === modal) {

            closeModal();

        }

    }
);


/* ESCAPE KEY */

document.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Escape") {

            closeModal();

        }

    }
);


/* BOOKING VALIDATION */

document
    .getElementById("bookingForm")
    .addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const name =
                document
                    .getElementById("customerName")
                    .value
                    .trim();


            const issue =
                document
                    .getElementById("issue")
                    .value
                    .trim();


            const time =
                document
                    .getElementById("time")
                    .value;


            const error =
                document
                    .getElementById("bookingError");


            if (name.length < 2) {

                error.textContent =
                    "Please enter your name.";

                return;

            }


            if (issue.length < 10) {

                error.textContent =
                    "Describe the repair using at least 10 characters.";

                return;

            }


            if (!time) {

                error.textContent =
                    "Please select a preferred time.";

                return;

            }


            /* LOCAL STORAGE */

            const requests =
                JSON.parse(
                    localStorage.getItem(
                        "fixNearRequests"
                    )
                ) || [];


            requests.push({

                shop:
                    selectedShop.name,

                customer:
                    name,

                issue:
                    issue,

                time:
                    time,

                createdAt:
                    new Date().toISOString()

            });


            localStorage.setItem(
                "fixNearRequests",
                JSON.stringify(requests)
            );


            error.style.color =
                "#62e3a4";


            error.textContent =
                "Repair request saved successfully!";


            setTimeout(
                closeModal,
                1200
            );

        }
    );


/* THEME */

document
    .getElementById("themeBtn")
    .addEventListener(
        "click",
        function() {

            document.body.classList.toggle(
                "light"
            );

        }
    );


/* START */

renderShops();