const { getKvitNumber, getBankByKvit, getPrivatKvitNumber } = require('@utils/pdf.utils')

const Proof = require('@models/Proof.model')
const Invoice = require('@controllers/Invoice.controller')
const Payment = require('@controllers/Payment.controller')

const Exception = require('@core/Exception')
const Const = require('@core/Const')
const Gpt = require('@utils/gpt.utils')
const DropBox = require('@utils/DropBox')

// const CheckGov = require('@utils/CheckGov')
// const Privat = require('@utils/Privat')
const Kvits = require('@utils/Kvits.utils')
const { sendMessage } = require('@utils/telegram.utils')

// ------ SUPPORT FUNCTION ------


async function getNumberByKvit(file) {   
    if(!file) { return null }
    const kvitBank = await getBankByKvit(file)    
    
    if(kvitBank === Const.bankList.MONO) { return await getKvitNumber(file) }
    if(kvitBank === Const.bankList.PRIVAT) { return await getPrivatKvitNumber(file) }

    return null
}

// ----- MIAI -----

async function createByNumber(invoiceId, kvitNumber) {
    if(!kvitNumber) { throw Exception.invalidValue }

    const list = await Proof.find({ invoice: invoiceId, status: {$in: Const.proof.activeStatusList} })
    if(list.length >= 2) { throw Exception.manyProofs }
    
    const number = kvitNumber.toUpperCase()

    const invoice = await Invoice.get(invoiceId)   
    if(invoice.status === Const.invoice.statusList.CONFIRM) { throw Exception.notFind }
    if(invoice.isScam) { throw Exception.notFind }

    const payment = await Payment.softGet(invoice.payment)

    let invoiceSubstatus

    if(invoice.status === Const.invoice.statusList.VALID) {
        invoiceSubstatus = invoice.validOk? 'VALID-OK' : Const.invoice.statusList.VALID
    }
    else {
        invoiceSubstatus = invoice.status
    }

    const proof = new Proof({
        invoice: invoiceId,
        invoiceRefId: invoice.refId,
        invoicePartnerId: invoice.partnerId,
        invoiceAmount: invoice.initialAmount,
        invoiceCard: invoice.card,
        invoiceDate: invoice.createdAt,
        bank: invoice.bank,

        invoiceSubstatus,
        client: invoice.client,
        conv: invoice.conv,
        confirm: invoice.confirm,
        ncpayConv: invoice.ncpayConv,
        isRisk: invoice.isRisk,

        paymentAccessId: payment.accessId,
        paymentAccessName: payment.accessName,
        payment: invoice.payment,
        paymentRefId: payment.refId,
        paymentPartnerId: payment.partnerId,
        type: payment?.filter?.type || Const.payment.filter.types.DEFAULT,

        kvitNumber: number,
        kvitFile: ''
    })

    if(invoice.status === Const.invoice.statusList.WAIT) {
        invoice.status = Const.invoice.statusList.VALID
        await Invoice.save(invoice)
    }

    await save(proof)

    verify(proof._id).then() 
    gpt(proof._id).then()
    
    return proof
}

async function createByFile(invoiceId, kvitFile='') {
    if(!kvitFile) { throw Exception.invalidValue }

    const list = await Proof.find({ invoice: invoiceId, status: {$in: Const.proof.activeStatusList} })
    if(list.length >= 2) { throw Exception.manyProofs }

    const invoice = await Invoice.get(invoiceId)   
    if(invoice.status === Const.invoice.statusList.CONFIRM) { throw Exception.notFind }
    if(invoice.isScam) { throw Exception.notFind }
    
    let number = await getNumberByKvit(kvitFile) 
    if(number) { number = number.toUpperCase() }

    const fileLink = await DropBox.saveKvit(kvitFile)
    const payment = await Payment.softGet(invoice.payment)

    let invoiceSubstatus

    if(invoice.status === Const.invoice.statusList.VALID) {
        invoiceSubstatus = invoice.validOk? 'VALID-OK' : Const.invoice.statusList.VALID
    }
    else {
        invoiceSubstatus = invoice.status
    }

    const proof = new Proof({
        invoice: invoiceId,
        invoiceRefId: invoice.refId,
        invoicePartnerId: invoice.partnerId,

        invoiceAmount: invoice.initialAmount,
        invoiceCard: invoice.card,
        invoiceDate: invoice.createdAt,
        bank: invoice.bank,

        invoiceSubstatus,
        client: invoice.client,
        conv: invoice.conv,
        confirm: invoice.confirm,
        ncpayConv: invoice.ncpayConv,
        type: payment?.filter?.type || Const.payment.filter.types.DEFAULT,
        isRisk: invoice.isRisk,

        paymentAccessId: payment.accessId,
        paymentAccessName: payment.accessName,
        payment: invoice.payment,
        paymentRefId: payment.refId,
        paymentPartnerId: payment.partnerId,

        kvitNumber: number,
        kvitFile,
        fileLink
    })

    await save(proof) 

    if(invoice.status === Const.invoice.statusList.WAIT) {
        invoice.status = Const.invoice.statusList.VALID
        await Invoice.save(invoice)
    }

    verify(proof._id).then() 
    gpt(proof._id).then()

    return proof
}

