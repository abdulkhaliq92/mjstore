const express = require("express")
const jwt = require('jsonwebtoken');

var coinbase = require("coinbase-commerce-node")
var Client = coinbase.Client;
const router = express.Router()
const dotenv = require("dotenv")
const chargeModel = require("../models/chargeModel")
const auctionModel = require("../models/auctionModel")
const handleSchema = require("../models/handleModel")
const userModel = require("../models/userModel")
const checkoutModel = require("../models/checkoutModel")
var clientObj = Client.init(process.env.COINBASE_KEY)
dotenv.config()
clientObj.setRequestTimeout(3000)
var Checkout = coinbase.resources.Checkout;
var Charge = coinbase.resources.Charge
var Event = coinbase.resources.Event;
const jwtSecret = process.env.TOKEN_SECRET

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization;
    console.log(token)
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

router.post("/createCheckout", async (req, res) => {
    if (!req.body.name || !req.body.desc || !req.body.price ) {
        return res.status(401).json({message: "Please make sure you send all details"})
    }
    let handle = await handleSchema.findOne({handle: req.body.name, platform: req.body.platform})
    var checkoutObj   = new Checkout()
    console.log("PRICE ", handle.price)
    checkoutObj.name = req.body.name
    checkoutObj.description = handle.info
    checkoutObj.pricing_type = "fixed_price"
    checkoutObj.local_price = {
        "amount":`${handle.price}`,
        "currency":"USD"
    }
    checkoutObj.requested_info = ['email'];
    checkoutObj.save(async function (error, response) {
        console.log(error)
        if (error) return res.status(500).json({message: error})
        console.log(response)
        const checkoutToPush = new checkoutModel({checkoutId: response.id, username: req.body.name, platform: req.body.platform})
        await checkoutToPush.save()
        return res.status(200).json({message: response, link: `https://commerce.coinbase.com/checkout/${response.id}`, code: response.id})
    })
})
router.post("/createCharge", verifyToken ,async (req, res) => {
    if (!req.headers.authorization) {
        return res.status(403).json({message: "No auth token set"})
    }
    if (!req.body.handle || !req.body.platform ) {
        return res.status(401).json({message: "Please make sure you send all details"})
    }
    var chargeObj  = new Charge()
    await handleSchema.findOne({handle: req.body.handle, platform: req.body.platform}, "handle platform info price",async (err, resp) => {
        if (err) return res.status(500).json({err: err.msg})
        let userReq = await userModel.findOne({username: req.username})
        console.log(resp)
        chargeObj.name = `@${resp.handle} on ${resp.platform}`
        chargeObj.description = resp.info
        chargeObj.pricing_type = "fixed_price"
        chargeObj.local_price = {
            "amount":`${resp.price}`,
            "currency":"USD"
        }
        chargeObj.requested_info = ['email'];
        
        chargeObj.save(async function (error, response) {
            if (error) {console.log(error);return res.status(500).json({message: error})}
            
            const newCharge = new chargeModel({
                chargeId: response.code,
                amount: resp.price,
                initialisedBy: userReq.email,
                platform: resp.platform,
                username: resp.handle,
                mode: "market"
            })
        await newCharge.save()
        return res.status(200).json({message: "Success", link: response.hosted_url, code: response.code})
    })
    }).clone().catch(
        function(err) {
            console.log(err)
        }
    )
    
})

router.post("/createCheckout", async (req, res) => {
    if (!req.body.name || !req.body.desc || !req.body.price ) {
        return res.status(401).json({message: "Please make sure you send all details"})
    }
    let handle = await handleSchema.findOne({handle: req.body.name, platform: req.body.platform})
    var checkoutObj   = new Checkout()
    console.log("PRICE ", handle.price)
    checkoutObj.name = req.body.name
    checkoutObj.description = handle.info
    checkoutObj.pricing_type = "fixed_price"
    checkoutObj.local_price = {
        "amount":`${handle.price}`,
        "currency":"USD"
    }
    checkoutObj.requested_info = ['email'];
    checkoutObj.save(async function (error, response) {
        console.log(error)
        if (error) return res.status(500).json({message: error})
        console.log(response)
        const checkoutToPush = new checkoutModel({checkoutId: response.id, username: req.body.name, platform: req.body.platform})
        await checkoutToPush.save()
        return res.status(200).json({message: response, link: `https://commerce.coinbase.com/checkout/${response.id}`, code: response.id})
    })
})
router.post("/createChargeAuc", verifyToken ,async (req, res) => {
    if (!req.headers.authorization) {
        return res.status(403).json({message: "No auth token set"})
    }
    if (!req.body.handle || !req.body.platform ) {
        return res.status(401).json({message: "Please make sure you send all details"})
    }
    var chargeObj  = new Charge()
    await auctionModel.findOne({handle: req.body.handle, platform: req.body.platform}, "handle platform info topBid",async (err, resp) => {
        if (err) return res.status(500).json({err: err.msg})
        console.log(resp)
        let userReq = await userModel.findOne({username: req.username})
        console.log(resp)
        chargeObj.name = `@${resp.handle} on ${resp.platform}`
        chargeObj.description = resp.info
        chargeObj.pricing_type = "fixed_price"
        chargeObj.local_price = {
            "amount":`${resp.topBid}`,
            "currency":"USD"
        }
        chargeObj.requested_info = ['email'];
        
        chargeObj.save(async function (error, response) {
            if (error) {console.log(error);return res.status(500).json({message: error})}
            
            const newCharge = new chargeModel({
                chargeId: response.code,
                amount: resp.topBid,
                initialisedBy: userReq.email,
                platform: resp.platform,
                username: resp.handle,
                mode: "auction"
            })
        await newCharge.save()
        return res.status(200).json({message: "Success", link: response.hosted_url, code: response.code})
    })
    }).clone().catch(
        function(err) {
            console.log(err)
        }
    )
    
})

router.get("/allCharges", async (req, res) => {
    let charges = await chargeModel.find()
    return res.status(200).json({message: "Ok", charges: charges})
})

router.get("/allCheckouts", async (req, res)=> {
    let checkouts = await checkoutModel.find()
    return res.status(200).json({message: "ok", checkouts: checkouts})
})
module.exports = router;