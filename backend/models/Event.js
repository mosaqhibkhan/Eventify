const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
  collegeName: String,
  eventName: String,
  date: String,
  itemsNeeded: [String],
  submissions: [
    {
      email: String
    }
  ]
});

module.exports = mongoose.model("Event", EventSchema);