const mongoose = require("mongoose")

const handleSchema = new mongoose.Schema({
    handle: {
        type: String,
        required: true
    },
    platform: {
        type: String,
        required: true
    },
    isPrivate: {
        type: Boolean,
        required: true,
        default: false
    },
    info: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required:true
    },
    sold: {
        type: Boolean,
        required: true,
        default: false
    },
    listedBy: {
        type: String,
        required: true
    },
    secretInfo: {
        type: String,
        required: true
    },
    isOg: {
        type: Boolean,
        required: true, 
        default: false
    },
    isRepeater: {
        type: Boolean,
        required: true, 
        default: false
    }, 
    isSemi3: {
        type: Boolean,
        required: true,
        default: false
    },
    isPronouncable: {
        type: Boolean,
        required: true,
        default: false 
    }
})

module.exports = mongoose.model("Handle", handleSchema)