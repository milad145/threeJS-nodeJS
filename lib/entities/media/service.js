const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const _ = require('lodash');
//========================
const MediaSchema = require('./schema.js');
const mediaModel = mongoose.model('media', MediaSchema);

//========================
class MediaQueries {

    create(params) {
        params.createdAt = new Date();
        params.modifiedAt = new Date();
        const mediaObject = new mediaModel(params);
        return mediaObject.save()
    }

    find(query, project, options) {
        !_.isUndefined(query) ? true : query = {};
        !_.isUndefined(project) ? true : project = {};
        !_.isUndefined(options) ? true : options = {};
        !_.isUndefined(options.sort) ? true : options.sort = {'_id': -1}
        !_.isUndefined(options.limit) ? true : options.limit = 30;
        !_.isUndefined(options.skip) ? true : options.skip = 0;
        // query.status = 1;
        if (options.populate)
            return mediaModel.find(query, project)
                .sort(options.sort).limit(parseInt(options.limit)).skip(parseInt(options.skip))
        else
            return mediaModel.find(query, project)
                .sort(options.sort).limit(parseInt(options.limit)).skip(parseInt(options.skip))
    }

    aggregate(pipline) {
        !_.isUndefined(pipline) ? true : pipline = [];
        return mediaModel.aggregate(pipline)
    }

    count(query) {
        !_.isUndefined(query) ? true : query = {};
        // query.status = 1;
        return mediaModel.countDocuments(query)
    }

    get(id, project, options) {
        !_.isUndefined(project) ? true : project = {};
        !_.isUndefined(options) ? true : options = {};
        if (options.populate)
            return mediaModel.findOne({_id: id}, project)
        .populate({path: 'activatorUser', select: 'username branch'});
        else
            return mediaModel.findOne({_id: id}, project)
    }

    getByQuery(query, project, options) {
        !_.isUndefined(project) ? true : project = {};
        !_.isUndefined(query) ? true : query = {};
        !_.isUndefined(options) ? true : options = {};
        return mediaModel.findOne(query, project)
    }

    update(query, update, options) {
        !_.isUndefined(query) ? true : query = {}
        !_.isUndefined(options) ? true : options = {}
        !_.isUndefined(options.new) ? true : options.new = true
        !_.isUndefined(options.multi) ? true : options.multi = false
        update.modifiedAt = new Date();
        if (options.multi) {
            return mediaModel.updateMany(query, update, options)
        } else {
            return mediaModel.findOneAndUpdate(query, update, options)
        }
    }

}

module.exports = MediaQueries;


