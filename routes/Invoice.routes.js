
const { Router } = require('express')
const { Auth, isSupport, isMaker, isAdmin } = require('@middleware/auth.middleware')
const { access, partnerAccess } = require('@middleware/access.middleware')
const Interceptor = require('@core/Interceptor')
const Jwt = require('@utils/Jwt.utils')
const Task = require('@controllers/Task.controller')

const Validate = require('@validate/Invoice.validate')
const Serialise = require('@serialize/Invoice.serialize')
const Invoice = require('@controllers/Invoice.controller')
const Proof = require('@models/Proof.model')
const Format = require('@format/Invoice.format')

const Const = require('@core/Const')
const config = require('config')
const Exception = require('@core/Exception')

const router = Router()

//
router.post('/create', access, partnerAccess, Validate.create, Serialise.create, 
    Interceptor(async (req, res) => {
        try {
             const invoice = await Invoice.create(req.body)
            if(invoice?.errorTitle == "notFind") { 
                if(req.logs) { req.logs.payload = invoice.payload }
                throw Exception.notFind 
            }
            
            const hash = Jwt.generateLinkJwt(invoice._id)
            
            let payPageUrl = config.get('payPageUrl')
            if(req.body?.template === 'template_p_1') { payPageUrl = config.get('payPageUrl_tmp_1') }
            if(req.body?.template === 'template_p_2') { payPageUrl = config.get('payPageUrl_tmp_2') }

            Task.push({ timestamp: Date.now() + Const.expire * 60 * 1000, type: 'CLOSE', payload: { invoice: invoice._id }})

            res.status(201).json({...Format.parnter(invoice), link: `${payPageUrl}?hash=${hash}`})
        }
        catch(err) {
            console.log("|||-------", err)
        }
    })
)

router.post('/host-pay', access, partnerAccess, Validate.get, Serialise.get,
    Interceptor(async (req, res) => {
        const { id } = req.body
        const invoice = await Invoice.pay(id)

        res.status(200).json(Format.parnter(invoice))
    })
)

router.post('/host-get', access, partnerAccess, Validate.get, Serialise.get,
    Interceptor(async (req, res) => {
        const { id } = req.body
        const invoice = await Invoice.get(id)     

        const list = await Proof.find({ invoice: invoice._id })       
        res.status(200).json({ invoice: Format.client(invoice), proofs: list })
    })
)

router.post('/pay', Validate.pay, Serialise.pay,
    Interceptor(async (req, res) => {
        const id = Jwt.validateLinkJwt(req.body.hash)

        const invoice = await Invoice.pay(id)

        res.status(200).json(Format.parnter(invoice))
    })
)

router.post('/get', Validate.pay, Serialise.pay,
    Interceptor(async (req, res) => {
        const id = Jwt.validateLinkJwt(req.body.hash)
        
        const invoice = await Invoice.get(id)     
        const list = await Proof.find({ invoice: invoice._id })       

        res.status(200).json({ invoice: Format.client(invoice), proofs: list })
    })
)

router.post('/reject', Auth, Validate.get, Serialise.get,
    Interceptor(async (req, res) => {        
        const { id } = req.body

        const invoice = await Invoice.reject(req.user, id)

        res.status(200).json(Format.parnter(invoice))
    })
)

router.post('/valid', Auth, Validate.get, Serialise.get,
    Interceptor(async (req, res) => {        
        const { id } = req.body

        const invoice = await Invoice.toValid(req.user, id)

        res.status(200).json(Format.parnter(invoice))
    })
)

router.post('/validOk', Auth, Validate.get, Serialise.get,
    Interceptor(async (req, res) => {        
        const { id } = req.body

        const invoice = await Invoice.toValidOk(req.user, id)

        res.status(200).json(Format.parnter(invoice))
    })
)

router.post('/scam', Auth, Validate.get, Serialise.get,
    Interceptor(async (req, res) => {        
        const { id } = req.body

        const invoice = await Invoice.toScam(id)

        res.status(200).json(Format.parnter(invoice))
    })
)

router.post('/forse', Auth, isAdmin, Validate.get, Serialise.get,
    Interceptor(async (req, res) => {        
        const { id } = req.body

        const invoice = await Invoice.forse(req.user, id)

        res.status(200).json(Format.parnter(invoice))
    })
)

router.post('/change', Auth, isAdmin, Validate.change, Serialise.change,
    Interceptor(async (req, res) => {        
        const { id, amount } = req.body       

        const invoice = await Invoice.change(req.user, id, amount)

        res.status(200).json(Format.parnter(invoice))
    })
)


router.post('/statistic', Auth, isMaker,
    Interceptor(async (req, res) => {
        const { start, stop } = req.body

        const startTime = start? parseInt(start) : 0
        const stopTime = stop? parseInt(stop) : Date.now()

        const data = await Invoice.getStatistics(req.user, startTime, stopTime)

        res.status(200).json(data)
    })
)

router.post('/list', Auth, Validate.list, Serialise.list,
    Interceptor(async (req, res) => {
        const { filter, page, limit } = req.body        

        const {list, count} = await Invoice.list(req.user, filter, page, limit)        

        req.skipLog = true
        res.status(200).json({ list: list.map((payment) => Format.admin(payment)), count })
    })
)


module.exports = router
