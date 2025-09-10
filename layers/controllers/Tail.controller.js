const Tail = require('@models/Tail.model')
const Const = require('@core/Const')
const { makeOrder } = require('@utils/NcApi')


async function create(card, amount, payment) {         
    const tail = new Tail({ amount, card, payment })
    await save(tail)   

    makeOrder(card, amount, payment, async (invoice) => {
        try {
            const newTail = await get(tail.id)
        
            newTail.tailId = invoice.body.id
            newTail.status = Const.tail.statusList.WAIT
            
            await save(newTail)
        }
        catch(error) {
            console.log('----cant bind tail:', invoice.body)
            console.log(error)
        }
    })

    return tail
}

async function close(tailId, status) {   
    const tail = await Tail.findOne({ tailId })
    if(!tail) { throw Exception.notFind }
    if(tail.status === Const.tail.statusList.CONFIRM || tail.status === Const.tail.statusList.REJECT) { throw Exception.notFind }
    
    if(status === 'CONFIRM') { tail.status = Const.tail.statusList.CONFIRM } 
    if(status === 'REJECT') { tail.status = Const.tail.statusList.REJECT } 

    await save(tail)
    return tail.payment
}

async function list(payment) {       
    const list = await Tail.find({ payment }) 

    return list
}

async function get(_id) {
    const tail = await Tail.findOne({ _id })
    if(!tail) { throw Exception.notFind }
    
    return tail
}

async function save(payment) {
    try { return await payment.save() }
    catch(e) { throw Exception.notCanSaveModel }
}

module.exports = { 
    create,
    close,
    list
}