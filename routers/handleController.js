const express = require("express")
const { modelName, findOneAndDelete } = require("../models/handleModel")
const router = express.Router()
const handleSchema = require("../models/handleModel")
const jwt = require('jsonwebtoken');
const dotenv = require("dotenv")
const userModel = require("../models/userModel")
const crypto = require('crypto')
const accessModel = require("../models/accessModel")
const auctionModel = require("../models/auctionModel")
dotenv.config()
const passwordSalt = process.env.PASSWORD_SALT
const jwtSecret = process.env.TOKEN_SECRET

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization;
    jwt.verify(token, jwtSecret, function(err, decoded) {
        if (err) {
            req.isAllowed = false;
            return res.status(403).json({message: "Invalid authorisation header"})
        }
        req.isAllowed = true;
        req.username = decoded.username
        req.perms = decoded.permLevel
        next()
    })
}

router.post("/listHandle", verifyToken ,async (req, res) => {
    if (!(req.body.handle) || !(req.body.platform)  ||  !(req.body.price)) {
        return res.status(401).json({error: "Incomplete request"})
    }
    if (req.perms < 2) {
        return res.status(403).json({error: "You do not have permission to create handles."})
    }
    try {
        const handleToPush = new handleSchema({
            handle: req.body.handle,
            platform: req.body.platform,
            isPrivate: req.body.isPrivate || false,
            info: req.body.info,
            price: req.body.price,
            listedBy: req.username,
            secretInfo: req.body.dat,
            isOg: req.body.og,
            isRepeater: req.body.rep,
            isSemi3: req.body.semi3,
            isPronouncable: req.body.pronouncable
        })
        await handleToPush.save()
        return res.status(200).json({message: "Successfully listed", obj: handleToPush})
    } catch(err) {
        return res.status(500).json({error: err.message})
    }
    
})

router.get("/allHandles", async (req, res) => {
    try {
        await handleSchema.find({isPrivate: false, sold: false}, "handle info platform price listedBy", (err, resp) => {
            if (err) return res.status(500).json({message: err.message})
            return res.status(200).json({message: "Success", handles: resp})
        }).clone().catch(
            function(err) {
                console.log(err)
            })
    } catch(err) {
        console.log(err)
    }
})

router.get("/privateHandles", verifyToken,  async (req, res) => {
    if (req.perms > 0) {
        
    } else {
        return res.status(403).json({message: "Not allowed"})
    }
    try {
        await handleSchema.find({isPrivate: true}, "handle platform price", (err, resp) => {
            if (err) return res.status(500).json({message: err.message})
            return res.status(200).json({message: "Success", handles: resp})
        }).clone().catch(
            function(err) {
                console.log(err)
            })
    }catch(err) {
        console.log(err)
    }
})

router.post("/editHandleInfo", async (req, res) => {
    if (!req.body.handle || !req.body.platform || !req.body.info) {
        return res.status(401).json({message: "Incomplete data sent"})
    }
    let handle = await handleSchema.findOne({handle: req.body.handle, platform: req.body.platform}, function(err, doc) {
        if (err){ return res.status(500).json({error: err.message})}
        
        if (doc === null) {
            return res.status(404).json({message: "User could not be found"})
        }
//
        //if (doc.listedBy !== req.username || req.permissions < 3) {
        //    return res.status(403).json({message: "You do not have permissions to do that"})
        //}
    }).clone().catch(
        function(err) {
            console.log(err)
        }
    )
    var query = {
        username: req.body.username,
        platform: req.body.platform
    }
    var updating = {
        secretInfo: "super secret info here"
    }
    await handleSchema.findByIdAndUpdate(handle.id, updating, function(err, doc) {
        if (err) return res.status(500).json({error: err.message})
        console.log(doc)
        return res.status(200).json({message: "Info succesffully updated", doc: doc})
    }).clone().catch(
        function(err) {
            console.log(err)
        }
    )
})

