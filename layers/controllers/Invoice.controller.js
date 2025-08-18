const { moreAmount, sendMessage } = require('@utils/telegram.utils')
const NcPay = require('@utils/NcPay')

const Invoice = require('@models/Invoice.model')
const Payment = require('@controllers/Payment.controller')
const Proof = require('@models/Proof.model')
const Jwt = require('@utils/Jwt.utils')
const {sendChange, sendForse} = require('@utils/telegram.utils')

const Exception = require('@core/Exception')
const Const = require('@core/Const')
const config = require('config')

// ---------- SUPPORT FUNCTION ----------

async function getConv(client, timestart=0, timestop=Infinity) {
    let options = {client, createdAt: { $gt: timestart, $lt: timestop }}

    const data = await Invoice.aggregate([
        { $match: options },
        { $group: {
            _id: 1,
            countConfirm: { $sum: { $cond: { if: { $eq: ['$status', "CONFIRM"] }, then: 1, else: 0 }}},
            countReject: { $sum: { $cond: { if: { $eq: ['$status', "REJECT"] }, then: 1, else: 0 }}},
            count: { $sum: 1 },
        }}
    ]) 
    
    const Conv = data[0]
    if(!Conv) { return { conv: -1, confirm: -1, count: -1 } }

    const conv = Conv.countConfirm / (Conv.count || 1) 

    return {
        confirm: Conv.countConfirm,
        count: Conv.count,
        conv
    }
}

async function setSubstatus(invoice) {    
    if(!invoice || !invoice._id) { return }
    
    try {
        let substatus = null

        if(invoice.status !== Const.invoice.statusList.VALID) { substatus = invoice.status }
        else { substatus = invoice.validOk? 'VALID-OK' : Const.invoice.statusList.VALID }
        
        const list = await Proof.find({ status: { $in: Const.proof.activeStatusList }, invoice })

        for(let i = 0; i < list.length; i++) {
            const proof = list[i]
            proof.invoiceSubstatus = substatus
    
            await proof.save()
        }
    }
    catch(err) {
        console.log('### ------- refresh payment')
        console.log(err)
    }
}

// ---------- MAIN ----------

async function create({ amount, bank, refId, partnerId, client, ncpayConv, isRisk, isBn, redirectBack=null, redirectReject=null, redirectConfirm=null }) {      
    console.log("test------------------------------")
    
    const isExist = refId && !!(await Invoice.findOne({ refId })) 
    if(isExist) { throw Exception.isExist }

    // const activeInvoice = await Invoice.findOne({ client, status: Const.invoice.activeStatusList, validOk: false })
    const activeInvoices = await Invoice.find({ client, status: Const.invoice.activeStatusList, validOk: false })
    const activeCount = activeInvoices.length

    const blockInvoice = await Invoice.findOne({ client, isScam: true })
    const isClientWait = client && ((!ncpayConv?.trust && activeCount > 0) || (ncpayConv?.trust && activeCount > 2))
    const isClientBlock = client && !!(blockInvoice) 

    const testClients = ['test_client', '794_6311f3e40c3283cdb1d36a70', '881_680a4766a46c55d20a1decf9']
    if(isClientBlock && !testClients.includes(client)) { throw Exception.clientIsBlocked }    
    if(isClientWait && !testClients.includes(client)) { throw Exception.clientHasActive }    

    const { conv, confirm } = await getConv(client)
    
    let payment = null
    //if(Math.random() > Const.invoice.ncPayRandom) { payment = await Payment.choiceBest(amount, { type: Const.payment.filter.types.NCPAY, conv, confirm }) }
    if(isBn) { payment = await Payment.choiceBest(amount, { type: Const.payment.filter.types.NCPAY, conv, confirm }) }
    if(!payment) { payment = await Payment.choiceBest(amount, { type: Const.payment.filter.types.DEFAULT, conv, confirm }) }
    if(!payment) { 
        const data = await Payment.getList({ status: Const.payment.statusList.ACTIVE })
        const activePayments = data.list

        return {
            errorTitle: "notFind",
            payload: activePayments.map(({_id, card, status, minLimit, maxLimit, current}) => ({ _id, card, status, minLimit, maxLimit, current }))
        }
    }

    const invoice = new Invoice({ 
        paymentAccessId: payment.accessId,
        refId, partnerId,
        initialAmount: amount,
        amount, 
        bank, client,
        payment: payment._id,
        paymentRefId: payment.refId,
        paymentPartnerId: payment.partnerId,
        card: payment.card,
        conv, confirm,
        ncpayConv,
        isRisk,

        // redirectBack, 
        // redirectReject, 
        // redirectConfirm
    })     

    const hash = Jwt.generateLinkJwt(invoice._id)
    const payPageUrl = config.get('payPageUrl')

    invoice.payLink = `${payPageUrl}?hash=${hash}`

    await save(invoice)
    await Payment.refresh(payment._id)
     
    return invoice
}

