const Const = require('@core/Const')
const {Schema, model, Types} = require('mongoose')

const schema = new Schema({
    name: {type: String},
    accessToken: {type: String},
    privateToken: {type: String},
    callbackUrl: {type: String},
    whiteList: [],

    paymentMinLimit: {
        default: {type: Number, default: Const.payment.minLimit.default},
        customLimit: {type: Number, default: Const.payment.minLimit.customLimit},
        persent: {type: Number, default: Const.payment.minLimit.persent}
    }
})

module.exports = model('Partner', schema)
