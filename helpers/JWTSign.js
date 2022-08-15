const jwt = require('jsonwebtoken');
const jwtSecret = "6cfe9fb8e80e836e6709cf773ab7a38d4322507da8bcece18cb0ce1ef5ad2c3eb1818550edf4965ec8d18cede8dacb70bd36d1f76b3938ec22b1bdb44c4decb8"
function generateAccessToken(username, permissions) {
    return jwt.sign({username, permissions}, jwtSecret, { expiresIn: "1d" });
}

async function verifyToken(token, callback) {
    jwt.verify(token, jwtSecret, (err, decoded) => {
        if (err) {
            callback(true, err)
        } else {
            callback(false, decoded)
        }
    })

}

console.log(generateAccessToken("nemoAdmin", 3))

verifyToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImxvbCIsImlhdCI6MTY0OTE5MTUyNywiZXhwIjoxNjQ5MTk1MTI3fQ.cQ7IJhAdPiyTk_SEktB6tdZCZU6HdtzGoTXqqEna6AM", (isErr, resp) => {
   if (isErr) {
       console.log("Invalid")

   } else {
       console.log("Valid", resp)
   }
} )
