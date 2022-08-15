const express = require("express")
const router = express.Router()
const ticketSchma = require("../models/ticketModel")
const jwt = require('jsonwebtoken');
const dotenv = require("dotenv")

const jwtSecret = process.env.TOKEN_SECRET

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization;
    console.log(token)
    jwt.verify(token, jwtSecret, function(err, decoded) {
        if (err) {
            console.log("ERROR", err)
            req.isAllowed = false;
            return res.status(403).json({message: "Invalid authorisation header"})
        }
        console.log(decoded)
        req.isAllowed = true;
        req.username = decoded.username
        req.perms = decoded.permLevel
        next()
    })
}


router.post("/submitTicket", verifyToken, async (req, res) => {
    console.log(req.body)
    try {
        const newTicket = ticketSchma({
            submittedBy:req.username,
            ticketContent: req.body.content,
            subject: req.body.subject
        })
        await newTicket.save()
        return res.status(200).json({message: "Ticket submitted", ticket: newTicket})
    } catch(err) {
        console.log(err)
        return res.status(500).json({error: err.message})
    }
})

router.post("/replyTicket", verifyToken, async (req, res) => {
    
    const userReply = req.username
    if (!req.body.reply || !req.body.tid) {
        return res.status(401).json({message: "Incomplete data sent"})
    }

    let ticketObj = await ticketSchma.findOne({tid: req.body.tid})
    if (ticketObj === null) {
        return res.status(404).json({message: "Ticket not found"})
    }
    console.log("PERMS", req.perms)
    if (ticketObj.submittedBy !== req.username && req.perms <3 ) {
        return res.status(403).json({message: "You do not have permission to do this"})
    }
    ticketObj.ticketReplies.push({"ReplyAuthor":userReply, "ReplyContent":req.body.reply})
    await ticketSchma.findByIdAndUpdate(ticketObj.id, {ticketReplies: ticketObj.ticketReplies}, function (err, doc) {
        if (err) return res.status(500).json({error: err.message})
    }).clone().catch(
        function(err) {
            console.log(err)
        }
    )
    return res.status(200).json({message: "Success"})


})

router.get("/openTickets", verifyToken, async (req,res) => {
    if (req.perms <3) {
        return res.status(403).json({message: "You do not have permission to do this"})
    }
    const tickets = await ticketSchma.find()
    res.status(200).json({message:"Success", tickets: tickets})
})

router.get("/viewTickets", verifyToken, async (req, res) => {
    const tickets = await ticketSchma.find({submittedBy: req.username})
    return res.status(200).json({message: "Success", tickets: tickets})
})

router.post("/ticketById", verifyToken, async(req, res) => {
    if (!req.body.tid) {
        return res.status(401).json({message: "Send body data ples"})
    }
    const ticket = await ticketSchma.findOne({tid: req.body.tid})
    if (ticket.closed) {
        return res.status(403).json({message: "Ticket is closed", error: "Ticket is already closed"})
    }
    return res.status(200).json({message: "Success", replies: ticket.ticketReplies})
})

router.get("/transcript/:tid", verifyToken, async(req, res) => {
    if (!req.params.tid) {
        return res.status(401).json({message:"Please send a tid to get"})
    }
    console.log(parseInt(req.params.tid))
    const ticket = await ticketSchma.findOne({tid:  parseInt(req.params.tid)})
    if (ticket === null) {
        return res.status(404).json({message: "Ticket not found"})
    }
    if (ticket.submittedBy !== req.username && req.perms <3 ) {
        return res.status(403).json({message: "You do not have permission to do this"})
    }
    
    return res.status(200).json({message: "Success", replies: ticket.ticketReplies})
})

router.post("/closeTicket", verifyToken, async(req, res) => {
    const userReply = req.username
    if (!req.body.tid) {
        return res.status(401).json({message: "Incomplete data sent"})
    }

    let ticketObj = await ticketSchma.findOne({tid: req.body.tid})
    if (ticketObj === null) {
        return res.status(404).json({message: "Ticket not found"})
    }
    console.log("PERMS", req.perms)
    if (ticketObj.submittedBy !== req.username && req.perms <3 ) {
        return res.status(403).json({message: "You do not have permission to do this"})
    }

    ticketSchma.findByIdAndUpdate({_id: ticketObj._id}, {closed: true}, function(err, resp) {
        if (err) return res.status(500).json({error: err.msg})
        return res.status(200).json({message: "Successfully closed"})
    })
})

module.exports = router