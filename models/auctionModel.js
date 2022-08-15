const mongoose = require("mongoose")

const auctionSchema = new mongoose.Schema({
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
    startingPrice: {
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

    bidders: {
        type: Object,
        required: true,
        default: {}
    },
    end: {
        type: Number,
        required: true
    },
    topBid: {
        type: Number,
        required: true,
        default: 0
    },
    topBidder: {
        type: String,
        required: false
    }
})

module.exports = mongoose.model("Auctions", auctionSchema)