const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String, 
        required: true,
        unique: false
    },
    permissions: {
        type:Number,
        required:true,
        default: 0 // 0 is banned, 1 is regular user, 2 has perms to create handles, 3 is admin
    }
})

module.exports = mongoose.model("User", userSchema)