const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");
const Schema = mongoose.Schema;
//===========================
const mediaSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    status: {
        type: Number,
        default: 0,
        required: true,
        eval: [-1, 0, 1, 2]
    },
    createdAt: {
        type: Date,
        index: true
    },
    modifiedAt: Date,
    visits: {
        type: Number,
        default: 0,
        required: true
    },
    owner: {type: 'ObjectId', ref: 'user'},
    cloths: [{type: 'ObjectId', ref: 'cloth'}]
}, {collection: "media"});
// ======================

module.exports = mediaSchema;
