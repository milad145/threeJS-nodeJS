import path from "path";
import express from "express";

import {appDir} from '../modules/assist.js';

export const serveStatic = (app) => {
    app.use('/style', express.static(path.join(appDir, 'views','assets', 'style')));
    app.use('/fonts', express.static(path.join(appDir, 'views','assets', 'style', 'webfonts')));
    app.use('/images', express.static(path.join(appDir, 'views','assets', 'images')));
    app.use('/media', express.static(path.join(appDir, 'views','assets', 'media')));
    app.use('/js', express.static(path.join(appDir, 'views','assets', 'js')));
    app.use('/tmpl', express.static(path.join(appDir, 'views', 'tmpl')));
}