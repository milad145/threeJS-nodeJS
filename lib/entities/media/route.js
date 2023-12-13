const express = require("express");
const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");
//========================
const MediaService = require('./service');
const mediaService = new MediaService;
// ===============================================
const assist = require("lib/modules/assist");

const {isLogin, isValidCustomID} = require("../../middlewares/common");
//========================
module.exports = (() => {
    const router = express.Router();

//======================== POST ========================//

    router.post("/getVerifyCode/:media", isValidCustomID('media'), isLogin, (req, res) => {
        let {media} = req.params;
        let {type} = req.body;
        if (['delete', 'edit'].includes(type)) {
            return mediaService.getVerifyCode(media, type)
                .then(() => {
                    res.send(true)
                })
                .catch(err => assist.setErrorResponse(req, res, err));
        }
    });

//======================== PATCH ========================//

    router.patch("/:media", isValidCustomID('media'), isLogin, (req, res) => {
        const {media} = req.params;
        let {verifyCode} = req.body
        return mediaService.editMedia(media, verifyCode, req.user.role, 'edit')
            .then(() => {
                res.send(true)
            })
            .catch(err => assist.setErrorResponse(req, res, err));
    });

    router.patch("/activate/:media", isValidCustomID('media'), isLogin, (req, res) => {
        const {media} = req.params;
        return mediaService.activateMedia(media, req.user.role, req.user.branch)
            .then(() => {
                res.send(true)
            })
            .catch(err => assist.setErrorResponse(req, res, err));
    });

//======================== DELETE ========================//

    router.delete("/:media", isValidCustomID('media'), isLogin, (req, res) => {
        const {media} = req.params;
        let {verifyCode} = req.body
        return mediaService.editMedia(media, verifyCode, req.user.role, 'delete')
            .then(() => {
                res.send(true)
            })
            .catch(err => assist.setErrorResponse(req, res, err));
    });

//======================== GET ========================//

    router.get("/list", isLogin, (req, res) => {
        mediaService.list(req.user._id)
            .then(result => res.json(result))
            .catch(err => assist.setErrorResponse(req, res, err));
    });

    router.get("/:media", isValidCustomID('media'), isLogin, (req, res) => {
        mediaService.getMedia(req.params.media, req.user.role)
            .then(media => {
                res.json({media, clientUrl: EnvConfig["clientUrl"], myBranch: req.user.branch})
            })
            .catch(err => assist.setErrorResponse(req, res, err));
    });

    return router;
})();
