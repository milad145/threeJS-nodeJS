export default (code, lan = 'en') => {
    let errors = {};

    // default
    errors[400] = {
        en: "Bad Request",
        code: 400
    };
    errors[401] = {
        en: "Unauthorized Error, Please Login.",
        code: 401
    };
    errors[403] = {
        en: "Permission Denied",
        code: 403
    };
    errors[404] = {
        en: "Not Found",
        code: 404
    };


    let response = errors[code] || {};
    let err = new Error();
    err["responseCode"] = response.code || 500;
    err["message"] = response[lan] || "";
    err["messageCode"] = code || "";
    err["lan"] = lan;

    return err;
};