async function forse(user, id, status=Const.invoice.statusList.REJECT) {
    const invoice = await get(id)
    invoice.status = status
    const newInvoice = await save(invoice)

    // NcPay.callback(newInvoice)
    sendForse(newInvoice)
    
    await Payment.refresh(invoice.payment)

    return invoice
}

async function change(user, id, amount) {
    const invoice = await get(id)
    if(invoice.status !== Const.invoice.statusList.CONFIRM) { throw Exception.notFind }
    invoice.amount = amount
    const newInvoice = await save(invoice)

    // NcPay.callback(newInvoice)
    sendChange(newInvoice)

    await Payment.refresh(invoice.payment)

    return invoice
}

async function finalize(user, id, status=Const.invoice.statusList.REJECT, stopCallback=false) {
    const invoice = user? await getActiveByUser(user, id) : await getActive(id)
    invoice.status = status
    const newInvoice = await save(invoice)

    if(!stopCallback) { NcPay.invoiceCallback(newInvoice) }
    
    await Payment.refresh(invoice.payment)

    return invoice
}

async function toValid(user, id) {
    const invoice = await getByUser(user, id)
    if(invoice.status !== Const.invoice.statusList.REJECT) { throw Exception.notFind }

    invoice.status = Const.invoice.statusList.VALID

    const newInvoice = await save(invoice)
    await Payment.refresh(invoice.payment)

    return newInvoice
}

async function toValidOk(user, id) {
    const invoice = await getActiveByUser(user, id)
    invoice.validOk = !invoice.validOk
    invoice.status = Const.invoice.statusList.VALID

    const newInvoice = await save(invoice)
    await Payment.refresh(invoice.payment)

    try {
        const proofs = await Proof.find({ invoice })
        proofs.forEach(async (proof) => {
            proof.toValidok = Date.now()
            await proof.save()
        })
    }
    catch(err) {
        console.log(err)        
    }

    return newInvoice
}

async function toScam(id) {
    const invoice = await get(id)
    invoice.isScam = !invoice.isScam

    const newInvoice = await save(invoice)

    try {
        const proofs = await Proof.find({ invoice })
        proofs.forEach(async (proof) => {
            proof.isScam = invoice.isScam
            await proof.save()
        })
    }
    catch(err) {
        console.log(err)        
    }

    return newInvoice
}

async function reject(user, id) { return await finalize(user, id, Const.invoice.statusList.REJECT) }
async function confirm(id, stopCallback=false) { return await finalize(null, id, Const.invoice.statusList.CONFIRM, stopCallback) }

async function changeAmount(id, amount) {    
    const invoice = await getActive(id)

    invoice.amount = amount

    return await save(invoice)
}

async function close(id, amount) {    
    const invoice = await get(id)

    if(invoice.status === Const.invoice.statusList.CONFIRM) { throw Exception.notFindConfirm }
    if(parseInt(invoice.amount) === parseInt(amount)) { return await confirm(id) }

    const delta = amount - invoice.initialAmount
    const available = await Payment.getMaxAvailable(invoice.payment, invoice)

    if(delta <= available) { 
        await changeAmount(id, amount)
        return await confirm(id)
    }

    try {
        console.log('SEND CUSTOM CALLBACK')
        NcPay.invoiceCallback({_doc: {...invoice, amount: invoice.amount + available, status: Const.invoice.statusList.CONFIRM }})
        moreAmount(invoice, amount)
    }
    catch(err) {
        console.log('|||--- ', err)        
    }
    
    await changeAmount(id, amount)    
    return await confirm(id, true) 
}

async function pay(id) {
    const invoice = await getActive(id)

    invoice.status = Const.invoice.statusList.VALID 

    const newInvoice = await save(invoice)
    await Payment.refresh(invoice.payment)

    return newInvoice
}


// ---------- STATISTIC ----------

