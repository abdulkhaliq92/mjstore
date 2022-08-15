const mongoose = require("mongoose")

const chargeSchema = new mongoose.Schema({
    chargeId : {
        type: String,
        required: true
    },
    expired: {
        type: Boolean,
        required: true,
        default: false
    },
    amount: {
        type: Number,
        required: true
    },
    payed: {
        type: Boolean,
        required: true,
        default: false
    },
    payedBy: {
        type: String,
        required: false
    },
    initialisedBy: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    platform: {
        type: String,
        required: true
    },
    mode: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model("Charge", chargeSchema)