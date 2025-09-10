import React, { useState } from 'react'
import { formatCardNumber, formatTime, formatAmount } from '../../utils'
import { useSelector } from "react-redux"

import Copy from '../UI/copy'

import styles from './Invoice.module.css'
import useInvoiceApi from '../../API/invoice.api'
import Input from '../UI/Input'
import useInput from '../../hooks/input.hook'
import * as authSelectors from '../../redux/selectors/auth.selectors'


function Invoice({invoice, refresh}) {
    const invoiceApi = useInvoiceApi()
    const access = useSelector(authSelectors.access)

    const [isRejectWait, setIsRejectWait] = useState(false)
    const [isValidWait, setIsValidWait] = useState(false)
    const [isValidOkWait, setIsValidOkWait] = useState(false)
    const [isChangeWait, setIsChangeWait] = useState(false)
    const [isScamWait, setIsScamWait] = useState(false)

    const changeAmount = useInput()

    let clientColor = '#4bef81'
    if(invoice?.conv < 0.5 || invoice?.confirm < 10) { clientColor = '#ff6b6b' }
    else if(!!invoice?.ncpayConv?.all?.conversion && (invoice?.ncpayConv?.all?.conversion < 0.5 || invoice?.ncpayConv?.all?.confirmCount < 10)) { clientColor = '#f6a740' }
    else if(!!invoice?.ncpayConv?.later30?.conversion && (invoice?.ncpayConv?.later30?.conversion < 0.5 || invoice?.ncpayConv?.later30?.confirmCount < 10)) { clientColor = '#f6a740' }
    if(invoice?.ncpayConv?.trust) { clientColor = '#4bef81' }

    const rejectHandler = async () => {
        if(!isRejectWait) { 
            setIsValidWait(false)
            setIsValidOkWait(false)
            setIsChangeWait(false)
            setIsScamWait(false)

            return setIsRejectWait(true) 
        }

        await invoiceApi.reject(invoice.id)
        setIsRejectWait(false) 
        refresh()
    }

    const forseHandler = async () => {
        if(!isRejectWait) { 
            setIsValidWait(false)
            setIsValidOkWait(false)
            setIsChangeWait(false)

            return setIsRejectWait(true) 
        }

        await invoiceApi.forse(invoice.id)
        setIsRejectWait(false) 
        refresh()
    }

    const changeHandler = async () => {
        if(!isChangeWait) { 
            setIsValidWait(false)
            setIsValidOkWait(false)
            setIsRejectWait(false)

            return setIsChangeWait(true)
        }

        await invoiceApi.change(invoice.id, changeAmount.value)
        setIsChangeWait(false) 
        changeAmount.clear()
        refresh()
    }

    const validHandler = async () => {
        if(!isValidWait) { 
            setIsValidOkWait(false)
            setIsRejectWait(false) 
            setIsScamWait(false)

            return setIsValidWait(true) 
        }

        await invoiceApi.valid(invoice.id)
        setIsValidWait(false)
        refresh()
    }

    const validOkHandler = async () => {
        if(!isValidOkWait) { 
            setIsValidWait(false)
            setIsRejectWait(false) 
            setIsScamWait(false)

            return setIsValidOkWait(true) 
        }

        await invoiceApi.validOk(invoice.id)
        setIsValidOkWait(false)
        refresh()
    }

    const scamHandler = async () => {
        if(!isScamWait) { 
            setIsValidWait(false)
            setIsRejectWait(false) 
            setIsValidOkWait(false) 

            return setIsScamWait(true) 
        }

        await invoiceApi.scam(invoice.id)
        setIsScamWait(false)
        refresh()
    }

    return (
        <div className={styles.main}>
            <div className={styles.excel}>
                <div className={styles.amount}>
                    <Copy value={invoice?.initialAmount} label={formatAmount(invoice?.initialAmount)} />
                    <Copy value={invoice?.amount} label={formatAmount(invoice?.amount)} />
                </div>
            </div>
            <div className={styles.excel}>
                <div className={styles.card}>
                    <Copy value={invoice?.payment} label={invoice?.payment} />
                    <Copy value={invoice?.card} label={formatCardNumber(invoice?.card)} />
                    <a href={invoice?.payLink} target='_blanck'>Link to Proof</a>
                </div>
            </div>
            <div className={styles.excel}>
                <div className={styles.id}>
                    <Copy value={invoice?.id} label={invoice?.id? invoice.id : 'SystemId'} />
                    <Copy value={invoice?.refId} label={invoice?.refId? invoice.refId : 'ReferenceId'} />
                    <Copy value={invoice?.partnerId} label={invoice?.partnerId? invoice.partnerId : 'PartnerId'} />
                </div>
            </div>
            <div className={styles.excel}>
                {(invoice.validOk && invoice?.status !== 'CONFIRM' && invoice?.status !== 'REJECT')? 
                    <>
                        <div className={styles.status} data-status="VALID-OK">VALID-OK</div>
                    </> : 
                    <>
                        <div className={styles.status} data-status={invoice?.status}>{invoice?.status}</div>
                    </>
                }
            </div>
            <div className={styles.excel}>  
                <div className={styles.action}>
                    <div className={styles.buttons}>
                        <div className={styles.col}>
                            <div className={styles.row}>
                                {(invoice.status === "CONFIRM") && (access === 'SUPPORT' || access === 'ADMIN') && (<>
                                    <Input input={changeAmount} placeholder='amount' className={styles.input}/>
                                </>)}
                                {(invoice.status === "WAIT" || invoice.status === "VALID") && <>
                                    <button 
                                        className={`${styles.button} ${isValidOkWait? styles.open : null}`} 
                                        onClick={() => validOkHandler()}
                                        data-type="accept"
                                    >
                                        {invoice.validOk? "To Valid" : "To Valid Ok"}
                                    </button>
                                </>}
                            </div>
                            
                            <div className={styles.row}>
                                {(invoice.status === "REJECT") && <>
                                    <button 
                                        className={`${styles.button} ${isValidWait? styles.open : null}`} 
                                        onClick={() => validHandler()}
                                        data-type="accept"
                                    >
                                        Valid
                                    </button>
                                </>}

                                {(invoice.status !== "WAIT") && <>
                                    <button 
                                        className={`${styles.button} ${isScamWait? styles.open : null}`} 
                                        onClick={() => scamHandler()}
                                        data-type="decline"
                                    >
                                        {invoice?.isScam? "unscam" : "scam"}
                                    </button>
                                </>}

                                {(invoice.status === "CONFIRM") && (access === 'SUPPORT' || access === 'ADMIN') && (<>
                                    <button 
                                        className={`${styles.button} ${isRejectWait? styles.open : null}`} 
                                        onClick={() => forseHandler()}
                                        data-type="decline"
                                    >Reject</button>
                                    <button 
                                        className={`${styles.button} ${isChangeWait? styles.open : null}`} 
                                        onClick={() => changeHandler()}
                                        data-type="accept"
                                    >Change</button>
                                </>)}

                                {(invoice.status === "VALID") && <>
                                    <button 
                                        className={`${styles.button} ${isRejectWait? styles.open : null}`} 
                                        onClick={() => rejectHandler()}
                                        data-type="decline"
                                    >
                                        Reject
                                    </button>
                                </>}
                            </div>
                        </div>
                    </div>
                </div> 
            </div>
            <div className={styles.excel}>
                <div className={styles.client}>
                    <Copy value={invoice?.client? invoice?.client : ""} label={invoice?.client? invoice?.client : "Unknow Client"} />
                    {!!invoice?.client && <div className={styles.line} style={{backgroundColor: clientColor}}></div>}
                    {!!invoice?.client && invoice?.conv !== -1 && 
                        <div className={styles.conv}>{ (invoice?.conv).toFixed(2) } / <span className={styles.green}>{ invoice?.confirm }</span></div>
                    }
                    {!!invoice?.isRisk && <div className={styles.conv} style={{color: "#ff6b6b" }}>risk: true</div>}
                    {!!invoice?.isScam && <div className={styles.conv} style={{color: "#ff6b6b" }}>SCAM: true</div>}
                </div>
            </div>
            <div className={styles.excel}>
                <div className={styles.time}>{formatTime(invoice?.createdAt)}</div>
            </div>
        </div>
    )
}


export default Invoice