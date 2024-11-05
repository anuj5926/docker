const express = require("express")
const { handleChromeController } = require("../Controller/controller")
const router = express.Router();

router.post("/start", handleChromeController)

module.exports = router