// =========================
// CONFIG
// =========================
const API_URL = "https://eventify-backend-1i56.onrender.com";

let allEvents = [];


/* =========================
INDEX PAGE - LOAD EVENTS
========================= */

const eventsList = document.getElementById("eventsList");

if (eventsList) {
    loadEventsForIndex();
    loadTrending();
}

async function loadEventsForIndex() {
    try {
        const response = await fetch(`${API_URL}/events`);
        const events = await response.json();

        allEvents = events;
        displayEvents(events);

    } catch (error) {
        console.error("Error loading events:", error);
    }
}

function displayEvents(events) {
    const container = document.getElementById("eventsList");
    if (!container) return;

    container.innerHTML = "";

    events.forEach(event => {
        const card = document.createElement("div");
        card.className = "eventCard";

        card.innerHTML = `
        <h3>${event.eventName}</h3>
        <p>${event.collegeName}</p>
        <p>${event.date}</p>
        <p>${event.itemsNeeded?.join(", ")}</p>
        <button onclick="viewEvent('${event._id}')">View Offers</button>
        `;

        container.appendChild(card);
    });
}

function viewEvent(id) {
    window.location.href = "event-details.html?id=" + id;
}



/* ========================= LOGIN ========================= */
const studentLoginBtn = document.getElementById("studentLogin");
const businessLoginBtn = document.getElementById("businessLogin");

if (studentLoginBtn) {
  studentLoginBtn.addEventListener("click", function () {
    loginUser("student");
  });
}

if (businessLoginBtn) {
  businessLoginBtn.addEventListener("click", function () {
    loginUser("business");
  });
}

async function loginUser(role) {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    alert("Please fill all fields");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });

    const data = await response.json();
    alert(data.message);

    if (data.message === "Login successful") {
      localStorage.setItem("userEmail", email);
      if (role === "student") {
        window.location.href = "submit-event.html";
      } else {
        window.location.href = "submit-offer.html";
      }
    }
  } catch (error) {
    console.error("Login error:", error);
    alert("Server error. Try again.");
  }
}

/* ========================= SIGNUP WITH AUTO LOGIN (FINAL FIX) ========================= */
const studentSignupBtn = document.getElementById("studentSignup");
const businessSignupBtn = document.getElementById("businessSignup");

if (studentSignupBtn) {
  studentSignupBtn.addEventListener("click", function () {
    signupUser("student");
  });
}

if (businessSignupBtn) {
  businessSignupBtn.addEventListener("click", function () {
    signupUser("business");
  });
}

async function signupUser(role) {
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();

  if (!email || !password) {
    alert("Please fill all fields");
    return;
  }

  try {
    // SIGNUP
    const signupRes = await fetch(`${API_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });

    const signupData = await signupRes.json();

    if (!signupRes.ok) {
      alert(signupData.message);
      return;
    }

    // AUTO LOGIN
    const loginRes = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role }),
    });

    const loginData = await loginRes.json();

    if (loginRes.ok && loginData.message === "Login successful") {
      localStorage.setItem("userEmail", email);
      alert("Signup successful! Logged in.");
      if (role === "student") {
        window.location.href = "submit-event.html";
      } else {
        window.location.href = "submit-offer.html";
      }
    } else {
      alert("Signup done. Please login manually.");
    }
  } catch (error) {
    console.error("Signup error:", error);
    alert("Server error");
  }
}


/* =========================
SUBMIT EVENT
========================= */

const eventForm = document.getElementById("eventForm");

if (eventForm) {

    const email = localStorage.getItem("userEmail");

    if (!email) {
        alert("Please login first");
        window.location.href = "login.html";
    }

    eventForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const eventData = {
            collegeName: document.getElementById("collegeName").value,
            eventName: document.getElementById("eventName").value,
            date: document.getElementById("date").value,
            itemsNeeded: document.getElementById("itemsNeeded").value
                .split(",")
                .map(i => i.trim()),
            submittedBy: email
        };

        try {
            const res = await fetch(`${API_URL}/add-event`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(eventData)
            });

            const data = await res.json();
            alert(data.message);
            eventForm.reset();

        } catch (err) {
            console.error(err);
        }
    });
}


/* =========================
LOAD EVENTS DROPDOWN
========================= */

const eventSelect = document.getElementById("eventSelect");

if (eventSelect) {
    loadEventsForDropdown();
}

async function loadEventsForDropdown() {
    try {
        const res = await fetch(`${API_URL}/events`);
        const events = await res.json();

        eventSelect.innerHTML = `<option value="">Select Event</option>`;

        events.forEach(event => {
            const option = document.createElement("option");
            option.value = event._id;
            option.textContent = `${event.eventName} - ${event.collegeName}`;
            eventSelect.appendChild(option);
        });

    } catch (err) {
        console.error(err);
    }
}


/* =========================
SUBMIT OFFER
========================= */

const offerForm = document.getElementById("offerForm");

if (offerForm) {

    const email = localStorage.getItem("userEmail");

    if (!email) {
        alert("Please login first");
        window.location.href = "login.html";
    }

    offerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const eventId = document.getElementById("eventSelect").value;
        const businessName = document.getElementById("businessName").value;
        const offerDetails = document.getElementById("offerDetails").value;

        if (!eventId || !businessName || !offerDetails) {
            alert("Fill all fields");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/add-offer`, {
                method: "POST",
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify({ eventId, businessName, offerDetails })
            });

            const data = await res.json();
            alert(data.message);
            offerForm.reset();

        } catch (err) {
            console.error(err);
        }
    });
}


