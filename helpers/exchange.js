const axios = require("axios")
var requestURL = "https://api.exchangerate.host/latest?base=USD&symbols=EUR";

axios.get(requestURL)
.then(res => {
    console.log(res.data)
})