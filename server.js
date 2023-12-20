// ===============================================
// Express server file
// ===============================================
// inserting required libs
import mongoose from "mongoose";
// mongoose.Promise = require('bluebird');
import dotenv from "dotenv";
import config from "config";
// ===============================================
// // initiate logs
// import logs from "./lib/modules/logs.js";
//
// logs.initLogs(logs.APP_LOG);
// logs.initSecurityLog();
// ===============================================
// initiate config
global.SecConfig = dotenv.config().parsed;
global.EnvConfig = config.get('config');
// ===============================================
// connect to mongoose database
import {initiateServer} from "./lib/core/initiateServer.js";

function connectToDatabase() {
    mongoose.set("strictQuery", false);
    mongoose.connect(SecConfig['dbConfig'])
        .then(() => {
            console.log('connected')
            initiateServer()
        } )
        .catch(err => {
            console.error(err)
            return connectToDatabase()
        })
}

// ===============================================
connectToDatabase()
// ===============================================
