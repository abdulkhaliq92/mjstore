const mongoose = require("mongoose")

const checkoutSchema = new mongoose.Schema({
    checkoutId: {
        type: String,
        required: true
    },
    emailUsed: {
        type: String,
        required: false
    },
    payed: {
        type: Boolean,
        required: true,
        default: false
    },
    username: {
        type: String,
        required: true
    },
    platform: {
        type: String,
        required: true
    }, 
    expired: {
        type: Boolean,
        required: true,
        default: false
    }
})

module.exports = mongoose.model("checkout", checkoutSchema)