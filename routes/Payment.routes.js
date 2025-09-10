
const { Router } = require('express')
const { Auth, isAdmin, isMaker, isSupport } = require('@middleware/auth.middleware')
const { access, partnerAccess, adminAccess } = require('@middleware/access.middleware')
const Interceptor = require('@core/Interceptor')
const Telegram = require('@utils/telegram.utils')

const Validate = require('@validate/Payment.validate')
const Serialise = require('@serialize/Payment.serialize')
const Format = require('@format/Payment.format')

const Payment = require('@controllers/Payment.controller')
const BlackList = require('@controllers/BlackList.controller')
const Tail = require('@controllers/Tail.controller')

const Exception = require('@core/Exception')
const { toObjectId } = require('@utils/utils')


const router = Router()


router.post('/create', access, partnerAccess, Validate.create, Serialise.create, 
    Interceptor(async (req, res) => {
        const isBlocked = !!(await BlackList.find(req.body.card))
        if(isBlocked) { throw Exception.cardBlocked }

        const payment = await Payment.create({accessId: req.access.id, author: 'h2h'}, req.body)
        res.status(201).json(Format.parnter(payment))
    })
)

router.post('/create-admin', Auth, isMaker, Validate.create, Serialise.create, 
    Interceptor(async (req, res) => {
        const isBlocked = !!(await BlackList.find(req.body.card))
        if(isBlocked) { throw Exception.cardBlocked }

        const payment = await Payment.create({ accessId: req.user.accessId, author: req.user.login }, req.body)
        res.status(201).json(Format.parnter(payment))
    })
)

router.post('/refresh', access, adminAccess, Validate.get, Serialise.get, 
    Interceptor(async (req, res) => {
        await Payment.refresh(req.body.id)

        res.status(200).json(true)
    })
)

router.post('/block', Auth, Validate.block, Serialise.block, 
    Interceptor(async (req, res) => {
        await BlackList.create(req.body.card)

        res.status(200).json(true)
    })
)

router.post('/push', Auth, Validate.push, Serialise.push, 
    Interceptor(async (req, res) => {
        const { id, amount, auto } = req.body        

        await Payment.pushTail(req.user, id, amount, auto)

        res.status(200).json(true)
    })
)

router.post('/reject', Auth, Validate.get, Serialise.get, 
    Interceptor(async (req, res) => {
        await Payment.reject(req.user, req.body.id)

        res.status(200).json(true)
    })
)

router.post('/freeze', Auth, Validate.get, Serialise.get, 
    Interceptor(async (req, res) => {
        await Payment.freeze(req.user, req.body.id)

        res.status(200).json(true)
    })
)

router.post('/unfreeze', Auth, Validate.get, Serialise.get, 
    Interceptor(async (req, res) => {
        await Payment.unfreeze(req.user, req.body.id)

        res.status(200).json(true)
    })
)

router.post('/toggle-priority', Auth, Validate.get, Serialise.get, 
    Interceptor(async (req, res) => {
        await Payment.togglePriority(req.user, req.body.id)

        res.status(200).json(true)
    })
)

router.post('/proofs', Auth, Validate.get, Serialise.get, 
    Interceptor(async (req, res) => {
        const list = await Payment.sendProofs(req.user, req.body.id)        

        Telegram.sendProofs(list, req.user.telegram)
        res.status(200).json(true)
    })
)

router.post('/tails', Auth, Validate.get, Serialise.get, 
    Interceptor(async (req, res) => {
        const list = await Tail.list(req.body.id)        

        res.status(200).json(list)
    })
)

router.post('/statistic', Auth, isMaker,
    Interceptor(async (req, res) => {
        const { start, stop, accessId } = req.body
        
        let options = {}
        if(accessId) { options = { accessId: toObjectId(accessId) } }

        const startTime = start? parseInt(start) : 0
        const stopTime = stop? parseInt(stop) : Date.now()

        const data = await Payment.getStatistics(req.user, startTime, stopTime, options)

        res.status(200).json(data)
    })
)

router.post('/order/update',  
    Interceptor(async (req, res) => {
        const {id, status} = req.body 
        console.log('----- Close in NcAPi', id, status)
        
        try { 
            const paymentId = await Tail.close(id, status) 
            
            await Payment.refresh(paymentId)
        }
        catch(error) {
            console.log('----- error in save payment with NcApi')
            console.log(error)
        }

        res.status(200).json(true)
    })
)

router.post('/ncpay/callback', Auth, Validate.get, Serialise.get, 
    Interceptor(async (req, res) => {
        await Payment.sendNcpayCallback(req.body.id)

        res.status(200).json(true)
    })
)

router.post('/list', Auth, Validate.list, Serialise.list,
    Interceptor(async (req, res) => {
        const { filter, page, limit } = req.body
        const {list, count} = await Payment.list(req.user, filter, page, limit)        

        req.skipLog = true
        res.status(200).json({ list: list.map((payment) => Format.admin(payment)), count })
    })
)


module.exports = router
