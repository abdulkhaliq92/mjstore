const express = require("express");
const { JsonWebTokenError } = require("jsonwebtoken");
const router = express.Router()
const jwt = require('jsonwebtoken');
const dotenv = require("dotenv")
const userModel = require("../models/userModel")
const crypto = require('crypto')
const accessModel = require("../models/accessModel")
dotenv.config()

const jwtSecret = process.env.TOKEN_SECRET
const passwordSalt = process.env.PASSWORD_SALT
const verifyAdmin = (req, res, next) => {
    const token = req.headers.authorization;
    jwt.verify(token, jwtSecret, function(err, decoded) {
        if (err) {
            req.isAdmin = false;
            return res.status(403).json({message: "Invalid authorisation header"})

        }
        console.log(decoded)
        if (!decoded.permissions > 2) {
            return res.status(403).json({message: "User is not admin"})
        }
        next()
    })
}

router.get("/isAdmin", verifyAdmin, (req, res) => {
    if (req.isAdmin) {
        return res.status(200).json({message: "User is admin"})
    } else {
        return res.status(403).json({message: "User is not admin"})
    }
})
// route to make admin, for testing
router.post("/createAdmin", async (req, res) => {

    if (req.body.auth=="8f5c292bfe689435079567d08f340cfed750a2e01617563fbb734d0afa042b7879686cb9c701ab660a8471e436e3366486f5b28f1ff71dae7060cd70923d9d3c") {
        
        let username = req.body.user
        let email = req.body.email
        let password = req.body.pass
        console.log(password)
        let hashedPword = crypto.createHash('md5').update(passwordSalt + password).digest("hex");
        const newUser = new userModel({
            username: username,
            email: email,
            password: hashedPword,
            permissions: 3
        })
        await newUser.save()
        res.status(200).json({message: "Admin account created", user: newUser})
    } else {
        res.status(403).json({message:"Invalid auth token"})
    }
})

router.post("/banUser", async (req, res) => {
    if (!(req.body.userToBan)) {
        return res.status(401).json({message: "User to ban not stated"})
    }
    try {
        var query = {username: req.body.userToBan}
        var updated = {permissions: -1}
        userModel.findOneAndUpdate(query, updated, function(err, doc) {
            if (err) return res.status(500).json({message: err.message})
            if (doc === null) {
                return res.status(404).json({message: "User not found"})

            }
            return res.status(200).json({message: "User succesfully banned"})
        })
    } catch(err) {
        return res.status(500).json({message: err.message})
    }
})



router.get("/allUsers", async (req, res) => {
    try {
        let users = await userModel.find()
        res.status(200).json({message: "Success", users: users})
    } catch(err) {
        res.status(200).json({err: err.message})
    }
})

router.post("/privateCode", verifyAdmin, async (req, res) => {
    if (!req.body.user) {
        return res.status(401).json({message: "Please submit user to grant this to"})
    }
    try {
        const newAccess = new accessModel({
            userGranted: req.body.user,
            timeExpire: req.body.time ? req.body.time : 0
        })
        await newAccess.save()
        return res.status(200).json({message: "Success", accessCode: newAccess.accessCode})
    } catch(e) {
        return res.status(500).json({error: e.message})
    }
})

router.post("/promote", verifyAdmin, async (req, res) => {
    if (req.perms < 3 ) {
        return res.status(403).json({message: "Cannot do this"})
    }

    if (!req.body.username) {
        return res.status(401).json({message: "Please specify user to promote"})
    }

    const currUser = await userModel.findOne({username: req.body.username})
    console.log("USER", currUser)
    let currentPerm = currUser.permissions

    if (currentPerm == 3) {
        return res.status(401).json({message: "User is already max level"})
    }

    await userModel.findByIdAndUpdate(currUser._id, {permissions: currentPerm+1})
    return res.status(200).json({message: "Success"})




})
module.exports = router