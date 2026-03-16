const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema({
    collegeName: String,
    eventName: String,
    date: String,
    itemsNeeded: [String],
    submittedBy: String
});

EventSchema.index(
{collegeName:1,eventName:1,date:1},
{unique:true}
);

module.exports = mongoose.model("Event", EventSchema);

