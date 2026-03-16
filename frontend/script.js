// script.js

const API_URL = "https://eventify-backend-1i56.onrender.com";

let allEvents = [];

/* =========================
INDEX PAGE - LOAD EVENTS
========================= */

const eventsList = document.getElementById("eventsList");
const searchInput = document.getElementById("searchInput");

if(eventsList){

loadEventsForIndex();

if(searchInput){

searchInput.addEventListener("input",function(){

const searchValue = this.value.toLowerCase();

const filteredEvents = allEvents.filter(event =>
event.collegeName.toLowerCase().includes(searchValue)
);

displayEvents(filteredEvents);

});

}

}

async function loadEventsForIndex(){

try{

const response = await fetch(`${API_URL}/events`);
const events = await response.json();

allEvents = events;

displayEvents(events);

}catch(error){

console.error("Error loading events:",error);

}

}

function displayEvents(events){

const container = document.getElementById("eventsList");

if(!container) return;

container.innerHTML = "";

events.forEach(event => {

const card = document.createElement("div");
card.className = "eventCard";

card.innerHTML = `
<h3>${event.eventName}</h3>
<p>${event.collegeName}</p>
<p>${event.date}</p>
<p>${event.itemsNeeded}</p>
<button onclick="viewEvent('${event._id}')">View Offers</button>
`;

container.appendChild(card);

});

}

function viewEvent(id){

window.location.href = "event-details.html?id=" + id;

}


/* =========================
VIEW OFFERS
========================= */

async function viewOffers(eventId) {

try{

const response = await fetch(`${API_URL}/offers/${eventId}`);
const offers = await response.json();

const offersDiv = document.getElementById(`offers-${eventId}`);
if (!offersDiv) return;

offersDiv.innerHTML = "";

if (offers.length === 0) {

offersDiv.innerHTML = "<p>No offers yet</p>";
return;

}

offers.forEach(offer => {

const p = document.createElement("p");
p.innerHTML = `<b>${offer.businessName}</b>: ${offer.offerDetails}`;
offersDiv.appendChild(p);

});

}catch(error){

console.error("Error loading offers:", error);

}

}


/* =========================
STUDENT DASHBOARD - SUBMIT EVENT
========================= */

const eventForm = document.getElementById("eventForm");

if(eventForm){

const email = localStorage.getItem("userEmail");

if(!email){
alert("Please login first");
window.location.href = "login.html";
}

eventForm.addEventListener("submit",async function(e){

e.preventDefault();

const eventData = {

collegeName: document.getElementById("collegeName").value,
eventName: document.getElementById("eventName").value,
date: document.getElementById("date").value,
itemsNeeded: document.getElementById("itemsNeeded").value.split(","),
submittedBy: email

};

try{

const response = await fetch(`${API_URL}/add-event`,{

method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify(eventData)

});

const data = await response.json();

alert(data.message);

eventForm.reset();

}catch(error){

console.error("Error submitting event:",error);

}

});

}


/* =========================
LOAD EVENTS INTO DROPDOWN
========================= */

const eventSelect = document.getElementById("eventSelect");

if(eventSelect){
loadEventsForDropdown();
}

async function loadEventsForDropdown(){

try{

const response = await fetch(`${API_URL}/events`);
const events = await response.json();

events.forEach(event => {

const option = document.createElement("option");

option.value = event._id;
option.textContent = event.eventName + " - " + event.collegeName;

eventSelect.appendChild(option);

});

}catch(error){
console.error(error);
}

}


/* =========================
SUBMIT OFFER
========================= */

const offerForm = document.getElementById("offerForm");

if(offerForm){

const email = localStorage.getItem("userEmail");

if(!email){
alert("Please login first");
window.location.href = "login.html";
}

offerForm.addEventListener("submit", async function(e){

e.preventDefault();

const eventId = document.getElementById("eventSelect").value;
const businessName = document.getElementById("businessName").value;
const offerDetails = document.getElementById("offerDetails").value;

const response = await fetch(`${API_URL}/add-offer`,{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
eventId,
businessName,
offerDetails
})

});

const data = await response.json();

alert(data.message);

offerForm.reset();

});

}


/* =========================
TRENDING EVENTS
========================= */

