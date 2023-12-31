import http from "http";

import express from "express";

import {serveStatic} from "./serveStatic.js";
import {routes} from "./routes.js";

export function initiateServer() {
    const app = express();
    app.set("view engine", "ejs");

    app.use(express.text());
    app.use(express.urlencoded({limit: "40.0mb", extended: true}));
    app.use(express.json({limit: "20.0mb", extended: true}));

    serveStatic(app);

    routes(app);

    // ===============================================

    const port = EnvConfig["port"];

    let server = http.createServer({}, app);

    server.listen(port, function () {
        console.log("panel app listening on port " + port + "!");
    }).on('error', function (err) {
        console.error("HTTPS server error:", err.message);
        process.exit(1);
    });
}