/* =========================
EVENT DETAILS PAGE
========================= */

const params = new URLSearchParams(window.location.search);
const eventId = params.get("id");

if (eventId) {
    loadEvent();
    loadOffers();
}

async function loadEvent() {
    const container = document.getElementById("eventInfo");
    if (!container) return;

    const res = await fetch(`${API_URL}/events`);
    const events = await res.json();

    const event = events.find(e => e._id === eventId);

    container.innerHTML = `
    <h2>${event.eventName}</h2>
    <p>${event.collegeName}</p>
    <p>${event.date}</p>
    `;
}

async function loadOffers() {
    const container = document.getElementById("offersList");
    if (!container) return;

    const res = await fetch(`${API_URL}/offers/${eventId}`);
    const offers = await res.json();

    container.innerHTML = "";

    if (!offers.length) {
        container.innerHTML = "<p>No offers yet</p>";
        return;
    }

    offers.forEach(o => {
        const div = document.createElement("div");
        div.className = "eventCard";

        div.innerHTML = `
        <h3>${o.businessName}</h3>
        <p>${o.offerDetails}</p>
        `;

        container.appendChild(div);
    });
}


/* =========================
TRENDING EVENTS
========================= */

async function loadTrending() {

    const container = document.getElementById("trendingEvents");
    if (!container) return;

    const t = await fetch(`${API_URL}/trending`);
    const trending = await t.json();

    const e = await fetch(`${API_URL}/events`);
    const events = await e.json();

    container.innerHTML = "";

    trending.forEach(item => {

        const event = events.find(ev => ev._id === item._id);

        if (!event) return;

        const div = document.createElement("div");
        div.className = "eventCard";

        div.innerHTML = `
        <h3>${event.eventName}</h3>
        <p>${event.collegeName}</p>
        <p>${item.offersCount} offers</p>
        `;

        container.appendChild(div);
    });
}


/* =========================
PROFILE PAGE
========================= */

const profileEmail = localStorage.getItem("userEmail");

const profileDiv = document.getElementById("profileInfo");
const eventsDiv = document.getElementById("myEvents");

async function loadProfile() {

    if (!profileEmail) {
        if (profileDiv) {
            profileDiv.innerHTML = "<p>Please login first</p>";
        }
        return;
    }

    try {

        const response = await fetch(`${API_URL}/profile/${profileEmail}`);
        const data = await response.json();

        if (profileDiv) {
            profileDiv.innerHTML = `
                <h3>${data.email}</h3>
                <p><b>Points:</b> ${data.points}</p>
            `;
        }

        if (!eventsDiv) return;

        eventsDiv.innerHTML = "";

        if (!data.events || data.events.length === 0) {
            eventsDiv.innerHTML = "<p>No events submitted</p>";
            return;
        }

        data.events.forEach(event => {

            const card = document.createElement("div");
            card.className = "eventCard";

            card.innerHTML = `
                <h3>${event.eventName}</h3>
                <p>${event.collegeName}</p>
                <p>${event.date}</p>
            `;

            eventsDiv.appendChild(card);

        });

    } catch (error) {
        console.error("Profile error:", error);
    }
}

loadProfile();

/* =========================
LEADERBOARD (PER EVENT)
========================= */

async function loadLeaderboard() {

    const container = document.getElementById("leaderboardList");
    if (!container) return;

    const res = await fetch(`${API_URL}/event-leaderboard`);
    const events = await res.json();

    container.innerHTML = "";

    events.forEach(event => {

        const div = document.createElement("div");
        div.className = "eventCard";

        let html = "";

        event.leaderboard.forEach(u => {
            html += `<p>${u.position}] ${u.email} (${u.points})</p>`;
        });

        div.innerHTML = `
        <h3>${event.eventName}</h3>
        <p>${event.collegeName}</p>
        ${html}
        `;

        container.appendChild(div);
    });
}

loadLeaderboard();


/* =========================
LOGOUT
========================= */

function logout() {
    localStorage.removeItem("userEmail");
    window.location.href = "login.html";
}