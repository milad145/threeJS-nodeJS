import http from 'http';

export const appDir = process.env.PWD
export const formatIpAddress = (address) => {
    if (typeof address === "string")
        return address.startsWith("::ff" + "ff:") ? address.slice(7) : address;
    else
        return "Unknown IP";
};

export const setErrorResponse = (req, res, err) => {
    if (!err.responseCode) {
        let ip = formatIpAddress(req.ip)
        console.error("Processing request '%s %s' from '%s' failed:", req.method || "Unknown", req.originalUrl || "request", ip, err.message || err);
    }
    res.status(err.responseCode ? err.responseCode : 403).send(err)
};

export const renderErrorResponse = (req, res, err) => {
    if (!err.responseCode) {
        let ip = formatIpAddress(req.ip)
        console.error("Processing request '%s %s' from '%s' failed:", req.method || "Unknown", req.originalUrl || "request", ip, err.message || err);
    }
    let errorCode = err.responseCode ? err.responseCode : 500;
    res.status(errorCode)
    res.render(`error/${errorCode}`);
};

export const setResponseCode = (req, res, code) => {
    let ip = formatIpAddress(req.ip)
    console.error("Request '%s %s' from '%s' failed. Status Code: %d (%s)", req.method || "Unknown", req.originalUrl || "request", ip, code, http.STATUS_CODES[code]);
    res.status(code).end();
};