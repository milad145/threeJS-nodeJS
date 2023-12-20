// ===============================================
// Express server file
// ===============================================
// inserting required libs
import config from "config";
// ===============================================
// initiate config
global.EnvConfig = config.get('config');
// ===============================================
// connect to mongoose database
import {initiateServer} from "./lib/core/initiateServer.js";

// ===============================================
initiateServer()
// ===============================================