router.post("/editHandlePrice", verifyToken, async (req, res) => {
    if (!req.body.handle || !req.body.platform || !req.body.price) {
        return res.status(401).json({message: "Incomplete data sent"})
    }
    let handle = await handleSchema.findOne({handle: req.body.handle, platform: req.body.platform}, function(err, doc) {
        if (err){ return res.status(500).json({error: err.message})}
        
        if (doc === null) {
            return res.status(404).json({message: "User could not be found"})
        }

        if (doc.listedBy !== req.username || req.permissions < 3) {
            return res.status(403).json({message: "You do not have permissions to do that"})
        }
    }).clone().catch(
        function(err) {
            console.log(err)
        }
    )
    var query = {
        username: req.body.username,
        platform: req.body.platform
    }
    var updating = {
        price: req.body.price
    }
    await handleSchema.findByIdAndUpdate(handle.id, updating, function(err, doc) {
        if (err) return res.status(500).json({error: err.message})
        console.log(doc)
        return res.status(200).json({message: "Info succesffully updated", doc: doc})
    }).clone().catch(
        function(err) {
            console.log(err)
        }
    )
})

router.post("/deleteHandle", verifyToken, async (req, res) => {
    if (!req.body.username || !req.body.platform || !req.body.info) {
        return res.status(401).json({message: "Incomplete data sent"})
    }
    let handle = await handleSchema.findOne({handle: req.body.username, platform: req.body.platform}, function(err, doc) {
        if (err) return res.status(500).json({error: err.message})
        
        if (doc === null) {
            return res.status(404).json({message: "User could not be found"})
        }

        if (doc.listedBy !== req.username || req.permissions < 3) {
            return res.status(403).json({message: "You do not have permissions to do that"})
        }
    })
    var query = {
        username: req.body.username,
        platform: req.body.platform
    }
    await findOneAndDelete(query, function(err, doc) {
        if (err) return res.status(500).json({error: err.message})
        return res.status(200).json({message: "Handle successfully deleted"})
    })


})

router.post("/checkCode", verifyToken, async (req, res) => {
    console.log(req.body)
    if (!req.body.code) {
        return res.status(401).json({message: "No code sent"})
    }
    try {

    
    await accessModel.find({accessCode: req.body.code}, "userGranted", function(err, doc) {
        if (err) return res.status(500).message({error: err.message})
        if (doc===null) return res.status(404).json({message: "Code not found"})
        var userAssigned = false
        for (let i of doc) {
            if (i.userGranted === req.username) {
                userAssigned = true
            }
        }
        if (!userAssigned) return res.status(403).json({message: "Code is not assigned to this user"})
        return res.status(200).json({message: "Valid"})
    }).clone().catch(
        function(err) {
            console.log(err)
        }
    )
    } catch(e) {
        console.log(e)
        return res.status(500).json({error: e.message})
    }
})

router.post("/handleByName", async (req, res) => {
    console.log(req.body.handle, req.body.platform)
    console.log("REQL", req.body)
    await handleSchema.findOne({handle: req.body.handle, platform: req.body.platform}, "handle platform info price listedBy",(err, resp) => {
        if (err) return res.status(500).json({err: err.msg})
        console.log(resp)
        return res.status(200).json({message: resp})
    }).clone().catch(
        function(err) {
            console.log(err)
        }
    )
})

router.post("/massAdd",verifyToken, async (req, res) => {
    if (req.perms < 2) {
        return res.status(403).json({message: "Not high enough role for this"})
    }
    let handles = req.body.handles.split("\n")
    let handlesToAdd = []
    var currHandle
    for (let i of handles) {
        if (i !=="") {
            console.log("Adding: ", i[2])
            currHandle = i.split(":")
            let handleObj = {
                "handle": currHandle[0],
                "platform": currHandle[1],
                "price":parseInt(currHandle[2]),
                "info":currHandle[3],
                "secretInfo":currHandle[4],
                "listedBy":"nemo"
            }
            handlesToAdd.push(handleObj)
            console.log(currHandle)
        }
        
    }
    await handleSchema.insertMany(handlesToAdd)
    console.log(handles)
    return res.status(200).json({message: "Success"})
})

