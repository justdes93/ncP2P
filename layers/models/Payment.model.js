const {Schema, model, Types} = require('mongoose')
const Const = require('@core/Const')

const schema = new Schema({
    author: { type: String, default: '' },
    accessId: { type: Types.ObjectId, ref: 'Partner' },
    accessName: { type: String, default: '' },

    refId: { type: String, default: '' },
    partnerId: { type: String, default: '' },
    tailId: { type: String, default: null },
    
    card: { type: String },
    amount: { type: Number },
    course: { type: Number, default: 0 },
    
    initialAmount: { type: Number },
    currentAmount: { type: Number },
    tailAmount: { type: Number, default: 0 },

    tails: [ { type: Object, ref: 'Tail' } ],

    minLimit: { type: Number, default: Const.minPaymentLimit },
    maxLimit: { type: Number },

    status: { type: String, default: Const.payment.statusList.ACTIVE }, // ACTIVE / BLOCKED / SUCCESS

    isOneWait: { type: Boolean, default: false },
    isOneValid: { type: Boolean, default: false },
    isAllValidOk: { type: Boolean, default: false },

    isWait: { type: Boolean, default: false },
    isRefresh: { type: Boolean, default: true },
    isTail: { type: Boolean, default: false },
    isFreeze: { type: Boolean, default: false },
    priority: { type: Boolean, default: false },

    filter: {
        type: { type: String, default: Const.payment.filter.types.DEFAULT },
        conv: { type: Number, default: -1 },
        confirm: { type: Number, default: -1 },
        round: { type: Number, default: 1 }
    },

    createdAt: { type: Number },
    updatedAt: { type: Number }
}, {
    timestamps: { currentTime: () => Date.now() }
})


schema.statics.reserveBest = async function reserveBest(amount, filter = null, session = null) {
    const matchEqual = { status: Const.payment.statusList.ACTIVE, isFreeze: false, isTail: false, isRefresh: true, currentAmount: amount }
    if(filter) {
        if(filter.type) { matchEqual['filter.type'] = filter.type }
        matchEqual['filter.conv'] = { $lte: (filter.conv ?? 0) }
        matchEqual['filter.confirm'] = { $lte: (filter.confirm ?? 0) }
    }

    const sortEqual = { createdAt: 1 }
    let doc = await this.findOneAndUpdate(
        matchEqual,
        { $inc: { currentAmount: -amount }, $set: { updatedAt: Date.now(), isRefresh: false } },
        { sort: sortEqual, returnDocument: 'after', session }
    )

    if(doc) { return doc }

    const matchLimits = { status: Const.payment.statusList.ACTIVE, isFreeze: false, minLimit: { $lte: amount }, maxLimit: { $gte: amount }, currentAmount: { $gte: amount }}
    if(filter) {
        if(filter.type) { matchLimits['filter.type'] = filter.type }
        matchLimits['filter.conv'] = { $lte: (filter.conv ?? 0) }
        matchLimits['filter.confirm'] = { $lte: (filter.confirm ?? 0) }

        if(typeof filter.round === 'number' && filter.round > 1) { matchLimits.$expr = { $eq: [{ $mod: [amount, '$filter.round'] }, 0] } }
    }

    const sortLimits = { priority: -1, createdAt: 1 }
    doc = await this.findOneAndUpdate(
        matchLimits,
        { $inc: { currentAmount: -amount }, $set: { updatedAt: Date.now(), isRefresh: false } },
        { sort: sortLimits, returnDocument: 'after', session }
    )

    return doc
}

schema.index({ status: 1, isFreeze: 1, isTail: 1, isRefresh: 1, currentAmount: 1, createdAt: 1, "filter.type": 1, "filter.conv": 1, "filter.confirm": 1 })
schema.index({ status: 1, isFreeze: 1, minLimit: 1, maxLimit: 1, currentAmount: 1, priority: -1, createdAt: 1, "filter.type": 1, "filter.conv": 1, "filter.confirm": 1 })


module.exports = model('Payment', schema)
