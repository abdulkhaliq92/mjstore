const express = require("express")
const app = express()
const port = 4444
const dotenv = require("dotenv")
const mongoose = require("mongoose")
const cors = require("cors")
const reel = require("node-reel")
const chargeModal = require("./models/chargeModel")
const handleModel = require("./models/handleModel")
const checkoutModel = require("./models/checkoutModel")
const auctionModel = require("./models/auctionModel")
var coinbase = require("coinbase-commerce-node")
var Client = coinbase.Client;
const socketio = require('socket.io')
var nodemail = require("nodemailer")

var transporter = nodemail.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    auth: {
    user: 'mjstore.mijm@outlook.com',
    pass: 'Mjthecool3'
    }
});

function confirmOrder(text, reciever) {
    var mailOptions = {
        from: 'socialsseller@gmail.com',
        to: reciever,
        subject: 'Thank you for your order',
        text: text
    };
    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
    });
}

//S0c1al! socialsseller@gmail.com

const moment = require("moment")
dotenv.config()
mongoose.connect(process.env.ATLAS_URI, {useNewUrlParser: true})
const db = mongoose.connection
var clientObj = Client.init(process.env.COINBASE_KEY)
clientObj.setRequestTimeout(3000)
var Checkout = coinbase.resources.Checkout;
var Charge = coinbase.resources.Charge
db.on("error", (error) => console.log(error))
db.on("open", () => console.log("Connected to db"))
app.use(express.json())
app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PATCH"]
}))

const userAuthRouter = require("./routers/userAuth")
const handleController = require("./routers/handleController")
const adminRouter = require("./routers/adminRouter")
const ticketRouter = require("./routers/ticketsEndpoint")
const checkoutRouter = require("./routers/checkoutHandler")
const auctionRouter = require("./routers/auctionRouter")
const currencyRouter = require("./routers/currencyRouter")
app.use(userAuthRouter)
app.use(handleController)
app.use(adminRouter)
app.use(ticketRouter)
app.use(checkoutRouter)
app.use(auctionRouter)
app.use(currencyRouter)
reel().call(async () => {
    console.log("Running...")
    let recs = await chargeModal.find({expired: false})
    
    for (let rec of recs ) {
        Charge.retrieve(rec.chargeId, async function(err, res) {
            let date = moment(res.expires_at)
            
            for (let i of res.timeline) {
                if (i.status == "COMPLETED") {
                    if (rec.mode === "auction") {
                        auctionModel.findOne({handle: rec.username, platform: rec.platform}, (err, hndle) => {
                            confirmOrder(`Thank you for your order, please find below the info attached\n ${hndle.secretInfo}`,rec.initialisedBy )
                        })
                    } else {
                        handleModel.findOne({handle: rec.username, platform: rec.platform}, (err, hndle) => {
                            confirmOrder(`Thank you for your order, please find below the info attached\n ${hndle.secretInfo}`,rec.initialisedBy )
                        })
                    }
                    
                    chargeModal.updateOne({chargeId: rec.chargeId}, {expired: true, payed: true, payedBy: rec.initialisedBy}, (err, res) => {
                        if (err) console.log(err)
                    })
                    
                    console.log("Payment successfully completed")
                }
            }
            if (date.unix() < moment.utc().unix()) {
                chargeModal.updateOne({chargeId: rec.chargeId}, {expired: true}, (err, res) => {
                    if (err) console.log(err)
                })
            }
            
        } ) 
    }
}).everyMinute().run()
reel().call(async () => {
    console.log("Running checkout")
    let recs = await checkoutModel.find({expired: false})
    for (let rec of recs) {
        console.log(rec)
        Checkout.retrieve(rec.checkoutId, async function(err, resp) {
        })
    }
}).everyMinute().run()

const server = app.listen(port, () => {
    console.log(`listening on port ${port}`)
})

function chatRoomId() {
    return Math.floor((Math.random() * 1000000000000) + 1);
}

let chats = {}
let rooms = [{}]
const io = socketio(server, {
    cors: {
      origin: 'http://localhost:3000',
    }
  });
io.on("connection", (socket) => {
    console.log("New client connected", socket.id)
    socket.emit('connection', null);
    socket.on("chatStart", (data) => {
        let newChat = {
            sid: socket.id,
            username: data.user,
            chatRoomId: data.cid

        }
        rooms.push(newChat)
        console.log(`User: ${socket.id} / ${data.user} created room: ${newChat.chatRoomId}`)
        socket.join(data.cid)
    
    })

    socket.on("sendMsg", (data) => {
        console.log("SENDING MESSAGE")
        socket.to(data.room).emit("recieveMsg", data)
        if (!data.room) {
            return
        }
        if (data.room.toString() in chats) {
            chats[data.room.toString()].push(data)
        } else {
            chats[data.room.toString()] = [data]
        }
        console.log(data.room, socket.id)
    })

    socket.on("joinChat", (data) => {
        console.log("Joining", data)
        socket.join(data.cid)
        console.log(chats)
        socket.emit("loadMsgs", {chats: chats[data.cid]})
    })

    socket.on("admin", () => {
        console.log("ADMIN TRIGGER")
        console.log("SOCKET id: ", socket.id)
        console.log("ROOMS", rooms)
        socket.emit("adminResp", {msg: "hello admin", rooms: rooms})
    })
})