async function verify(id, userId=null) {        
    const proof = await get(id)
    if(!proof.kvitNumber) { return }
    
    let bank = proof.bank

    const regexMono = /\b[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}\b/
    if(regexMono.test(proof.kvitNumber)) { bank = Const.bankList.MONO } 

    const regexPrivat = /P24[A-Z0-9]{16}/
    if(regexPrivat.test(proof.kvitNumber)) { bank = Const.bankList.PRIVAT } 

    let data = null

    proof.bank = bank
    proof.isChecking = true
    await save(proof)

    console.log('go cheking', bank, proof.kvitNumber)

    const transaction = await Kvits.checkByBank(bank, proof.kvitNumber)
    console.log('GET TRANSACTION', transaction)
    
    if(transaction && transaction.number?.toUpperCase() === proof.kvitNumber) { 
        const { timestamp, card, amount } = transaction
        data = { kvitNumber: proof.kvitNumber, card, amount, date: timestamp, auto: true }
    }

    console.log('DATA', data);
    
    proof.isChecking = false
    proof.lastCheck = !!data? 1 : -1
    await save(proof)

    return await complite(proof, data, userId) 
}

async function complite(proof, transaction, userId=null) {
    console.log('FUNCTION COMPLITE PROOF')
    console.log('Transaction Data:', transaction)
    
    if(!transaction || !transaction.amount) { return }
    if(transaction.auto && Math.abs(proof.invoiceAmount - transaction.amount) > 250) { return }
    
    proof.kvitNumber = transaction?.kvitNumber?.toUpperCase()
    proof.amount = transaction.amount
    proof.status = Const.proof.statusList.CONFIRM 
    proof.toConfirm = Date.now() 
    if(userId) { proof.user = userId }

    if(transaction.card) {
        const payment = await Payment.get(proof.payment)

        if(payment.card.substring(0, 6) !== transaction.card.substring(0, 6)) { return console.log('card 6 not match') }
        if(payment.card.substring(payment.card.length - 4, payment.card.length) !== transaction.card.substring(transaction.card.length - 4, transaction.card.length)) { return console.log('card 4 not match') }
        if(transaction.date) {
            console.log('Tx date: ', transaction.date)
            console.log('In date: ', proof.invoiceDate)
            console.log('Dt date: ', proof.invoiceDate - transaction.date)
            console.log('invalid', transaction.date + 60 * 1000 < proof.invoiceDate);
            
            if(transaction.date + 60 * 1000 < proof.invoiceDate) { return console.log('date is not valid') }
        }
    }

    const candidat = await Proof.findOne({ 
        _id: { $ne: proof._id },
        kvitNumber: proof.kvitNumber, 
        status: Const.proof.statusList.CONFIRM
    })
    
    if(candidat) { throw Exception.isExist }
    
    const invoice = await Invoice.get(proof.invoice)
    if(invoice.status === Const.invoice.statusList.REJECT) { throw Exception.iAmTeapot }

    const saveProof = await save(proof)

    try {
        const res = !!await Invoice.close(proof.invoice, proof.amount)
    }   
    catch(err) {
        console.log('||| Confirm Invoice Err: ', err)
        throw err
    }

    return saveProof
}

async function gpt(id) {
    console.log('GPT', id)
    
    const proof = await get(id)
    const fileName = proof.kvitFile
    
    const arr = fileName.split('.')
    if(!arr.length) { return false }

    const exts = ['png', 'jpg']
    const ext = arr[arr.length - 1]    

    let data = null

    if(exts.includes(ext)) { data = await Gpt.getImageData(fileName) }
    if(ext === 'pdf') { data = await Gpt.getPdfData(fileName) }
    
    if(!data) { return false }
        
    proof.gpt.number = data['invoice_number']
    proof.gpt.amount = data["amount"]
    proof.gpt.card = data["recipient_card"]
    proof.gpt.date = data["invoice_date"]

    const regexPrivat = /P24[A-Z0-9]{16}/
    const isPrivate = regexPrivat.test(proof.gpt.number)

    const regexMono = /\b[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}\b/
    const isMono = regexMono.test(proof.gpt.number)

    if((isPrivate || isMono) && !!proof.gpt.number) { proof.kvitNumber = proof.gpt.number }
    await save(proof)
    if((isPrivate || isMono) && !!proof.gpt.number) { await verify(id) }

    return true
}

// ---------- SUPPORT ------------

async function decline(id, userId) {
    const proof = await get(id)
    if(!Const.proof.activeStatusList.includes(proof.status)) { throw Exception.notFind }

    proof.status = Const.proof.statusList.REJECT
    proof.toReject = Date.now()
    proof.user = userId

    return await save(proof)
}