async function loadTrending(){

try{

const response = await fetch(`${API_URL}/trending`);
const trending = await response.json();

const container = document.getElementById("trendingEvents");

if(!container) return;

container.innerHTML = "";

for(const item of trending){

const eventRes = await fetch(`${API_URL}/events`);
const events = await eventRes.json();

const event = events.find(e => e._id === item._id);

if(event){

const div = document.createElement("div");

div.innerHTML = `
<h3>${event.eventName}</h3>
<p>${event.collegeName}</p>
<p>${item.offersCount} offers</p>
`;

container.appendChild(div);

}

}

}catch(error){

console.error("Error loading trending:",error);

}

}

loadTrending();


/* =========================
LEADERBOARD
========================= */

async function loadLeaderboard(){

const container = document.getElementById("leaderboardList");
if(!container) return;

const response = await fetch(`${API_URL}/leaderboard`);

const users = await response.json();

container.innerHTML = "";

users.forEach((user,index)=>{

const div = document.createElement("div");

div.className = "leaderboardCard";

div.innerHTML = `
<h3>#${index+1}</h3>
<p>${user.email}</p>
<p>${user.points} points</p>
`;

container.appendChild(div);

});

}

loadLeaderboard();


/* =========================
EVENT DETAIL PAGE
========================= */

const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get("id");

async function loadEvent() {

const container = document.getElementById("eventInfo");
if(!container) return;

try {

const response = await fetch(`${API_URL}/events`);
const events = await response.json();
const event = events.find(e => e._id === eventId);

if (!event) {
container.innerHTML = "<p>Event not found.</p>";
return;
}

container.innerHTML = `
<div class="eventCard">
<h2>${event.eventName}</h2>
<p><b>College:</b> ${event.collegeName}</p>
<p><b>Date:</b> ${event.date}</p>
<p><b>Items Needed:</b> ${event.itemsNeeded.join(", ")}</p>
<p><b>Submitted By:</b> ${event.submittedBy}</p>
</div>
`;

}catch(error){

console.error("Error loading event:", error);

}

}

async function loadOffers() {

const container = document.getElementById("offersList");
if(!container) return;

try {

const response = await fetch(`${API_URL}/offers/${eventId}`);
const offers = await response.json();

container.innerHTML = "";

if (offers.length === 0) {
container.innerHTML = "<p>No offers submitted yet.</p>";
return;
}

offers.forEach(offer => {

const div = document.createElement("div");
div.className = "eventCard";

div.innerHTML = `
<h3>${offer.businessName}</h3>
<p>${offer.offerDetails}</p>
`;

container.appendChild(div);

});

}catch(error){

console.error("Error loading offers:", error);

}

}

loadEvent();
loadOffers();


/* =========================
LOGIN
========================= */

const studentLoginBtn = document.getElementById("studentLogin");
const businessLoginBtn = document.getElementById("businessLogin");

if(studentLoginBtn){
studentLoginBtn.addEventListener("click",function(){
loginUser("student");
});
}

if(businessLoginBtn){
businessLoginBtn.addEventListener("click",function(){
loginUser("business");
});
}

async function loginUser(role){

const email = document.getElementById("loginEmail").value;
const password = document.getElementById("loginPassword").value;

const response = await fetch(`${API_URL}/login`,{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({email,password,role})
});

const data = await response.json();

alert(data.message);

if(data.message==="Login successful"){
localStorage.setItem("userEmail",email);

if(role==="student"){
window.location.href="submit-event.html";
}else{
window.location.href="submit-offer.html";
}

}

}


/* =========================
SIGNUP
========================= */

const studentSignupBtn = document.getElementById("studentSignup");
const businessSignupBtn = document.getElementById("businessSignup");

if(studentSignupBtn){
studentSignupBtn.addEventListener("click",function(){
signupUser("student");
});
}

if(businessSignupBtn){
businessSignupBtn.addEventListener("click",function(){
signupUser("business");
});
}

async function signupUser(role){

const email = document.getElementById("signupEmail").value;
const password = document.getElementById("signupPassword").value;

const response = await fetch(`${API_URL}/signup`,{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({email,password,role})
});

const data = await response.json();

alert(data.message);

if(data.message==="User created successfully"){
window.location.href="login.html";
}

}


/* =========================
LOGOUT
========================= */

function logout() {
localStorage.removeItem("userEmail");
window.location.href = "login.html";
}