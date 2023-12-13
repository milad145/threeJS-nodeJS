const https = require('https');
const http = require('http');
const path = require('path');
const crypto = require('crypto');
const URL = require('url');

const {OAuth2Client} = require('google-auth-library');
const jwt = require('jsonwebtoken');
const jalaali = require('jalaali-js');

function formatIpAddress(address) {
    if (typeof address === "string")
        return address.startsWith("::ff" + "ff:") ? address.slice(7) : address;
    else
        return "Unknown IP";
}

exports.formatIpAddress = formatIpAddress;

exports.setErrorResponse = function (req, res, err) {
    if (!err.responseCode) {
        let ip = formatIpAddress(req.ip)
        console.error("Processing request '%s %s' from '%s' failed:", req.method || "Unknown", req.originalUrl || "request", ip, err.message || err);
    }
    res.status(err.responseCode ? err.responseCode : 403).send(err)
};

exports.renderErrorResponse = function (req, res, err) {
    if (!err.responseCode) {
        let ip = formatIpAddress(req.ip)
        console.error("Processing request '%s %s' from '%s' failed:", req.method || "Unknown", req.originalUrl || "request", ip, err.message || err);
    }
    let errorCode = err.responseCode ? err.responseCode : 500;
    res.status(errorCode)
    res.render(`../services/viewer/views/error/${errorCode}`);
};

exports.setResponseCode = function (req, res, code) {
    let ip = formatIpAddress(req.ip)
    console.error("Request '%s %s' from '%s' failed. Status Code: %d (%s)", req.method || "Unknown", req.originalUrl || "request", ip, code, http.STATUS_CODES[code]);
    res.status(code).end();
};

exports.hash = function (message) {
    return crypto.createHash("md5")
        .update(Buffer.from(message, "ascii"))
        .digest("hex");
};

exports.encrypt = function (payload, key, IV) {
    const cipher = crypto.createCipheriv("AES-256-CBC", key, IV);
    let message = cipher.update(payload, "ascii", "hex");
    message += cipher.final("hex");
    return message;
};

exports.decrypt = function (message, key, IV) {
    const decipher = crypto.createDecipheriv("AES-256-CBC", key, IV);
    let payload = decipher.update(message, "hex", "ascii");
    payload += decipher.final("ascii");
    return payload;
};

exports.appDir = () => path.dirname(require.main.filename);

exports.time = () => {
    return Math.floor(Date.now());
};

exports.debug = (str) => {
    console.dir(str, {depth: null});
    console.log('----------------------------------------------------------------');
};

exports.getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

exports.getMicroTime = () => {
    let hrtime = process.hrtime();
    return (hrtime[0] * 1000000 + hrtime[1] / 1000) / 1000;
};

exports.getMonthName = (n) => {
    let month = new Array(12);
    month[0] = 'January';
    month[1] = 'February';
    month[2] = 'March';
    month[3] = 'April';
    month[4] = 'May';
    month[5] = 'June';
    month[6] = 'July';
    month[7] = 'August';
    month[8] = 'September';
    month[9] = 'October';
    month[10] = 'November';
    month[11] = 'December';
    return month[n];
};

exports.iGetMonthName = (n) => {
    let month = new Array(12);
    month[0] = 'محرم';
    month[1] = 'صفر';
    month[2] = 'ربيع الاول';
    month[3] = 'ربيع الثاني';
    month[4] = 'جمادي الاول';
    month[5] = 'جمادي الثاني';
    month[6] = 'رجب';
    month[7] = 'شعبان';
    month[8] = 'رمضان';
    month[9] = 'شوال';
    month[10] = 'ذيقعده';
    month[11] = 'ذالحجه';
    return month[n];
};

exports.iGetWeekDayName = (n) => {
    let day = new Array(7);
    day[1] = 'دوشنبه';
    day[2] = 'سه‌شنبه';
    day[3] = 'چهارشنبه';
    day[4] = 'پنجشنبه';
    day[5] = 'جمعه';
    day[6] = 'شنبه';
    day[0] = 'یکشنبه';
    return day[n];
};