async function manual(id) {    
    const proof = await get(id)
    if(!Const.proof.activeStatusList.includes(proof.status)) { throw Exception.notFind }

    if(proof.status === Const.proof.statusList.MANUAL) { proof.status = Const.proof.statusList.WAIT }
    else if(proof.status === Const.proof.statusList.WAIT) { 
        proof.status = Const.proof.statusList.MANUAL 
        proof.toManual = Date.now()
    }

    return await save(proof)
}

async function approve({id, amount, kvitNumber}, userId) {        
    const proof = await get(id)
    if(!Const.proof.activeStatusList.includes(proof.status)) { throw Exception.notFind }

    const findKvit = kvitNumber?.toUpperCase()
    if(!findKvit) { throw Exception.invalidValue }

    const candidat = await Proof.findOne({ 
        _id: { $ne: proof._id },
        kvitNumber: findKvit, 
        status: Const.proof.statusList.CONFIRM
    })
    
    if(candidat) { throw Exception.isExist }

    return await complite(proof, { amount, kvitNumber: findKvit }, userId)
}

async function recheck(id, bank, number, userId) {        
    const proof = await get(id)

    if(!Const.proof.activeStatusList.includes(proof.status)) { throw Exception.notFind }
    if(proof.isChecking) { throw Exception.notFind }

    const findKvit = number?.toUpperCase()
    if(!findKvit) { throw Exception.invalidValue }

    const candidat = await Proof.findOne({ 
        _id: { $ne: proof._id },
        kvitNumber: findKvit, 
        status: Const.proof.statusList.CONFIRM
    })
    
    if(candidat) { throw Exception.isExist }

    proof.bank = bank
    proof.kvitNumber = number

    await save(proof)

    verify(proof._id, userId).then() 

    return proof
}

// ---------- STATISTIC ----------

async function getStatistics(user, timestart=0, timestop=Infinity, options={}, format="%Y-%m-%d") { 
    if(user && user.access === Const.userAccess.MAKER) { options.paymentAccessId = user.accessId }
  
    const data = await Proof.aggregate([
        { $match: { ...options, createdAt: { $gt: timestart, $lt: timestop } }},
        { $addFields: {
            date: { $toDate: '$createdAt' },
            dtToFinal: {
                $cond: [ 
                    { $eq: ["$toManual", 0] },
                    { $subtract: [{ $cond: [{ $gt: ["$toConfirm", 0] }, "$toConfirm", "$toReject"] }, "$createdAt"] },
                    null
                ]
            },
            dtValidOkToFinal: {
                $cond: [
                    { $and: [{ $gt: ["$toManual", 0] }, { $gt: ["$toValidok", 0] }] },
                    { $subtract: [{ $cond: [{ $gt: ["$toConfirm", 0] }, "$toConfirm", "$toReject"] }, "$toValidok"] },
                    null
                ]
            }
        }},
        { $group: {
            _id: { $dateToString: { format, date: "$date" } },
            count: { $sum: 1 },
            finalCount: { $sum: { $cond: [{ $in: ["$status", ["CONFIRM", "REJECT"]] }, 1, 0] }},
            avgWaitToFinal: { $avg: "$dtToFinal" },
            avgValidOkToFinal: { $avg: "$dtValidOkToFinal" }
        }},
        { $sort: { _id: 1 } },
        { $project: {
            count: 1,
            finalCount: 1,
            avgWaitToFinal: { $ifNull: ["$avgWaitToFinal", 0] },
            avgValidOkToFinal: { $ifNull: ["$avgValidOkToFinal", 0] }
        }}
    ]) 
    
    let count = 0
    let finalCount = 0

    let waitToFinalConst = 0
    let waitToFinal = 0

    let validOkToFinalConst = 0
    let validOkToFinal = 0

    data.forEach((item) => {       
        count += item.count
        finalCount += item.finalCount

        if(item.avgWaitToFinal) {
            waitToFinalConst += 1
            waitToFinal += item.avgWaitToFinal
        }
        if(item.avgValidOkToFinal) {
            validOkToFinalConst += 1
            validOkToFinal += item.avgValidOkToFinal
        }
    })   

    const avgWaitToFinal = waitToFinal / (waitToFinalConst || 1)
    const avgValidOkToFinal = validOkToFinal / (validOkToFinalConst || 1)

    return {
        finalCount,
        avgWaitToFinal,
        avgValidOkToFinal
    }
}


// ---------- LISTS ------------

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


async function save(proof) {
    try { return await proof.save() }
    catch(e) { throw Exception.notCanSaveModel }
}

async function get(_id) {
    const proof = await Proof.findOne({ _id })
    if(!proof) { throw Exception.notFind }

    return proof
}

async function getList(options={}, sort={}, skip=0, limit=50) {   
    try { 
        const list = await Proof.find(options).sort(sort).skip(skip).limit(limit)  
        const count = await Proof.countDocuments(options)

        return { list, count }
    }
    catch(err) { 
        return null
    }
}


module.exports = { 
    createByNumber,
    createByFile,
    verify,

    decline,
    approve,
    manual,
    recheck,

    getStatistics,

    get,
    list,
    gpt
}
