import user from "../entities/user/route.js"
export function routes(app) {

    app.get('/', function (req, res) {
        res.render('index');
    });

    app.use('/user', user);
}