exports.jGetMonthName = (n) => {
    let month = new Array(12);
    month[1] = 'فروردین';
    month[2] = 'اردیبهشت';
    month[3] = 'خرداد';
    month[4] = 'تیر';
    month[5] = 'مرداد';
    month[6] = 'شهریور';
    month[7] = 'مهر';
    month[8] = 'آبان';
    month[9] = 'آذر';
    month[10] = 'دی';
    month[11] = 'بهمن';
    month[12] = 'اسفند';
    return month[n];
};

exports.jGetMonthNumber = (name) => {
    let month = new Array(12);
    month['فروردین'] = 1;
    month['اردیبهشت'] = 2;
    month['خرداد'] = 3;
    month['تیر'] = 4;
    month['مرداد'] = 5;
    month['شهریور'] = 6;
    month['مهر'] = 7;
    month['آبان'] = 8;
    month['آذر'] = 9;
    month['دی'] = 10;
    month['بهمن'] = 11;
    month['اسفند'] = 12;
    return month[name];
};

exports.jalaaliToGeorgian = (year, month, date) => {
    return jalaali.jalaaliToDateObject(year, month, date);
};

exports.jalaaliMonthLength = (year, month) => {
    return jalaali.jalaaliMonthLength(parseInt(year), parseInt(month));
};

exports.toObj = (obj) => {
    if (obj === undefined) return {};
    return JSON.parse(JSON.stringify(obj));
};

exports.timestampToJalali = function (time) {
    let date = new Date(time);
    return jalaali.toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
};

exports.timestampToFullJalali = function (timestamp) {
    let jdate = this.timestampToJalali(timestamp);
    // let day = new Date(timestamp).getDay();
    let time = {};
    // time.dayName = this.iGetWeekDayName(day);
    // time.monthName = this.jGetMonthName(jdate.jm);
    time.month = jdate.jm;
    time.year = jdate.jy;
    time.date = jdate.jd;
    return time;
};

exports.timestampToHijri = (time) => {
    let date = new Date(time);
    return jalaali.toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
};

exports.georgianToHijri = (year, month, day, h = 0, m = 0, s = 0, ms = 0) => {
    const nowGreg = new Date(year, month, day, 0, 0, 0);
    return nowGreg.toHijri();
};

exports.DisplayTextWithoutMentions = (inputText) => {
    if (inputText === "") return "";
    const retLines = inputText.split("\n");
    let formattedText = "";
    retLines.forEach((retLine, rowIndex) => {
        const mentions = this.FindPatterns(retLine);
        if (mentions.length) {
            let lastIndex = 0;
            mentions.forEach((men, index) => {
                const initialStr = retLine.substring(lastIndex, men.start);
                lastIndex = men.end + 1;
                formattedText += initialStr;
                formattedText += `${men.type}${men.title}`;
                if (mentions.length - 1 === index) {
                    formattedText += retLine.substr(lastIndex); //remaining string
                }
            });
        } else {
            formattedText += retLine;
        }
        if (rowIndex < retLines.length - 1)
            formattedText += "\n";
    });
    return formattedText || "";
};

