import React, { useState } from 'react'
import { useSelector } from "react-redux"
import { formatTime, formatAmount } from '../../utils'

import Copy from '../UI/copy'

import styles from './Proof.module.css'
import { FRONT_URL, BASE_URL } from '../../const'
import Input from '../UI/Input'
import useInput from '../../hooks/input.hook'
import useProofApi from '../../API/proof.api'
import * as authSelectors from '../../redux/selectors/auth.selectors'


function Proof({proof, refresh}) {
    const proofApi = useProofApi()
    const access = useSelector(authSelectors.access)

    const number = useInput(proof?.gpt?.number || proof?.kvitNumber)
    const amount = useInput(proof?.invoiceAmount || 0)

    const [isDecline, setIsDecline] = useState(false)
    const [isApprove, setIsApprove] = useState(false)
    const [isManual, setIsManual] = useState(false)

    const [wait, setWait] = useState(false)

    let clientColor = '#4bef81'
    if(proof?.conv < 0.5 || proof?.confirm < 10) { clientColor = '#ff6b6b' }
    else if(!!proof?.ncpayConv?.all?.conversion && (proof?.ncpayConv?.all?.conversion < 0.5 || proof?.ncpayConv?.all?.confirmCount < 10)) { clientColor = '#f6a740' }
    else if(!!proof?.ncpayConv?.later30?.conversion && (proof?.ncpayConv?.later30?.conversion < 0.5 || proof?.ncpayConv?.later30?.confirmCount < 10)) { clientColor = '#f6a740' }
    if(proof?.ncpayConv?.trust) { clientColor = '#4bef81' }


    const declineHandler = async () => {
        if(!isDecline) { return setIsDecline(true) }

        setIsManual(false)
        setIsDecline(false)
        setIsApprove(false)
        setWait(true)

        const proofIsDecline = !!(await proofApi.decline(proof.id))
        setWait(false)
        if(proofIsDecline) { refresh() }
    } 

    const manualHandler = async () => {
        if(!isManual) { return setIsManual(true) }

        setIsManual(false)
        setIsDecline(false)
        setIsApprove(false)
        setWait(true)

        const proofIsManual = !!(await proofApi.manual(proof.id))
        setWait(false)
        if(proofIsManual) { refresh() }
    } 

    const acceptHandler = async () => {
        if(!isApprove) { return setIsApprove(true) }

        setIsManual(false)
        setIsDecline(false)
        setIsApprove(false)
        setWait(true)

        const proofIsApprove = !!(await proofApi.approve(proof.id, amount.value, number.value))
        setWait(false)
        if(proofIsApprove) { refresh() }
    } 

    const recheckHandler = async (bank='mono') => {
        refresh()
        const proofIsRecheck = !!(await proofApi.recheck(proof.id, bank, number.value))
        if(proofIsRecheck) { refresh() }
    } 

    return (
        <div className={styles.main}>
            <div className={styles.excel}>
                <div className={styles.amount}>
                    <Copy value={proof?.amount} label={formatAmount(proof?.amount)} />
                </div>
            </div>
            <div className={styles.excel}>
                <div className={styles.card}>
                    <div className={styles.item}>
                        {proof?.paymentAccessName && <div>{proof?.paymentAccessName}</div>}
                        <Copy value={proof?.id} label={proof?.id? proof.id : 'SystemId'} />
                        <Copy value={proof?.payment} label={proof?.payment? proof.payment : 'PaymentId'} />
                        <Copy value={proof?.kvitNumber} label={proof?.kvitNumber} />
                        {proof?.fileLink && (
                            <a className={styles.link} href={proof.fileLink} target='_blanck' >Check File</a>
                        )}
                        {!proof?.fileLink && (
                            <a className={styles.link} href={`${BASE_URL}/kvits/${proof.kvitFile}`} target='_blanck' >{proof.kvitFile? 'Check File' : 'Have not File'}</a>
                        )}
                    </div>
                </div>
            </div>
            <div className={styles.excel}>
                <div className={styles.id}>
                    <Copy value={proof?.invoice} label={proof?.invoice} />
                    <Copy value={proof?.invoiceCard} label={proof?.invoiceCard} />
                    <Copy value={proof?.invoiceAmount} label={`${proof?.invoiceAmount} UAH`} />
                    <div>{formatTime(proof?.invoiceDate)}</div>
                </div>
            </div>
            <div className={styles.excel}>
                <div className={styles.id}>
                    {/* <Copy value={proof?.gpt?.number} label={proof?.gpt?.number} /> */}
                    <div className={styles.opasity}>....</div>
                    <Copy value={proof?.gpt?.card} label={proof?.gpt?.card} />
                    <Copy value={proof?.gpt?.amount} label={proof?.gpt?.amount} />
                    <div>{proof?.gpt?.date}</div>
                </div>
            </div>
            <div className={styles.col}>
                <div className={styles.status} data-status={proof?.status}>{proof?.status}</div>
                {(proof?.status === 'MANUAL' || proof?.status === 'WAIT') && 
                    <div className={styles.substatus} data-status={proof?.invoiceSubstatus}>{proof?.invoiceSubstatus}</div>
                }
            </div>
            <div className={styles.excel}>
                {(access === 'ADMIN' || access === 'SUPPORT' || access === 'MAKER') && (proof.status === 'WAIT' || proof.status === 'MANUAL') 
                 && !wait && 
                 (
                    <div className={styles.action}>
                        <div className={styles.banks}>
                            <div className={styles.banks}>
                                {proof.isChecking? <span class="loader"></span> : <>
                                    <div>{proof.lastCheck === -1 && "❌"}</div>
                                    <div>{proof.lastCheck === 1 && " ❗️"}</div>

                                    <div className={styles.bank} onClick={() => recheckHandler('mono')}>
                                        <img src={`${FRONT_URL}/mono.png`} />
                                    </div>
                                    <div className={styles.bank} onClick={() => recheckHandler('privat')}>
                                        <img src={`${FRONT_URL}/privat.png`} />
                                    </div>
                                </>}
                            </div>
                        </div>
                        <div className={styles.item}>
                            <Input input={amount} className={styles.input} placeholder="Amount" />
                            <Input input={number} className={styles.input} placeholder="Kvit Number" />
                        </div>

                        <div className={styles.buttons}>
                            <button 
                                className={`${styles.button} ${isApprove? styles.open : null}`} 
                                onClick={() => acceptHandler()}
                                data-type="accept"
                            >
                                Approve
                            </button>
                            <button 
                                className={`${styles.button} ${isManual? styles.open : null}`} 
                                onClick={() => manualHandler()}
                                data-type="manual"
                            >
                                {proof.status === 'MANUAL'? 'Unmanual' : 'Manual'}
                            </button>
                            <button 
                                className={`${styles.button} ${isDecline? styles.open : null}`} 
                                onClick={() => declineHandler()}
                                data-type="decline"
                            >
                                Decline
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <div className={styles.excel}>
                <div className={styles.client}>
                    <Copy value={proof?.client? proof?.client : ""} label={proof?.client? proof?.client : "Unknow Client"} />
                    {!!proof?.client && <div className={styles.line} style={{backgroundColor: clientColor}}></div>}
                    {!!proof?.client && proof?.conv !== -1 && 
                        <div className={styles.conv}>p2p: {(proof?.conv).toFixed(2) } / <span className={styles.green}>{ proof?.confirm }</span></div>
                    }
                    {!!proof?.client && !!proof?.ncpayConv?.all && 
                        <div className={styles.conv}>ncp: {(proof?.ncpayConv?.all?.conversion).toFixed(2) } / <span className={styles.green}>{ proof?.ncpayConv?.all?.confirmCount }</span></div>
                    }
                    {!!proof?.client && !!proof?.ncpayConv?.later30 && 
                        <div className={styles.conv}>nLd: {(proof?.ncpayConv?.later30?.conversion).toFixed(2) } / <span className={styles.green}>{ proof?.ncpayConv?.later30?.confirmCount }</span></div>
                    }
                    {!!proof?.client && proof?.ncpayConv?.trust && <div className={styles.conv} style={{color: "#66cc66" }}>trust: true</div>}
                    {!!proof?.type && proof?.type === 'NCPAY' && <div className={styles.conv}>npay: True</div>}
                    {!!proof?.isRisk && <div className={styles.conv} style={{color: "#ff6b6b" }}>risk: True</div>}
                    {!!proof?.isScam && <div className={styles.conv} style={{color: "#ff6b6b" }}>SCAM: True</div>}
                </div>
            </div>
            <div className={styles.excel}>
                <div className={styles.time}>{formatTime(proof?.createdAt)}</div>
            </div>
        </div>
    )
}


export default Proof