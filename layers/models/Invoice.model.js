const {Schema, model, Types} = require('mongoose')
const Const = require('../../core/Const')


const schema = new Schema({    
    paymentAccessId: { type: Types.ObjectId, ref: 'Partner' },

    refId: { type: String, default: '' },
    partnerId: { type: String, default: '' },
    
    initialAmount: { type: Number },
    availableAmount: { type: Number },
    amount: { type: Number },

    status: { type: String, default: Const.invoice.statusList.WAIT }, 
    validOk: { type: Boolean, default: false }, 
    payment: { type: Types.ObjectId, ref: 'Payment' },
    paymentRefId: { type: String, default: null },
    paymentPartnerId: { type: String, default: null },
    
    card: { type: String },
    bank: { type: String, default: null },
    client: { type: String, default: null },
    conv: { type: Number, default: -1 },
    confirm: { type: Number, default: -1 },
    ncpayConv: { type: Object, default: null },

    isRisk: {type: Boolean, default: false},
    isScam: {type: Boolean, default: false},

    kvitNumber: { type: String, default: null },
    kvitFile: { type: String, default: null },
    payLink: { type: String, default: null },

    redirectBack: { type: String, default: null }, 
    redirectReject: { type: String, default: null },
    redirectConfirm: { type: String, default: null },

    createdAt: { type: Number },
    updatedAt: { type: Number }
}, {
    timestamps: { currentTime: () => Date.now() }
})

module.exports = model('Invoice', schema)
