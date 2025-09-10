const jwt = require('jsonwebtoken')
const https = require('https')

const Exception = require('@core/Exception')
const config = require('config')


function sendMessage(telegram, text, botToken=config.get('botToken')) {
    try {
        https.get(`https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${telegram}&text=${text}&parse_mode=html`)
        return true
    }
    catch(error) {
        return false
    }
}

function sendAuth(telegram, auth) {
    const text = `Access Token: <code>${auth.accessToken}</code>%0APrivate Token: <code>${auth.privateToken}</code>`

    return sendMessage(telegram, text)
}

function sendCode(telegram) {
    const code = 100000 + parseInt(Math.random() * 900000)

    sendMessage(telegram, `<code>${code}</code>`)

    const secret = config.get('authSecret')
    const token = jwt.sign({ telegram, code }, secret, { expiresIn: '5m' })

    return token
}

function verify(token, telegram, code) {
    const secret = config.get('authSecret')
    const decoded = jwt.verify(token, secret)
    
    if(decoded.code.toString() !== code) { throw Exception.notAuth }
    if(decoded.telegram !== telegram.toString()) { throw Exception.notAuth }
}

function cantNcApiMake(payment, telegram=config.get('adminGroupe')) {
    const text = `Cant make payment in NcApi. id: ${payment}`
    sendMessage(telegram, text)
}

function clientHasActive(invoice, telegram=config.get('adminGroupe')) {
    let text = `Error: Client have active invoice: %0A`
    text += `Id: <code>${invoice._id}</code> %0A`
    text += `Client: <code>${invoice.client}</code> %0A`
    text += `Amount: <code>${invoice.amount}</code> %0A`

    sendMessage(telegram, text)
}

function cantSendCallback(invoice, telegram=config.get('adminGroupe')) {
    const text = `Cant send payment callback to NcPay. id: ${invoice}`
    sendMessage(telegram, text)
}

function moreAmount(invoice, amount, telegram=config.get('adminGroupe')) {
    const text = `Invoice - ${invoice._id} with amount - ${invoice.amount}, will be closed - ${amount}`
    sendMessage(telegram, text)
}

function sendProofs(proofs, telegram) {    
    proofs.forEach((proof) => {        
        let text = ''
        text += `Payment: <code>${proof.payment}</code> %0A`
        text += `Invoice: <code>${proof.invoice}</code> %0A`
        text += `Proof: <code>${proof.proof}</code> %0A`
        text += `${proof.link}`

        sendMessage(telegram, text)
    })
}

function sendOld(payment, telegram=-4768651698) {    
    let text = 'Error Old Refresh'
    text += `Payment Id: <code>${payment.id}</code> %0A`
    text += `Amount: <code>${payment.currentAmount}</code> %0A`
    text += `Status: <code>${payment.status}</code> %0A`

    sendMessage(telegram, text)
}

function sendChange(invoice, telegram=-4768651698) {    
    let text = 'Invoice amount did be change'
    text += `Invoice Id: <code>${invoice.id}</code> %0A`
    text += `Amount: <code>${invoice.amount}</code> %0A`
    text += `Status: <code>${invoice.status}</code> %0A`

    sendMessage(telegram, text)
}

function sendForse(invoice, telegram=-4768651698) {    
    let text = 'Invoice did be forse'
    text += `Payment Id: <code>${invoice.id}</code> %0A`
    text += `Amount: <code>${invoice.amount}</code> %0A`
    text += `Status: <code>${invoice.status}</code> %0A`

    sendMessage(telegram, text)
}


module.exports = { 
    sendMessage,
    sendAuth,
    sendCode,
    verify,

    cantNcApiMake,
    cantSendCallback,
    clientHasActive,
    moreAmount,
    sendProofs,
    sendOld,
    sendChange,
    sendForse
}