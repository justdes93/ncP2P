const { check } = require('express-validator')
const Const = require('../../core/Const')


const create = [
    check('card', 'invalidCard').notEmpty().isCreditCard(),
    check('amount', 'invalidAmount').notEmpty().isFloat({ min: Const.minPaymentLimit, max: Const.maxPaymentLimit }),
    check('refId', 'invalidRefId').optional().isString(),
    check('partnerId', 'invalidRefId').optional().isString(),
    check('course', 'invalidValue').optional().isFloat({ min: 0 }),
    check('filter', 'invalidValue').optional().isObject()
]

const block = [
    check('card', 'invalidCard').notEmpty().isCreditCard(),
]

const get = [
    check('id', 'invalidValue').notEmpty().isMongoId(),
]

const push = [
    check('id', 'invalidValue').notEmpty().isMongoId(),
    check('amount', 'invalidAmount').notEmpty().isFloat({ min: 0, max: Const.maxTail })
]

const list = [
    check('filter', 'invalidValue').optional().isObject(),
    check('page', 'invalidValue').notEmpty().isInt({ min: 0 }),
    check('limit', 'invalidValue').notEmpty().isInt({ min: 0 }),
]


module.exports = {
    create,
    block,
    list,
    get,
    push
}
