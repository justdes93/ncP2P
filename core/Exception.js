
module.exports = {
    invalidCard: { status: 415, msg: 'Incorrect Card Number' },
    invalidAmount: { status: 415, msg: 'Incorrect Amount' },
    invalidRefId: { status: 415, msg: 'Incorrect Reference Id' },
    invalidPartnerId: { status: 415, msg: 'Incorrect Partner Id' },
    invalidBank: { status: 415, msg: 'Incorrect Bank' },
    invalidClient: { status: 415, msg: 'Incorrect Client' },

    manyProofs: { status: 415, msg: 'So many proofs. Please wait' },
    
    isExist: { status: 409, msg: 'Already Exists' },
    notFind: { status: 404, msg: "Can't Find" },
    notFindPayment: { status: 404, msg: "Can't Find Payment" },

    notFindActive: { status: 404, msg: "Can't Find active" },
    notFindConfirm: { status: 404, msg: "Can't Find confirm" },

    cantCloseInvoice: { status: 409, msg: 'Cant Close Final Invoice' },
    cantRefreshPayment: { status: 409, msg: 'Cant Reject Final Payment' },
    cantPushTail: { status: 409, msg: 'This payment have avtiv invoices or waiting for tail' },

    cardBlocked: { status: 409, msg: 'Card is Blocked' },
    clientHasActive: { status: 409, msg: 'Client has Active' },
    clientIsBlocked: { status: 413, msg: 'Client is Blocked' },
    iAmTeapot: { status: 418, msg: 'I Am Teapot!!!' },

    notAuth: { status: 401, msg: 'Bad Auth' },
    notAccess: { status: 401, msg: 'Not Access' },
    
    invalidId: { status: 415, msg: 'Invalid Id' },
    invalidValue: { status: 415, msg: 'Unsupported Data Type' },

    invalidEmail: { status: 415, msg: 'Incorrect Email' },
    invalidPass: { status: 415, msg: 'Incorrect Password' },

    notCanSaveModel: { status: 500, msg: 'Internal Server Error' },
    unknown: { status: 520, msg: 'Something went wrong...' }
}
