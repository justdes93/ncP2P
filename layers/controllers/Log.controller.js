const Log = require('@models/Log.model')

const Const = require('@core/Const')
const Exception = require('@core/Exception')


async function create(data={}) {
    try {
        const log = new Log(data)    
        return await save(log) 
    }
    catch(err) {
        console.log('======================== err in save log', err);
        
        return null
    }
}

async function getAutoStatistic(user, timestart=0, timestop=Infinity) {  
    const options = { createdAt: { $gt: timestart, $lt: timestop } }

    const dataMono = await Log.aggregate([
        { $match: { ...options, method: Const.bankList.MONO }},
        { $group: {
            _id: null,
            count: { $sum: 1 },
            countConfirm: { $sum: { $cond: { if: { $eq: ['$statusCode', "200"] }, then: 1, else: 0 }}},
        }},
        { $project: {
            count: 1,
            countConfirm: 1,
            conversion: { $divide: [ "$countConfirm", "$count" ] },
        }}
    ]) 

    const dataPrivat = await Log.aggregate([
        { $match: { ...options, method: Const.bankList.PRIVAT }},
        { $group: {
            _id: null,
            count: { $sum: 1 },
            countConfirm: { $sum: { $cond: { if: { $eq: ['$statusCode', "200"] }, then: 1, else: 0 }}},
        }},
        { $project: {
            count: 1,
            countConfirm: 1,
            conversion: { $divide: [ "$countConfirm", "$count" ] },
        }}
    ]) 
   
    return {
        mono: dataMono.length? dataMono[0] : null,
        privat: dataPrivat.length? dataPrivat[0] : null,
    }
}

async function save(log) {
    try { return await log.save() }
    catch(e) { throw Exception.notCanSaveModel }
}

async function get(_id) {
    const log = await Log.findOne({ _id })
    if(!log) { throw Exception.notFind }

    return log
}


module.exports = { 
    create,
    getAutoStatistic,
     
    get
}
