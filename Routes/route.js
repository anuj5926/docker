const express = require("express")
const { handleChromeController } = require("../Controller/controller")
const router = express.Router();

router.post("/chrome", handleChromeController)

module.exports = router