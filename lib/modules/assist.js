import https from 'https';
import http from 'http';
import crypto from 'crypto';
import URL from 'node:url';

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

// export const appDir = () => path.dirname(require.main.filename);

export const toObj = (obj) => {
    if (obj === undefined) return {};
    return JSON.parse(JSON.stringify(obj));
};

export const listToTree = (list) => {
    let map = {}, node, roots = [], i;

    for (i = 0; i < list.length; i++) {
        map[list[i]._id] = i;
        list[i].children = [];
    }

    for (i = 0; i < list.length; i++) {
        node = list[i];
        if (node.parent === '0' || typeof node.parent === "undefined") roots.push(node);
        else list[map[node.parent]].children.push(node);
    }
    return roots;
};

export const generateLinkId = (d) => {
    const digitsArray = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'j', 'k', 'm', 'n', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
    const numberArray = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

    function generateCode(d) {
        let code = '';
        let digitsLength = 0;
        while (code.length < d) {
            if ((parseInt(crypto.randomBytes(1).toString('hex'), 16) % 2) && digitsLength < 2) {
                code += digitsArray[Math.floor(parseInt(crypto.randomBytes(4).toString('hex'), 16) / 4) % 23];
                digitsLength += 1;
            } else {
                code += numberArray[Math.floor(parseInt(crypto.randomBytes(4).toString('hex'), 16) / 4) % 9];
                digitsLength = 0;
            }
        }
        if (code.includes('sex'))
            code = generateCode(d)

        return code
    }

    return generateCode(d)
};

export const getRandomNumberWithCustomDigits = (n = 6) => {
    return Math.floor(Math.random() * 9 * 10 ** (n - 1)) + 10 ** (n - 1)
}

export const degreesToRadians = (degrees) => degrees * (Math.PI / 180)

export const httpsRequest = (method, url, body, headers = {}) => {
    return new Promise((resolve, reject) => {
        let {hostname, path, protocol} = new URL(url)
        let options = {
            hostname,
            path,
            method: method.toUpperCase(),
            headers
        };
        let requestType = protocol.includes('https') ? https : http;
        const request = requestType.request(options, (response) => {
            if (response.statusCode === 200) {
                let body = "";
                response.on("data", (chunk) => body += chunk);
                response.on("end", () => {
                    try {
                        resolve(JSON.parse(body))
                    } catch (e) {
                        reject(e)
                    }
                });
            } else
                reject(new Error(`Server API call ${method} ${path} failed with status code ${response.statusCode} (${http.STATUS_CODES[response.statusCode]})`));
        });

        request.on("error", (err) => {
            reject(err);
        });

        if (method.toLowerCase() === 'post') {
            request.write(body.toString())
        }

        request.end();
    })
};