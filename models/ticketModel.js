const mongoose = require("mongoose")

const TicketSchema = new mongoose.Schema({
    submittedBy: {
        type: String,
        required: true
    },
    ticketContent: {
        type: String,
        required: true
    },
    ticketReplies:{
        type: Object,
        required: true,
        default: []
    },
    subject: {
        type: String,
        required: true,
        default: "testing"
    },
    closed: {
        type: Boolean,
        required: true,
        default: false
    },
    tid: {
        type: Number,
        required: true,
        default: Math.floor(Math.random() * 10000000000000)
    }
})

module.exports = mongoose.model("Ticket", TicketSchema)