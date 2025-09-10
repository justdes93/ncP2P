const Const = require('@core/Const')
const {Schema, model, Types} = require('mongoose')

const schema = new Schema({
    payment: {type: String},
    card: {type: String},
    tailId: {type: String, default: null},
    amount: {type: Number},
    status: {type: String, default: Const.tail.statusList.CREATE},

    createdAt: { type: Number },
    updatedAt: { type: Number }
}, {
    timestamps: { currentTime: () => Date.now() }
})

module.exports = model('Tail', schema)
