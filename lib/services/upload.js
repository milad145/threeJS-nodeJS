const path = require('path');
const fs = require('fs');

const multer = require('multer');
const uploads = EnvConfig['uploads'];
//=================================
const errorHandler = require("lib/modules/errorHandler");
const {setErrorResponse, appDir, generateLinkId} = require('lib/modules/assist')
//=================================
module.exports = {
    uploader: (type) => {
        return (req, res, next) => {
            let filePath = null;
            let upload = multer({
                storage: multer.diskStorage({
                    destination: (req, file, cb) => {
                        const today = new Date();
                        const year = today.getFullYear();
                        let month = today.getMonth() + 1;
                        if (month < 10) month = "0" + month
                        let day = today.getDate();
                        if (day < 10) day = "0" + day
                        filePath = `${year}${month}${day}`

                        let destPath = path.join(appDir(), filePath)
                        fs.mkdir(destPath, {recursive: true}, err => {
                            cb(err, destPath)
                        })
                    },
                    filename: (req, file, cb) => {
                        let mimeType = file.originalname.split('.');
                        mimeType = mimeType[mimeType.length - 1]
                        if (!mimeType) {
                            if (file.fieldname === 'image') mimeType = 'jpg';
                            else if (file.fieldname === 'model') mimeType = 'glb';
                        }

                        if (file.mimetype.includes('image') || (file.mimetype.includes('model/gltf') || (file.originalname.includes('.glb') && file.mimetype === "application/octet-stream")))
                            cb(null, (`${new Date().getTime()}-${file.originalname}`).replace(/ /g, '_'))
                        else
                            cb(new Error('invalid file type'))
                    }
                }),
                limits: {fileSize: uploads[type].maxSize}
            }).fields([
                {name: 'image', maxCount: 1},
                {name: 'model', maxCount: 1},
                {name: 'video', maxCount: 1},
                {name: 'audio', maxCount: 1}
            ]);
            upload(req, res, (error) => {
                if (error) {
                    if (error.code && error.code === 'LIMIT_FILE_SIZE')
                        error = errorHandler.errorCode(1001)
                    return setErrorResponse(req, res, error)
                } else {
                    if (req.files && !Object.keys(req.files).length)
                        return next(null);
                    let request = typeof req.formsValidation === "undefined" ? Promise.resolve() : req.formsValidation();
                    request.then(() => {
                        let images = [], audios = [], clothes = {};
                        if (type === 'cloth') {
                            if (req.files.cloth && req.files.cloth.length === 2)
                                req.clothes = {
                                    front: path.join(filePath, req.files.cloth[0].filename),
                                    back: path.join(filePath, req.files.cloth[1].filename)
                                }
                            else if (req.files.cloth && req.files.cloth[0] && req.files.cloth.length !== 2)
                                throw errorHandler.errorCode(2102);
                        } else if (type === 'model') {
                            if (req.files.model && req.files.model.length === 1)
                                req.model = path.join(filePath, req.files.model[0].filename)
                            else
                                throw errorHandler.errorCode(2102);
                        }

                        return next(null)
                    })
                        .catch(err => {
                            setErrorResponse(req, res, err)
                            for (let type of Object.keys(req.files)) {
                                for (let file of req.files[type]) {
                                    fs.unlink(path.join(appDir(), file.path), () => {
                                    });
                                }
                            }
                        })
                }
            });
        }
    }
};
