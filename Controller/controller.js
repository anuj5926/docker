const dockerChrome = require("../Service/Chrome")

async function handleChromeController(req, res, next) {
    try {
        console.log("request Parameter for chrome controller", req.body)
        let response = await dockerChrome(req);
        console.log("response data for chrome controller", response);
        res.send(response);

    } catch (err) {
        console.log("error in handleChromeController", err)
        next(err)
    }
}

module.exports = { handleChromeController }