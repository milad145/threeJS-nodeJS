exports.routes = function (app) {

    app.get('/', function (req, res) {
        res.render('index');
    });

    app.use('/user', require('lib/routes/user/route'));
};
