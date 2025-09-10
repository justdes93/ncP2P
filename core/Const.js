module.exports = {
    payTime: 10 * 60 * 1000,
    minPaymentLimit: 500,
    maxPaymentLimit: 200000,
    minInvoiceLimit: 500,
    maxInvoiceLimit: 100000,
    minNcApiLimit: 500,
    smallLim: 1500,
    maxTail: 100000,
    
    payment: {
        statusList: { ACTIVE: 'ACTIVE', BLOCKED: 'BLOCKED', SUCCESS: 'SUCCESS', REJECT: 'REJECT' },
        minLimit: {
            default: 500,
            customLimit: 10000,
            persent: 0.05
        },
        filter: {
            types: { DEFAULT: 'DEFAULT', NCPAY: 'NCPAY' } 
        }
    },

    invoice: {
        statusList: { WAIT: 'WAIT', VALID: 'VALID', CONFIRM: 'CONFIRM', REJECT: 'REJECT' },
        activeStatusList: [ 'VALID', 'WAIT' ],
        finaleStatusList: [ 'CONFIRM', 'REJECT' ],
        ncPayRandom: 0.25
    },

    proof: {
        statusList: { WAIT: "WAIT", MANUAL: 'MANUAL', CONFIRM: 'CONFIRM', REJECT: 'REJECT' },
        activeStatusList: [ 'WAIT', 'MANUAL' ],
    },

    tail: {
        statusList: { CREATE: "CREATE", WAIT: "WAIT", CONFIRM: 'CONFIRM', REJECT: 'REJECT' },
    },

    maxSaveRecursion: 10,
    bankList: { MONO: 'mono', PRIVAT: 'privat' },
    access: { PARTNER: 'PARTNER', ADMIN: 'ADMIN' },
    userAccess: { ADMIN: 'ADMIN', MAKER: 'MAKER', SUPPORT: 'SUPPORT' },
    expire: 10
}
