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

    // 🔍 Check if event already exists
    let event = await Event.findOne({
      collegeName,
      eventName,
      date
    });

    // ✅ IF EVENT DOES NOT EXIST → CREATE
    if (!event) {
      event = new Event({
        collegeName,
        eventName,
        date,
        itemsNeeded,
        submissions: [{ email: submittedBy }]
      });

      await event.save();

      // reward first person
      await User.findOneAndUpdate(
        { email: submittedBy },
        { $inc: { points: 50 } }
      );

      return res.json({
        message: "Event submitted! You are FIRST reporter (50 points)"
      });
    }

    // ✅ EVENT EXISTS → CHECK IF USER ALREADY SUBMITTED
    const alreadySubmitted = event.submissions.find(
      s => s.email === submittedBy
    );

    if (alreadySubmitted) {
      return res.json({
        message: "You already submitted this event"
      });
    }

    // ✅ ADD NEW SUBMISSION
    event.submissions.push({ email: submittedBy });

    await event.save();

    // 🏆 REWARD TOP 3
    const position = event.submissions.length;

    let reward = 0;

    if (position === 2) reward = 30;
    else if (position === 3) reward = 20;

    if (reward > 0) {
      await User.findOneAndUpdate(
        { email: submittedBy },
        { $inc: { points: reward } }
      );
    }

    return res.json({
      message: `Event already exists. You are #${position} reporter`
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
   EVENT-WISE LEADERBOARD
============================= */

app.get("/event-leaderboard", async (req, res) => {

  try {

    const events = await Event.find();

    const result = [];

    for (let event of events) {

      const top3 = event.submissions.slice(0, 3);

      const leaderboard = [];

      for (let i = 0; i < top3.length; i++) {

        const user = await User.findOne({ email: top3[i].email });

        leaderboard.push({
          position: i + 1,
          email: top3[i].email,
          points: user?.points || 0
        });

      }

      result.push({
        eventName: event.eventName,
        collegeName: event.collegeName,
        leaderboard
      });

    }

    res.json(result);

  } catch (error) {
    console.error("Event leaderboard error:", error);
    res.status(500).json({
      message: "Error loading event leaderboard"
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