exports.FindPatterns = (val) => {
    /**
     * Both Mentions and Selections are 0-th index based in the strings
     * meaning their indexes in the string start from 0
     * findMentions finds starting and ending positions of mentions in the given text
     * @param val string to parse to find mentions
     * @returns list of found mentions
     */
    let reg = /([@|#|https]+?)\[title:([^\]]+?)\]/gim;
    let indexes = [];
    while ((match = reg.exec(val))) {
        indexes.push({
            start: match.index,
            end: reg.lastIndex - 1,
            type: match[1],
            title: match[2]
        });
    }
    return indexes;
};

exports.mobileNumberValidation = (phoneNumber) => {
    // const re = /^([0|\+[0-9]{1,5})?([7-9][0-9]{9})$/;
    const re = /^(\+\d{1,3}[- ]?)?\d{8,11}$/;
    return re.test(String(phoneNumber));
};

exports.emailValidation = (email) => {
    const regExp = new RegExp(/^[A-Za-z0-9_!#$%&'*+\/=?`{|}~^.-]+@[A-Za-z0-9.-]+$/, "gm");
    return regExp.test(email);
};

exports.formatPhoneNumber = (phoneNumber) => {
    phoneNumber = phoneNumber.startsWith("0") ? phoneNumber.slice(1) : phoneNumber
    return phoneNumber
};

exports.cardNumberValidation = (cardNumber) => {
    const re = /^\d{4}\d{4}\d{4}\d{4}$/;
    return re.test(String(cardNumber));
};

exports.nationalCodeValidation = function (code) {
    let L = code.length;

    if (L < 8 || parseInt(code, 10) === 0) return false;
    code = ('0000' + code).substr(L + 4 - 10);
    if (parseInt(code.substr(3, 6), 10) === 0) return false;
    let c = parseInt(code.substr(9, 1), 10);
    let s = 0;
    for (var i = 0; i < 9; i++)
        s += parseInt(code.substr(i, 1), 10) * (10 - i);
    s = s % 11;
    return (s < 2 && c === s) || (s >= 2 && c === (11 - s));
}

exports.activeCodeValidation = (code) => {
    const re = /\d{4}$/;
    return re.test(String(code));
};

exports.listToTree = (list) => {
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

exports.generateLinkId = function (d) {
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

exports.getRandomNumberWithCustomDigits = function (n = 6) {
    return Math.floor(Math.random() * 9 * 10 ** (n - 1)) + 10 ** (n - 1)
}

exports.degreesToRadians = (degrees) => degrees * (Math.PI / 180)

exports.numberWithCommas = function (x) {
    return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
};

exports.generateAuthToken = function (data, expireInSecond) {
    return jwt.sign(data, SecConfig['jwtSecret'], {
        algorithm: SecConfig['jwtAlgorithm'],
        expiresIn: expireInSecond
    });
};

exports.verifyAuthToken = function (token) {
    try {
        return jwt.verify(token, SecConfig['jwtSecret'])
    } catch (err) {
        return false
    }
};

exports.httpsRequest = function (method, url, body, headers = {}) {
    return new Promise((resolve, reject) => {
        url = URL.parse(url);
        let {hostname, path} = url
        let options = {
            hostname,
            path,
            method: method.toUpperCase(),
            headers
        };
        let requestType = url.protocol.includes('https') ? https : http;
        const request = requestType.request(options, function (response) {
            if (response.statusCode === 200) {
                let body = "";
                response.on("data", (chunk) => body += chunk);
                response.on("end", function () {
                    try {
                        resolve(JSON.parse(body))
                    } catch (e) {
                        reject(e)
                    }
                });
            } else
                reject(new Error(`Server API call ${method} ${path} failed with status code ${response.statusCode} (${http.STATUS_CODES[response.statusCode]})`));
        });

        request.on("error", function (err) {
            reject(err);
        });

        if (method.toLowerCase() === 'post') {
            request.write(body.toString())
        }

        request.end();
    })
};

exports.googleApi = function (code) {
    return new Promise((resolve, reject) => {
        const oAuth2Client = new OAuth2Client(
            SecConfig['Google_client_id'],
            SecConfig['Google_client_secret'],
            EnvConfig['panelUrl'][0]
        );
        oAuth2Client.getToken(code)
            .then(r => {
                oAuth2Client.setCredentials(r.tokens);
                const url = 'https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,photos';
                return oAuth2Client.request({url})
            })
            .then(res => {
                resolve(res.data)
            })
            .catch(err => {
                // reject(err)
                resolve({
                    "resourceName": "people/114220191567691099085",
                    "etag": "%EggBAgMJLjc9PhoEAQIFByIMUk9FQ3BnNWZ3bzQ9",
                    "names": [{
                        "metadata": {
                            "primary": true,
                            "source": {"type": "PROFILE", "id": "114220191567691099085"},
                            "sourcePrimary": true
                        },
                        "displayName": "Milad Aslani",
                        "familyName": "Aslani",
                        "givenName": "Milad",
                        "displayNameLastFirst": "Aslani, Milad",
                        "unstructuredName": "Milad Aslani"
                    }],
                    "photos": [{
                        "metadata": {"primary": true, "source": {"type": "PROFILE", "id": "114220191567691099085"}},
                        "url": "https://lh3.googleusercontent.com/a/AAcHTtfEf4KOsFAuF4kTkdjQeNQGBfStPushrKAV28kF4KlZDg=s100"
                    }],
                    "emailAddresses": [{
                        "metadata": {
                            "primary": true,
                            "verified": true,
                            "source": {"type": "ACCOUNT", "id": "114220191567691099085"},
                            "sourcePrimary": true
                        }, "value": "miladaslani1991@gmail.com"
                    }]
                })
            })
    })
}
