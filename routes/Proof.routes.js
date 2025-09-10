
const { Router } = require('express')
const { Auth, isSupport, isMaker } = require('@middleware/auth.middleware')
const Interceptor = require('@core/Interceptor')

const Validate = require('@validate/Proof.validate')
const Serialise = require('@serialize/Proof.serialize')
const Proof = require('@controllers/Proof.controller')
const Format = require('@format/Proof.format')
const Jwt = require('@utils/Jwt.utils')
const { toObjectId } = require('@utils/utils')

const file = require('@middleware/file.middleware')
const Exception = require('@core/Exception')


const router = Router()


router.post('/create-client-number', Validate.clientNumber, Serialise.clientNumber, 
    Interceptor(async (req, res) => {
        const { hash, kvitNumber } = req.body   
        const invoiceId = Jwt.validateLinkJwt(hash)        

        //if(/[^\x00-\x7F]/.test(kvitNumber)) { throw Exception.invalidValue }
        if(!/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(kvitNumber)) { throw Exception.invalidValue }
          
        const proof = await Proof.createByNumber(invoiceId, kvitNumber)

        res.status(201).json(Format.client(proof))
    })
)

router.post('/create-client-file', file.single('kvit'), Validate.clientFile, Serialise.clientFile, 
    Interceptor(async (req, res) => {        
        const { hash, kvitFile } = req.body             
        const invoiceId = Jwt.validateLinkJwt(hash)
        
        const proof = await Proof.createByFile(invoiceId, kvitFile)

        res.status(201).json(Format.client(proof))
    })
)

router.post('/create-host-file', file.single('kvit'), Validate.get, Serialise.hostFile, 
    Interceptor(async (req, res) => {           
        const { id, kvitFile } = req.body                     
        const proof = await Proof.createByFile(id, kvitFile)

        res.status(201).json(Format.client(proof))
    })
)

router.post('/decline', Auth, Validate.decline, Serialise.decline, 
    Interceptor(async (req, res) => {
        const proof = await Proof.decline(req.body.id, req.user?._id)

        res.status(200).json(Format.admin(proof))
    })
)

router.post('/accept', Auth, Validate.approve, Serialise.approve,
    Interceptor(async (req, res) => {
        const { kvitNumber } = req.body   
        if(/[^\x00-\x7F]/.test(kvitNumber)) { throw Exception.invalidValue }
        
        const proof = await Proof.approve(req.body, req.user?._id)        

        res.status(200).json(Format.admin(proof))
    })
)

router.post('/manual', Auth, Validate.decline, Serialise.decline,
    Interceptor(async (req, res) => {        
        const proof = await Proof.manual(req.body.id)        

        res.status(200).json(Format.admin(proof))
    })
)

router.post('/recheck', Auth, Validate.recheck, Serialise.recheck,
    Interceptor(async (req, res) => {        
        const { id, bank, number } = req.body     
        if(/[^\x00-\x7F]/.test(number)) { throw Exception.invalidValue }
        
        await Proof.recheck(id, bank, number, req.user?._id)        

        res.status(200).json(true)
    })
)

router.post('/list', Auth, Validate.list, Serialise.list,
    Interceptor(async (req, res) => {
        const { filter, page, limit } = req.body             

        const {list, count} = await Proof.list(req.user, filter, page, limit)        

        req.skipLog = true
        res.status(200).json({ list: list.map((proof) => Format.admin(proof)), count })
    })
)

router.post('/statistic', Auth,
    Interceptor(async (req, res) => {
        const { start, stop, userId } = req.body

        let options = {}
        if(userId) { options = { user: toObjectId(userId) } }
        
        const startTime = start? parseInt(start) : 0
        const stopTime = stop? parseInt(stop) : Date.now()

        const data = await Proof.getStatistics(req.user, startTime, stopTime, options)

        res.status(200).json(data)
    })
)

module.exports = router
