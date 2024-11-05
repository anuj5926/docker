const express = require("express");
const cors = require("cors");
const app = express();
const routes = require("./Routes/route")

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const PORT = 3000;

app.use("/docker", routes)

app.listen(3000, () => {
    console.log("---- Node Server Started on ----- ", 3000);
}); 