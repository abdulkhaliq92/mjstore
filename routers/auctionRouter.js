const express = require("express")
const router = express.Router()
const auctionSchema = require("../models/auctionModel")
const jwt = require('jsonwebtoken');
const dotenv = require("dotenv")
dotenv.config()
const jwtSecret = process.env.TOKEN_SECRET

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization;
    console.log("T", token)
    jwt.verify(token, jwtSecret, function(err, decoded) {
        if (err) {
            req.isAllowed = false;
            return res.status(403).json({message: "Invalid authorisation header"})
        }
        console.log(decoded)
        req.isAllowed = true;
        req.username = decoded.username
        req.perms = decoded.permissions
        next()
    })
}
router.post("/createAuction", verifyToken ,async (req, res) => {
    if (req.perms < 2) {
        return res.status(403).json({message: "Must have seller role to do this"})
    }
    if (!req.body.handle || !req.body.platform || !req.body.startingPrice || !req.body.secret ) {
        console.log(req.body)
        return res.status(401).json({message: "Not all data was sent"})
    }

    const newAuction = new auctionSchema({
        handle: req.body.handle,
        platform: req.body.platform,
        info: req.body.info,
        startingPrice: req.body.startingPrice,
        listedBy: "nemo",
        secretInfo: req.body.secret,
        end: req.body.end,
        
    })

    await newAuction.save()

    return res.status(200).json({message: "Auction created"})


})
router.post("/createBid", verifyToken, async (req, res) => {
    console.log("HEADERS", req.headers)
    if (req.perms <1) {
        return res.status(403).json({message: "Must have at least buyer role to create bids"})
    }
    if (!req.body.bid || !req.body.handle || !req.body.platform) {
        console.log(req.body)
        return res.status(401).json({message: "Incomplete data" })
    }
    let auction = await auctionSchema.findOne({handle: req.body.handle, platform: req.body.platform}, "handle platform listedBy bidders end topBid _id")
    console.log(auction._id)
    console.log(auction.topBid)
    const topBidder = {"biddertop": req.username}
    if (req.body.bid < auction.topBid) {
        return res.status(403).json({message: "Bid is lower than current max bid"})
    }

    await auctionSchema.findByIdAndUpdate({_id: auction._id}, {topBid: req.body.bid, topBidder:req.username}, (err, doc) => {
        console.log("w", doc)
        return res.status(200).json({message: "Successful"})
    }).clone().catch(
        function(err) {
            console.log(err)
        }
    )
    




})
router.get("/allAuctions", async (req, res) => {
    auctionSchema.find({}, "handle platform listedBy bidders end topBid ", (err, doc) => {
        if (err) return res.status(500).json({error: err.msg})
        return res.status(200).json({message: "Successful", auctions: doc})

    }).clone().catch(
        function(err) {
            console.log(err)
        }
    )
})

router.post("/topBid", (req, res) => {
    console.log(req.body)
    auctionSchema.find({name: req.body.handle, platform: req.body.platform}, "handle platform end topBid topBidder",(err, doc) => {
        if (err) return res.status(500).json({message: err.msg})
        let bid = 0
        let endtime = 0
        let topBidder = ""
        console.log(doc.bidders)
        for (let i of doc) {
            if (i.handle == req.body.handle && i.platform == req.body.platform) {
                bid = i.topBid
                endtime = i.end
                topBidder = i.topBidder
                
            } else {
                console.log(i.handle)
            }
        }
        
       
        return res.status(200).json({message: "Success", topBid: bid, endTime: endtime, bidders: topBidder})
    }).clone().catch(
        function(err) {
            console.log(err)
        }
    )
})

module.exports = router