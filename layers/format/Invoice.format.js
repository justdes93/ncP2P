const Const = require('@core/Const')


const parnter = (invoice) => ({
    id: invoice._id,
    refId: invoice.refId || '',
    amount: invoice.amount,
    status: invoice.status,
    card: invoice.card,

    kvit: invoice.kvitFile,
    kvitNumber: invoice.kvitNumber,

    createdAt: invoice.createdAt,
})

const admin = (invoice) => ({
    id: invoice._id,
    refId: invoice.refId || '',
    amount: invoice.amount,
    initialAmount: invoice.initialAmount,

    client: invoice.client,
    confirm: invoice.confirm,
    conv: invoice.conv,
    ncpayConv: invoice.ncpayConv,

    status: invoice.status,
    validOk: invoice.validOk,
    card: invoice.card,
    payment: invoice.payment,

    kvit: invoice.kvitFile,
    kvitNumber: invoice.kvitNumber,
    payLink: invoice.payLink,
    isRisk: invoice.isRisk,
    isScam: invoice.isScam,

    createdAt: invoice.createdAt,
})

const client = (invoice) => ({
    id: invoice._id,
    refId: invoice.refId || '',
    partnerId: invoice.partnerId || '',

    amount: invoice.amount,
    initialAmount: invoice.initialAmount,

    status: invoice.status,
    card: invoice.card,

    // redirectBack: invoice.redirectBack || null,
    // redirectReject: invoice.redirectReject || null,
    // redirectConfirm: invoice.redirectConfirm || null,

    createdAt: invoice.createdAt,
})


module.exports = {
    all: (user) => user,
    client,
    parnter,
    admin
}
