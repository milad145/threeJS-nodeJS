const errorHandler = require("lib/modules/errorHandler");
const assist = require("lib/modules/assist");
//========================
const smsService = require('lib/services/sms');
//========================
const MediaQueries = require('lib/entities/media/service');
const mediaQueries = new MediaQueries;

const UserQueries = require('lib/entities/user/service');
const userQueries = new UserQueries;

//========================
class MediaService {
    create(_id, activatorUser, token, verifyToken, details) {
        let media = {_id, activatorUser, tokens: {token, verifyToken}, details}
        return mediaQueries.create(media);
    }

    list(owner) {
        return mediaQueries.find({owner})
            .then(payload => payload);
    }

    getMedia(_id, role) {
        let media = {
            "activatorUser": 1,
            "createdAt": 1,
            "details": 1,
            "modifiedAt": 1,
            "status": 1,
            "tokens": 1,
            "visits": 1,
            "arSettings.tracking_args": 1,
            "editCount": 1
        }
        if (['admin', 'superAdmin'].includes(role))
            media['personalized.phoneNumber'] = 1
        return mediaQueries.get(_id, media, {populate: true})
            .then(media => {
                if (media)
                    return media
                else
                    throw errorHandler.errorCode(2301)
            })
    }

    getVerifyCode(_id, type) {
        return new Promise((resolve, reject) => {
            return mediaQueries.get(_id)
                .then(media => {
                    if (!media)
                        throw errorHandler.errorCode(2201)

                    else if (media['authorization'] && media['authorization']['verifyCodeType'] === type) {
                        let duration = Math.floor((media['authorization']['expireDate'] - new Date()) / (1000 * 60));
                        if (duration >= 0)
                            resolve(true);
                        else
                            resolve(getCode(media['details']['phoneNumber']))
                    } else
                        resolve(getCode(media['details']['phoneNumber']))
                })
                .catch(err => reject(err))
        })

        function getCode(phoneNumber) {
            let verifyCode = assist.getRandomNumberWithCustomDigits(6) + ""
            return mediaQueries.update({_id}, {
                $set: {
                    authorization: {
                        verifyCode: mediaQueries.hashCode(verifyCode),
                        expireDate: new Date(new Date().setMinutes(new Date().getMinutes() + 2)),
                        verifyCodeType: type,
                        failed: 0
                    }
                }
            })
                .then(media => {
                    if (!media)
                        throw errorHandler.errorCode(2201)
                    return smsService.sendPanelCode(phoneNumber, verifyCode)
                })
        }
    }

    editMedia(_id, verifyCode, role, type) {
        verifyCode += "";
        let query = {
            "_id": _id,
            "authorization.verifyCodeType": type,
            "authorization.expireDate": {$gte: new Date()}
        }

        return mediaQueries.getByQuery(query)
            .then(media => {
                if (!media)
                    throw errorHandler.errorCode(2301)
                else if (media['authorization']['failed'] >= 3) {
                    throw errorHandler.errorCode(2309)
                } else {
                    let updateQuery = {}, editCount = media._doc.editCount, canUserEditMedia = true,
                        mediaStatus = media._doc.status;
                    if (type === 'delete')
                        updateQuery = {$set: {status: -1}}
                    else if (type === 'edit') {
                        if (role === 'user' && (editCount >= 2 || mediaStatus === -1))
                            canUserEditMedia = false;
                        else
                            updateQuery = {$set: {status: 1}, $inc: {editCount: 1}}
                    }

                    if (mediaQueries.compareCodes(verifyCode, media['authorization']['verifyCode'])) {
                        if (canUserEditMedia)
                            return mediaQueries.update({_id}, updateQuery);
                        else
                            throw errorHandler.errorCode(2307)
                    } else {
                        return mediaQueries.update({_id}, {$inc: {"authorization.failed": 1}})
                            .then(() => {
                                throw errorHandler.errorCode(2303)
                            })
                    }
                }
            })
    }

    activateMedia(_id, role, branch) {
        return mediaQueries.get(_id, {activatorUser: 1}, {populate: true})
            .then(media => {
                if (!media)
                    throw errorHandler.errorCode(2301)
                else if (role === 'manager' && branch !== media.activatorUser.branch)
                    throw errorHandler.errorCode(2308)
                else
                    return mediaQueries.update({_id}, {$set: {status: 1}});
            })
    }
}

//========================
module.exports = MediaService;
//========================
