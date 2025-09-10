
const { Router } = require('express')
const Jwt = require('@utils/Jwt.utils')
const Interceptor = require('@core/Interceptor')

const Validate = require('@validate/User.validate')
const Serialise = require('@serialize/User.serialize')
const Format = require('@format/User.format')

const User = require('@controllers/User.controller')
const Partner = require('@controllers/Partner.controller')
const Log = require('@controllers/Log.controller')
const { Auth, isAdmin, isMaker, isSupport } = require('@middleware/auth.middleware')
const Const = require('@core/Const')


const router = Router()


router.post('/create', Validate.create, Serialise.crerate, 
    Interceptor(async (req, res) => {
        const { login, password, telegram } = req.body
    
        const user = await User.create(login, password, telegram)
    
        res.status(201).json(Format.admin(user))
    })
)

router.post('/2fa', Validate.login, Serialise.login, 
    Interceptor(async (req, res) => {
        const { login, password } = req.body
    
        const user = await User.verify(login, password)
        await User.twoFA(user._id)
    
        res.status(201).json(true)
    })
)

router.post('/login', Validate.login, Serialise.twoFA, 
    Interceptor(async (req, res) => {
        const { login, password, code } = req.body
    
        const user = await User.verify(login, password)
        await User.twoFAVerify(user.id, code)
    
        const token = Jwt.generateLoginJwt(user._id)
    
        res.status(200).json({ token, userId: user._id, access: user.access })
    })
)

router.post('/user-list', Auth, Interceptor(async (req, res) => {
    const list = await User.list()

    res.status(201).json(list)
})) 

router.post('/maker-list', Auth, Interceptor(async (req, res) => {
    const makersList = await User.list(Const.userAccess.MAKER)
    const adminsList = await User.list(Const.userAccess.ADMIN)

    res.status(201).json([...makersList, ...adminsList])
})) 

router.post('/partner-list', Auth, Interceptor(async (req, res) => {
    const list = await Partner.list()

    res.status(201).json(list.map((partner) => ({ id: partner._id, name: partner.name })))
}))

router.post('/autoStatistic', Auth, isMaker,
    Interceptor(async (req, res) => {
        const { start, stop } = req.body

        const startTime = start? parseInt(start) : 0
        const stopTime = stop? parseInt(stop) : Date.now()

        const data = await Log.getAutoStatistic(req.user, startTime, stopTime)

        res.status(200).json(data)
    })
)


module.exports = router