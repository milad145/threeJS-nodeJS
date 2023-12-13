const path = require('path');
const express = require('express');

const {appDir} = require('lib/modules/assist')

exports.serveStatic = function (app) {
    app.use('/css', express.static(path.join(appDir(), 'views', 'css')));
    app.use('/fonts', express.static(path.join(appDir(), 'views', 'css', 'fonts')));
    app.use('/images', express.static(path.join(appDir(), 'views', 'images')));
    app.use('/media', express.static(path.join(appDir(), 'views', 'media')));
    app.use('/js', express.static(path.join(appDir(), 'views', 'js')));
    app.use('/tmpl', express.static(path.join(appDir(), 'views', 'tmpl')));
    app.use('/cloth-image', express.static(path.join(appDir(), 'uploads', 'clothes')));
    app.use('/cloth-model', express.static(path.join(appDir(), 'uploads', 'models')));
};
