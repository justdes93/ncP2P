const Filter = require('@filter/Invoice.filters')

const { toObjectId } = require('@utils/utils')


const create = (req, _, next) => {   
    req.body = { 
        amount: req.body.amount,
        refId: req.body.refId || '',
        partnerId: req.body.partnerId || '',
        bank: req.body.bank || null,
        client: req.body.client || null,
        ncpayConv: req.body.conv,
        isRisk: req.body.isRisk || false,
        isBn: req.body.isBn || false,
        template: req.body.template || null, 

        // redirectBack: req.body.redirectBack || null,
        // redirectReject: req.body.redirectReject || null,
        // redirectConfirm: req.body.redirectConfirm || null
    }

    next()
}

const get = async (req, _, next) => {   
    req.body = { 
        id: toObjectId(req.body.id),
    }

    next()
}

const change = async (req, _, next) => {   
    req.body = { 
        id: toObjectId(req.body.id),
        amount: req.body.amount
    }

    next()
}

const pay = async (req, _, next) => {   
    req.body = { 
        hash: req.body.hash,
    }

    next()
}

const list = (req, _, next) => {   
    req.body = { 
        filter: Filter.admin(req.body.filter), 
        page: req.body.page,
        limit: req.body.limit
    }

    next()
}


module.exports = {
    create,
    pay,
    get,
    change,
    list
}
