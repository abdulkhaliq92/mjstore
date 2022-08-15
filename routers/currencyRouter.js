const express = require("express")
const router = express.Router()
const axios = require("axios")


router.get("/exchange/:currency", (req, res) => {
    if (!req.params.currency) {
        return res.status(500).json({message: "Please supply currency"})
    }

    var requestURL = `https://api.exchangerate.host/latest?base=USD&symbols=${req.params.currency}`;
    axios.get(requestURL)
    .then(r => {
        console.log(r.data)
        return res.status(200).json({message: "Success", rate: r.data.rates[req.params.currency]})
    })
})

module.exports = router