async function getStatistics(user, timestart=0, timestop=Infinity, format="%Y-%m-%d", options={}) { 
    if(user && user.access === Const.userAccess.MAKER) { options.paymentAccessId = user.accessId }
  
    const data = await Invoice.aggregate([
        { $match: { ...options, createdAt: { $gt: timestart, $lt: timestop } }},
        { $addFields: {
            date: { $toDate: '$createdAt' },
            dt: { $subtract: [ "$updatedAt", "$createdAt" ]},
        }},
        { $group: {
            _id: { $dateToString: { format, date: "$date" } },
            count: { $sum: 1 },
            total: { $sum: '$amount'},

            countConfirm: { $sum: { $cond: { if: { $eq: ['$status', "CONFIRM"] }, then: 1, else: 0 }}},
            totalConfirm: { $sum: { $cond: { if: { $eq: ['$status', "CONFIRM"] }, then: '$amount', else: 0 }}},
            totalInitialConfirm: { $sum: { $cond: { if: { $eq: ['$status', "CONFIRM"] }, then: '$initialAmount', else: 0 }}},
            
            countValid: { $sum: { $cond: { if: { $and: [ { $eq: ['$status', "VALID"] }, { $eq: ['$validOk', false] } ] }, then: 1, else: 0 }}},
            totalValid: { $sum: { $cond: { if: { $and: [ { $eq: ['$status', "VALID"] }, { $eq: ['$validOk', false] } ] }, then: '$amount', else: 0 }}},

            countValidOk: { $sum: { $cond: { if: { $and: [ { $eq: ['$status', "VALID"] }, { $eq: ['$validOk', true] } ] }, then: 1, else: 0 }}},
            totalValidOk: { $sum: { $cond: { if: { $and: [ { $eq: ['$status', "VALID"] }, { $eq: ['$validOk', true] } ] }, then: '$amount', else: 0 }}},

            dt: { $sum: '$dt' }
        }},
        { $sort: { _id: 1 } },
        { $project: {
            count: 1,
            total: 1,

            countConfirm: 1,
            totalConfirm: 1,
            totalInitialConfirm: 1,

            countValid: 1,
            totalValid: 1,
            
            countValidOk: 1,
            totalValidOk: 1,

            conversion: { $divide: [ {$sum: [ "$countConfirm", "$countValidOk"]}, "$count" ] },
            dt: 1,
        }}
    ]) 
    
    let count = 0
    let total = 0

    let confirmCount = 0
    let totalConfirm = 0
    let totalInitialConfirm = 0

    let countValid = 0
    let totalValid = 0

    let countValidOk = 0
    let totalValidOk = 0

    let totalValidandValidOk = 0

    let conversion = 0
    let avarageTime = 0
    let avarageSum = 0


    data.forEach((item) => {
        count += item.count
        confirmCount += item.countConfirm
        countValid += item.countValid
        countValidOk += item.countValid

        total += item.total
        totalConfirm += item.totalConfirm
        totalInitialConfirm += item.totalInitialConfirm
        totalValid += item.totalValid
        totalValidOk += item.totalValidOk

        avarageTime += item.dt
    })   

    conversion = confirmCount / (count || 1)
    avarageTime = avarageTime / (count || 1)
    avarageSum = totalConfirm / (confirmCount || 1)
    totalValidandValidOk = totalValid + totalValidOk
        
    return {
        count,
        confirmCount,
        conversion,
        total,
        totalConfirm,
        totalInitialConfirm,
        avarageSum,
        avarageTime,
        countValid,
        countValidOk,
        totalValid,
        totalValidOk,
        totalValidandValidOk
    }
    
    //data
}


// ---------- LISTS ----------

async function list(user, options, page, limit) {       
    const sort = { createdAt: -1 }
    const skip = (page - 1) * limit

    if(user && user.access === Const.userAccess.MAKER) { options.paymentAccessId = user.accessId }
    const List = await getList(options, sort, skip, limit)

    return { 
        list: List?.list || [], 
        count: List?.count || 0
    }
}

// ---------- DEFAULT ----------

async function save(invoice) {    
    try { 
        setSubstatus(invoice).then()

        return await invoice.save() 
    }
    catch(e) { throw Exception.notCanSaveModel }
}

async function get(_id) {
    const invoice = await Invoice.findOne({ _id })
    if(!invoice) { throw Exception.notFind }
    
    return invoice
}

async function getByUser(user, id) {
    const invoice = await get(id)

    if(user.access === Const.userAccess.MAKER) {
        if(!invoice.paymentAccessId.equals(user.accessId)) { throw Exception.notFind }
    }

    return invoice
}

async function getActive(_id) {
    const invoice = await Invoice.findOne({ _id, status: {$in: Const.invoice.activeStatusList} })
    if(!invoice) { throw Exception.notFindActive }

    return invoice
}

async function getActiveByUser(user, id) {
    const invoice = await getActive(id)

    if(user.access === Const.userAccess.MAKER) {
        if(!invoice.paymentAccessId.equals(user.accessId)) { throw Exception.notFindActive }
    }

    return invoice
}

async function getList(options={}, sort={}, skip=0, limit=50) {       
    try { 
        const list = await Invoice.find(options).sort(sort).skip(skip).limit(limit)  
        const count = await Invoice.countDocuments(options)

        return { list, count }
    }
    catch(err) { 
        return null
    }
}


module.exports = { 
    create,
    reject,
    confirm,
    changeAmount,
    close,
    pay,
    change,
    
    toValid,
    toValidOk,
    toScam,
    
    forse,
    getStatistics,

    get,
    list
}
