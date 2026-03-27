const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");

const Event = require("./models/Event");
const Offer = require("./models/offer");
const User = require("./models/user");

const app = express();

app.use(cors());
app.use(express.json());

/* =============================
   MongoDB Connection
============================= */

const MONGO_URI =
process.env.MONGO_URI ||
"mongodb+srv://eventifyadmin:eventify123@cluster0.uhbp5cg.mongodb.net/eventify?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.log("MongoDB Error:",err));


/* =============================
   TEST ROUTE
============================= */

app.get("/",(req,res)=>{
res.send("Eventify backend running");
});


/* =============================
   ADD EVENT (UPDATED LOGIC)
============================= */

app.post("/add-event", async (req, res) => {

  try {

    const { collegeName, eventName, date, itemsNeeded, submittedBy } = req.body;

    if (!collegeName || !eventName || !date || !submittedBy) {
      return res.status(400).json({
        message: "Missing required fields"
      });
    }

    let event = await Event.findOne({
      collegeName,
      eventName,
      date
    });

    const submission = {
      email: submittedBy,
      submittedAt: new Date()
    };

    // ✅ CREATE NEW EVENT
    if (!event) {

      event = new Event({
        collegeName,
        eventName,
        date,
        itemsNeeded,
        submissions: [submission],
        isValidated: false,
        winners: []
      });

      await event.save();

      return res.json({
        message: "Event submitted successfully"
      });

    }

    // ✅ ADD NEW SUBMISSION
    event.submissions.push(submission);

    // =========================
    //  REWARD LOGIC
    // =========================

    if (!event.isValidated && event.submissions.length >= 3) {

      // remove duplicate users
      const uniqueSubmissions = [];
      const seen = new Set();

      for (let sub of event.submissions) {
        if (!seen.has(sub.email)) {
          seen.add(sub.email);
          uniqueSubmissions.push(sub);
        }
      }

      // sort by time
      uniqueSubmissions.sort(
        (a, b) => new Date(a.submittedAt) - new Date(b.submittedAt)
      );

      const winners = uniqueSubmissions.slice(0, 3);
      const rewards = [50, 30, 10];

      for (let i = 0; i < winners.length; i++) {

        const user = await User.findOne({ email: winners[i].email });

        if (user) {
          user.points += rewards[i];
          await user.save();
        }

      }

      event.winners = winners;
      event.isValidated = true;

    }

    await event.save();

    res.json({
      message: "Event submitted successfully"
    });

  } catch (error) {

    console.error("Add event error:", error);

    res.status(500).json({
      message: "Server error"
    });

  }

});


/* =============================
   ADD OFFER
============================= */

app.post("/add-offer", async (req,res)=>{

try{

const { eventId, businessName, offerDetails } = req.body;

if(!eventId || !businessName || !offerDetails){

return res.status(400).json({
message:"All fields are required"
});

}

const offer = new Offer({
eventId,
businessName,
offerDetails
});

await offer.save();

res.json({
message:"Offer submitted successfully"
});

}
catch(error){

console.error("Offer error:", error);

res.status(500).json({
message:"Server error"
});

}

});


/* =============================
   GET OFFERS FOR EVENT
============================= */

app.get("/offers/:eventId", async (req,res)=>{

try{

const offers = await Offer.find({
eventId:req.params.eventId
});

res.json(offers);

}
catch(error){

console.error("Offer fetch error:",error);

res.status(500).json({
message:"Error fetching offers"
});

}

});


/* =============================
   GET EVENTS
============================= */

app.get("/events", async (req,res)=>{

try{

const events = await Event.find().sort({date:1});

res.json(events);

}
catch(error){

console.error("Events fetch error:",error);

res.status(500).json({
message:"Error fetching events"
});

}

});


/* =============================
   SIGNUP
============================= */

app.post("/signup", async (req,res)=>{

try{

const {email,password,role} = req.body;

if(!email || !password || !role){
return res.status(400).json({
message:"All fields required"
});
}

const existingUser = await User.findOne({email});

if(existingUser){
return res.status(400).json({
message:"User already exists"
});
}

const hashedPassword = await bcrypt.hash(password,10);

const newUser = new User({
email,
password:hashedPassword,
role,
points:0
});

await newUser.save();

res.json({
message:"Signup successful"
});

}
catch(error){

console.error("Signup error:",error);

res.status(500).json({
message:"Server error"
});

}

});


/* =============================
   LOGIN
============================= */

app.post("/login", async (req,res)=>{

try{

const { email, password, role } = req.body;

if(!email || !password || !role){
return res.status(400).json({
message:"All fields required"
});
}

const user = await User.findOne({ email, role });

if(!user){
return res.status(400).json({
message:"User not found or role mismatch"
});
}

const match = await bcrypt.compare(password,user.password);

if(!match){
return res.status(400).json({
message:"Incorrect password"
});
}

res.json({
message:"Login successful",
email:user.email,
role:user.role
});

}
catch(error){

console.error("Login error:",error);

res.status(500).json({
message:"Server error"
});

}

});


/* =============================
   LEADERBOARD (TOP 3)
============================= */

app.get("/leaderboard", async (req,res)=>{

try{

const users = await User.find({role:"student"})
.sort({points:-1})
.limit(3)
.select("email points");

res.json(users);

}
catch(error){

console.error("Leaderboard error:",error);

res.status(500).json({
message:"Error loading leaderboard"
});

}

});


/* =============================
   STUDENT PROFILE
============================= */

app.get("/profile/:email", async (req,res)=>{

try{

const email = req.params.email;

const user = await User.findOne({email});

if(!user){
return res.status(404).json({
message:"User not found"
});
}

const events = await Event.find({
  "submissions.email": email
});

res.json({
email:user.email,
points:user.points,
events:events
});

}
catch(error){

console.error("Profile error:",error);

res.status(500).json({
message:"Error loading profile"
});

}

});


/* =============================
   TRENDING EVENTS
============================= */

app.get("/trending", async (req,res)=>{

try{

const trending = await Offer.aggregate([

{
$group:{
_id:"$eventId",
offersCount:{$sum:1}
}
},

{
$sort:{offersCount:-1}
},

{
$limit:5
}

]);

res.json(trending);

}
catch(error){

console.error("Trending error:",error);

res.status(500).json({
message:"Error loading trending events"
});

}

});


/* =============================
   START SERVER
============================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT,()=>{
console.log(`Server running on port ${PORT}`);
});