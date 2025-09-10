const fetch = require('node-fetch')
const Log = require('@controllers/Log.controller')
const Const = require('@core/Const')

const config = require('config')

let monoIndex = 0

const check = async (type, url, number) => {
    const logs = { url, method: type, req: { number }, time: Date.now() }

    try {        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => {
            console.log('Kvits TimeOut')            
            controller.abort()
        }, 120000)

        const response = await fetch(url, {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ number }),
            signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        console.log('send fetch')            

        const data = await response.json()

        try {
            if(data) { logs.res = data }

            logs.time = Date.now() - logs.time
            logs.statusCode = (data && data.card && data.amount)? 200 : 'Have not data'

            await Log.create(logs)
        }
        catch(error) {
            console.log('save log err', error)
        }
        
        console.log('checkData:', data)        
        return data
    } 
    catch (error) {   
        console.log('Check Error:', error)
        
        logs.statusCode = 'Not have Responce' 
        logs.time = Date.now() - logs.time

        await Log.create(logs)

        return null
    }
}

const checkMono = async (number) => {
    const urlsList = config.get('checkGovUrl')
    monoIndex = (monoIndex + 1) % urlsList.length
    const url = urlsList[monoIndex]

    console.log('monoIndex', monoIndex)
    console.log('monoUrl', url)
    
    const data = await check(Const.bankList.MONO, `${url}/check`, number) 
    console.log('CHECK MONO FUN DATA', data);
    return data
}

const checkPrivat = async (number) => await check(Const.bankList.PRIVAT, `${config.get('privatUrl')}/check`, number)

const checkByBank = async (bank, number) => {
    if(bank === Const.bankList.MONO) { return await checkMono(number) }
    if(bank === Const.bankList.PRIVAT) { return await checkPrivat(number) }

    return null 
}

module.exports = { 
    checkMono,
    checkPrivat,
    checkByBank
}