// ===============================================
// Express server file
// ===============================================
// inserting required libs
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const dotenv = require('dotenv');
const config = require("config");
// ===============================================
// initiate logs
const logs = require('./lib/modules/logs');
logs.initLogs(logs.APP_LOG);
logs.initSecurityLog();
// ===============================================
// initiate config
global.SecConfig = dotenv.config().parsed;
global.EnvConfig = config.get('config');
// ===============================================
// connect to mongoose database
const initiateServer = require('./lib/core/initiateServer');
function connectToDatabase() {
    mongoose.set("strictQuery", false);
    mongoose.connect(SecConfig['dbConfig'])
        .then(() => initiateServer.initiateServer())
        .catch(err => {
            console.error(err)
            return connectToDatabase()
        })
}
// ===============================================
connectToDatabase()
// ===============================================
