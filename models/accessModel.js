const mongoose = require("mongoose")


function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}
const accessModel = new mongoose.Schema({
    accessCode: {
        type: String,
        required: true,
        default: makeid(14)
    },
    userGranted: {
        type: String,
        required: true
    },
    timeExpire: {
        type: Number,
        required: true,
        default: 0
    }
})

module.exports = mongoose.model("Access", accessModel)