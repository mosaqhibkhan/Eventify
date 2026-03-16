const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({

eventId:{
type:String,
required:true
},

businessName:{
type:String,
required:true
},

offerDetails:{
type:String,
required:true
}

});

module.exports = mongoose.model("Offer",offerSchema);