router.post("/filter", async (req, res) => {
    console.log(req.body)
    let filter = {$and: []}
        if (req.body.contains && req.body.contains != "") {
            const regexContain = new RegExp(req.body.contains, "i")
            filter["$and"].push({
                handle: {$regex: regexContain}
            })
        }
        if (req.body.endsWith && req.body.endsWith != "") {
            const regexEnds = new RegExp(String.raw`\w*${req.body.endsWith}\b`)
            filter["$and"].push({
                handle: {$regex: regexEnds}
            })
        }
        if (req.body.beginsWith && req.body.beginsWith != "") {
            const regexBegin = new RegExp("^"+ req.body.beginsWith)
            filter["$and"].push({
                handle: {$regex: regexBegin}
            })
        }

        if (req.body.like && req.body.like != "") {
            
                let initial = req.body.like
                let strings = []
                let rstring = ""
                for(var i = 0;i < initial.length - 1;i++) {
                    var c = initial[i] + initial[i+1];
                   
                    strings.push(c)
                }
                for (let i of strings) {
                    rstring += i + "|"
                }
                let r= new RegExp(rstring.slice(0, -1), "i")
                console.log(r)
                filter["$and"].push({
                    handle: {$regex: r}
                })

        }

        if (req.body.specific&& req.body.specific != "") {
            console.log("Specific sent")
            let pos = 0
            let search = ""
            for (let i of req.body.specific) {
                if (i== "*") {
                    pos++
                } else {
                    search = i
                }
            }
            const specificPos = new RegExp(`^.{${pos}}[${search}]`)
            console.log(specificPos)
            filter["$and"].push({
                handle: {$regex: specificPos}
            })
        }
        if (req.body.gt > 0 && req.body.gt) {
            filter["$and"].push({price: {$gt: req.body.gt}})
        }
        if (req.body.lt && req.body.lt > 0) {
            filter["$and"].push({price: {$lt: req.body.lt}})
        }
        if (req.body.og === true) {
            filter["$and"].push({isOg: true})
        } 
        if (req.body.rep === true) {
            filter["$and"].push({isRepeater: true})
        } 
        if (req.body.semi3 === true) {
            filter["$and"].push({isSemi3: true})
        }
        if (req.body.pronouncable === true) {
            filter["$and"].push({isPronouncable: true})
        }
        if (filter["$and"].length == 0) {
            filter={}
        }
        
        
    console.log(filter)
    

    console.log("Filter : ", filter)
    
    var result = await handleSchema.find(filter).exec();
    //let resp = []
    //for (let i of result) {
    //    resp.push(i.handle)
    //}
    
    return res.status(200).json({handles: result})
})

router.post("/filterAuction", async (req, res) => {

    let filter = {$and: []}
        if (req.body.contains && req.body.contains != "") {
            const regexContain = new RegExp(req.body.contains, "i")
            filter["$and"].push({
                handle: {$regex: regexContain}
            })
        }
        if (req.body.endsWith && req.body.endsWith != "") {
            const regexEnds = new RegExp(String.raw`\w*${req.body.endsWith}\b`)
            filter["$and"].push({
                handle: {$regex: regexEnds}
            })
        }
        if (req.body.beginsWith && req.body.beginsWith != "") {
            const regexBegin = new RegExp("^"+ req.body.beginsWith)
            filter["$and"].push({
                handle: {$regex: regexBegin}
            })
        }

        if (req.body.like && req.body.like != "") {
            
                let initial = req.body.like
                let strings = []
                let rstring = ""
                for(var i = 0;i < initial.length - 1;i++) {
                    var c = initial[i] + initial[i+1];
                   
                    strings.push(c)
                }
                for (let i of strings) {
                    rstring += i + "|"
                }
                let r= new RegExp(rstring.slice(0, -1), "i")
                console.log(r)
                filter["$and"].push({
                    handle: {$regex: r}
                })

        }

        if (req.body.specific&& req.body.specific != "") {
            console.log("Specific sent")
            let pos = 0
            let search = ""
            for (let i of req.body.specific) {
                if (i== "*") {
                    pos++
                } else {
                    search = i
                }
            }
            const specificPos = new RegExp(`^.{${pos}}[${search}]`)
            console.log(specificPos)
            filter["$and"].push({
                handle: {$regex: specificPos}
            })
        }
        if (req.body.gt > 0 && req.body.gt) {
            filter["$and"].push({price: {$gt: req.body.gt}})
        }
        if (req.body.lt && req.body.lt > 0) {
            filter["$and"].push({price: {$lt: req.body.lt}})
        }
        if (filter["$and"].length == 0) {
            filter={}
    } 
    console.log(filter)
    

    console.log("Filter : ", filter)
    console.log("REQ ", req.body)
    var result = await auctionModel.find(filter).exec();
    //let resp = []
    //for (let i of result) {
    //    resp.push(i.handle)
    //}
    
    return res.status(200).json({handles: result})
})


module.exports = router