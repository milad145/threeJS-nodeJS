const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require("path");

const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');

exports.initiateServer = () => {
    const app = express();
    app.set("view engine", "ejs");

    app.use(express.text());
    app.use(express.urlencoded({limit: "40.0mb", extended: true}));
    app.use(express.json({limit: "20.0mb", extended: true}));


    const serveStatic = require("./serveStatic");
    serveStatic.serveStatic(app);
    let apiApp = app;
    // api routes
    const routes = require("./routes");
    routes.routes(apiApp);
    // ===============================================
    const port = EnvConfig["port"];
    const ssl = EnvConfig["ssl"];

    let server = http.createServer({}, apiApp);
    if (ssl) {
        server = https.createServer({
            key: fs.readFileSync(path.join(__dirname, "..", "..", "data", "ssl", "privkey.pem")),
            cert: fs.readFileSync(path.join(__dirname, "..", "..", "data", "ssl", "fullchain.pem"))
        }, apiApp)
    }
    server.listen(port, function () {
        console.log("panel app listening on port " + port + "!");
    }).on('error', function (err) {
        console.error("HTTPS server error:", err.message);
        process.exit(1);
    });
}
