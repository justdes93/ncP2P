const { cantSendCallback } = require('./telegram.utils')
const { protectedCallback } = require('./request')

const config = require('config')


const invoiceCallback = (invoice, callback=()=>{}) => {
    try {
        const url = config.get('NcPayUrl') + '/invoice/ncp2p'
        const body = invoice

        console.log('Send to NcPay')
        console.log('url:', url)
        
        protectedCallback(url, body, callback)
    }
    catch(err) {
        console.log('------------Cant send callback to ncApi')
        
        cantSendCallback(invoice.id)
    }
}

const paymentCallback = (payment, callback=()=>{}) => {
    try {
        const url = config.get('NcPayUrl') + '/payment/ncp2p'
        
        const body = { id: payment?.refId, status: payment.status, amount: payment.amount }

        console.log('Send to NcPay')
        console.log('url:', url)
        
        protectedCallback(url, body, callback)
    }
    catch(err) {
        console.log('------------Cant send callback to ncApi')
        
        cantSendCallback(invoice.id)
    }
}


module.exports = { 
    invoiceCallback,
    paymentCallback
}