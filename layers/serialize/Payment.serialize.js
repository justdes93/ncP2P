const Const = require('@core/Const')
const Filter = require('@filter/Payment.filters')


const create = (req, _, next) => {   
    req.body = { 
        card: req.body.card, 
        amount: req.body.amount,
        refId: req.body.refId || '',
        partnerId: req.body.partnerId,
        course: req.body.course || 0,
        filter: req.body.filter? {
            type: req.body.filter.type || Const.payment.filter.types.DEFAULT,
            conv: req.body.filter.conv || 0,
            confirm: req.body.filter.confirm || 0,
            round: req.body.filter.round || 1
        } : null
    }

    next()
}

const block = (req, _, next) => {   
    req.body = { 
        card: req.body.card, 
    }

    next()
}

const get = (req, _, next) => {   
    req.body = { 
        id: req.body.id, 
    }

    next()
}

const push = (req, _, next) => {   
    req.body = { 
        id: req.body.id, 
        amount: req.body.amount,
        auto: req.body.auto
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
    block,
    list,
    get,
    push
}
