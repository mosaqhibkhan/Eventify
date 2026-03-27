// =========================
// CONFIG
// =========================

const API_URL = "https://eventify-backend-1i56.onrender.com";

let allEvents = [];


/* =========================
INDEX PAGE - LOAD EVENTS
========================= */

const eventsList = document.getElementById("eventsList");
const searchInput = document.getElementById("searchInput");

if (eventsList) {
    loadEventsForIndex();

    if (searchInput) {
        searchInput.addEventListener("input", function () {

            const searchValue = this.value.toLowerCase();

            const filteredEvents = allEvents.filter(event =>
                event.collegeName.toLowerCase().includes(searchValue)
            );

            displayEvents(filteredEvents);

        });
    }
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
        <p>${Array.isArray(event.itemsNeeded) ? event.itemsNeeded.join(", ") : event.itemsNeeded}</p>
        <button onclick="viewEvent('${event._id}')">View Offers</button>
        `;

        container.appendChild(card);

    });

}

function viewEvent(id) {
    window.location.href = "event-details.html?id=" + id;
}


/* =========================
STUDENT DASHBOARD - SUBMIT EVENT
========================= */

const eventForm = document.getElementById("eventForm");

if (eventForm) {

    const email = localStorage.getItem("userEmail");

    if (!email) {
        alert("Please login first");
        window.location.href = "login.html";
    }

    eventForm.addEventListener("submit", async function (e) {

        e.preventDefault();

        const eventData = {

            collegeName: document.getElementById("collegeName").value,
            eventName: document.getElementById("eventName").value,
            date: document.getElementById("date").value,
            itemsNeeded: document.getElementById("itemsNeeded").value
                .split(",")
                .map(item => item.trim()),
            submittedBy: email

        };

        try {

            const response = await fetch(`${API_URL}/add-event`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(eventData)
            });

            const data = await response.json();

            alert(data.message);

            eventForm.reset();

        } catch (error) {
            console.error("Error submitting event:", error);
        }

    });

}


/* =========================
LOGIN
========================= */

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
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password,
                role
            })
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


/* =========================
SIGNUP WITH AUTO LOGIN (FINAL FIX)
========================= */

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
            body: JSON.stringify({ email, password, role })
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
            body: JSON.stringify({ email, password, role })
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
PROFILE PAGE
========================= */

const profileEmail = localStorage.getItem("userEmail");

const profileDiv = document.getElementById("profileInfo");
const eventsDiv = document.getElementById("myEvents");

async function loadProfile() {

    if (!profileEmail) {
        profileDiv.innerHTML = "<p>Please login first</p>";
        return;
    }

    try {

        const response = await fetch(`${API_URL}/profile/${profileEmail}`);
        const data = await response.json();

        profileDiv.innerHTML = `
        <h3>${data.email}</h3>
        <p><b>Points:</b> ${data.points}</p>
        `;

        eventsDiv.innerHTML = "";

        if (data.events.length === 0) {
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
        console.error(error);
    }

}

loadProfile();

/* =========================
Leader Board
========================= */

async function loadLeaderboard() {

    const container = document.getElementById("leaderboardList");
    if (!container) return;

    try {

        const response = await fetch(`${API_URL}/event-leaderboard`);
        const events = await response.json();

        container.innerHTML = "";

        events.forEach(event => {

            const div = document.createElement("div");
            div.className = "eventCard";

            let leaderboardHTML = "";

            event.leaderboard.forEach(user => {

                const medal =
                    user.position === 1 ? "🥇" :
                    user.position === 2 ? "🥈" :
                    user.position === 3 ? "🥉" : "";

                leaderboardHTML += `
                    <p>${medal} ${user.email} (${user.points} pts)</p>
                `;
            });

            div.innerHTML = `
                <h3>${event.eventName}</h3>
                <p>${event.collegeName}</p>
                ${leaderboardHTML}
            `;

            container.appendChild(div);

        });

    } catch (error) {
        console.error(error);
    }

}

loadLeaderboard();

/* =========================
LOGOUT
========================= */

function logout() {
    localStorage.removeItem("userEmail");
    window.location.href = "login.html";
}