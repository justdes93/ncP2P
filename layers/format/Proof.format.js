
const admin = (proof) => ({
    id: proof._id,
    invoice: proof.invoice,
    status: proof.status,
    payment: proof.payment,
    gpt: proof.gpt,

    paymentAccessName: proof.paymentAccessName,    
    invoiceSubstatus: proof.invoiceSubstatus,

    client: proof.client,
    confirm: proof.confirm,
    conv: proof.conv,
    ncpayConv: proof.ncpayConv,

    bank: proof.bank,
    amount: proof.amount,
    invoiceAmount: proof.invoiceAmount,
    invoiceCard: proof.invoiceCard,
    invoiceDate: proof.invoiceDate,
    kvitNumber: proof.kvitNumber,
    kvitFile: proof.kvitFile,
    fileLink: proof.fileLink,
    type: proof.type,
    isRisk: proof.isRisk,
    isScam: proof.isScam,
    
    lastCheck: proof.lastCheck,
    isChecking: proof.isChecking,

    createdAt: proof.createdAt
})

const partner = (proof) => ({
    id: proof._id,
    invoice: proof.invoice,
    status: proof.status,

    bank: proof.bank,
    amount: proof.amount,
    kvitNumber: proof.kvitNumber,
    kvitFile: proof.kvitFile,
    createdAt: proof.createdAt
})

const client = (proof) => ({
    id: proof._id,
    invoice: proof.invoice,
    status: proof.status,
    type: proof.type,

    bank: proof.bank,
    amount: proof.amount,
    kvitNumber: proof.kvitNumber,
    kvitFile: proof.kvitFile,
    createdAt: proof.createdAt
})


module.exports = {
    all: (proof) => proof,
    admin,
    partner,
    client
}
