const express = require("express")
const router = express.Router()
const dotenv = require("dotenv")
const crypto = require('crypto')
const userModel = require("../models/userModel")
var sanitize = require('mongo-sanitize');
const jwt = require('jsonwebtoken');
const { createBrotliCompress } = require("zlib")

dotenv.config()
const passwordSalt = process.env.PASSWORD_SALT
const jwtSecret = process.env.TOKEN_SECRET


function generateAccessToken(username, permLevel) {
    return jwt.sign({username, permLevel}, jwtSecret, { expiresIn: "7d" });
  }

function validateEmail(email) {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
}


function validatePassword(password) {
    let strongPassword = new RegExp('(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])(?=.{8,})')
    if (strongPassword.test(password)) {
        return true;
    } else {
        return false;
    }
}

async function isUnique(username, callback) {
    await userModel.find({username: username}, "id", (err, res) => {
        if (err)  console.log(err)
        else console.log(res.length)
       
        
    }).clone().catch(
        function(err) {
            console.log(err)
        }
    )
}

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



router.post("/newPassword", (req, res) => {
    let pword = req.body.password
    let hash = crypto.createHash('md5').update(passwordSalt + pword).digest("hex")
    res.status(200).json({password: hash})

})

router.post("/register", async (req, res) => {
    let username = sanitize(req.body.user)
    let email = sanitize(req.body.email)
    let password = sanitize(req.body.pass)
    console.log(username, email, password)
    console.log(`Is password strong? : ${validatePassword(password)}`)
    if (typeof(username) == "undefined" || typeof(email) == "undefined" || typeof(password) == "undefined") {
        return res.status(401).json({error: "Incomplete values sent."})
    }

    if (!validateEmail(email)) {
        return res.status(401).json({error: "Invalid email sent."})
    }
    let hashedPword = crypto.createHash('md5').update(passwordSalt + password).digest("hex");
    const newUser = new userModel({
        username: username,
        email: email,
        password: hashedPword,
        permissions: 0
    })
    try {
        await newUser.save()
    } catch (err) {
        let errorMsg = ""

        console.log(Object.keys( err.keyPattern ))
        if (Object.keys( err.keyPattern )[0] == "username") {
            errorMsg = "Username is taken"
        } else if(Object.keys( err.keyPattern )[0] == "email") {
            errorMsg = "Email is already in use"
        } else {
            console.log(err)
        }
        return res.status(500).json({error: errorMsg})
    }
    //await newUser.save()
    res.status(200).json({message: "Successful", user: newUser})
})

router.post("/login", async(req, res) => {

    if (!req.body.user || !req.body.password) {
        return res.status(401).json({error: "Invalid user sent"})
    }
    let submittedPword = crypto.createHash('md5').update(passwordSalt + sanitize(req.body.password)).digest("hex")
    await userModel.findOne({username: sanitize(req.body.user)}, "password permissions", (err, resp) => {
        if (err) return res.status(500).json({error: err.message})
        console.log(resp)
        if (resp===null) {
            return res.status(404).json({nessage: "User could not be found"})
        }
        if (resp.permissions < 0) {
            return res.status(403).json({message: "User is banned."})
        }
        if (submittedPword === resp.password) {
            let jwtToken = generateAccessToken(req.body.user, resp.permissions)
            return res.status(200).json({message: "Success", "Auth": jwtToken, expires: Date.now() + 604800})

        } else {
            return res.status(403).json({message: "Invalid login details"})
        }
    }).clone().catch(
        function(err) {
            console.log(err)
        }
    )
})

router.get("/currentUser", (req, res) => {
    const token = req.headers.authorization
    jwt.verify(token, jwtSecret, function(err, decoded) {
        if (err) {
            
            return res.status(403).json({message: "Invalid authorisation header"})
        }
        console.log(decoded)
        req.isAllowed = true;
        res.status(200).json({message: "Valid", data: decoded})
    })
})

router.get("/protected", verifyToken, (req, res) => {
    if (req.isAllowed) {
        res.status(200).json({message: "ok", pems: req.perms, user: req.username})
    }
    
})

router.get("/allUsers", async (req, res) => {
    const users = await userModel.find()
    return res.status(200).json({message:"Success", users: users})
})



module.exports = router