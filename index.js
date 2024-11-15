const http = require("http");
const httpProxy = require('http-proxy');
const express = require("express");
const cors = require("cors");
const app = express();
const routes = require("./Routes/route");
const { db } = require("./constant");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const PORT = 3000;

app.use("/docker", routes)

app.listen(3000, () => {
    console.log("---- Node Server Started on ----- ", 3000);
});



//  reverse proxy server
const reverseProxyApp = express();
const proxy = httpProxy.createProxyServer({});

reverseProxyApp.use((req, res) => {
    const containerName = req.query.name;

    if (!containerName) return res.status(404);

    console.log(containerName, db)

    const { ipAddress, defaultPort } = db.get(containerName.substring(1))

    let target;

    if (defaultPort === "6901") {
        target = `https://${ipAddress}:${defaultPort}`;
    } else {
        target = `http://${ipAddress}:${defaultPort}`;
    }

    console.log(`proxy to ${target}`);

    return proxy.web(req, res, { target, changeOrigin: true, ws: true,secure:false });

})

const reverseProxy = http.createServer(reverseProxyApp);

reverseProxy.on('upgrade', (req, socket, head) => {
    const containerName = req.query.name;

    if (!containerName) return res.status(404);

    console.log(containerName, db)

    const { ipAddress, defaultPort } = db.get(containerName.substring(1))

    let target;

    if (defaultPort === "6901") {
        target = `https://${ipAddress}:${defaultPort}`;
    } else {
        target = `http://${ipAddress}:${defaultPort}`;
    }

    console.log(`proxy to ${target}`);

    return proxy.ws(req, socket, head, { target, ws: true,secure:false });
})

reverseProxy.listen(5000, () => {
    console.log("reverse proxy is running on port 5000")
})
