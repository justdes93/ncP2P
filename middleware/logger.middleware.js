const Log = require('@controllers/Log.controller')


async function logger(req, res, next) {    
    const url = req.url
    const method = req.method
    const timestamp = Date.now()

    req.logs = { 
        url, 
        method, 
        time: timestamp,
        req: req.body
    }
  
    const originalSend = res.send
  
    res.send = function (body) {       
        try {
            req.logs.time = Date.now() - req.logs.time
            req.logs.statusCode = res.statusCode      
            req.logs.user = req.user?.login? req.user.login : null
            req.logs.res = JSON.parse(body)
            
            if(!req.skipLog) { Log.create(req.logs).then() }
        }
        catch(err) {
            console.log('Error in log:\n', err, '\n', req.logs)
            if(!req.skipLog) { Log.create(req.logs).then() }
        }

        return originalSend.call(this, body)
    }
  
    next()
}


module.exports = logger

