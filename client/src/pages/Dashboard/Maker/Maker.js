import React, { useEffect, useState } from 'react'

import styles from '../Dashboard.module.css'
import usePaymentApi from '../../../API/payment.api'
import Copy from '../../../components/UI/copy'
import { getTimestamp } from '../../../utils'


function Maker({maker, start, stop, name, triger}) {
  const paymentApi = usePaymentApi()

  const [data, setData] = useState(null)

  const load = async () => {
    if(!maker) { return }

    const startTime = getTimestamp(start)
    const stopTime = getTimestamp(stop)

    const paymentData = await paymentApi.getStatistics(startTime, stopTime, maker)

    if(paymentData?.conversion) { paymentData.conversion = paymentData.conversion.toFixed(2) }
    if(paymentData?.avarageSum) { paymentData.avarageSum = paymentData.avarageSum.toFixed(2) }

    setData(paymentData)
  }

  useEffect(() => {
    load()
  }, [triger])


  return (
    <div className={styles.main}>
      <h1>{name}</h1>
      <div>
        <span className={styles.item}>totalReject: <Copy value={data?.totalReject || 0} label={data?.totalReject || 0} /></span>
        <span className={styles.item}>total with out Reject: <Copy value={data?.totalNoReject || 0} label={data?.totalNoReject || 0} /></span>
        <span className={styles.item}>total USDT: <Copy value={data?.totalUSDT || 0} label={data?.totalUSDT?.toFixed(2) || 0} /></span>
      </div>
    </div>
  )
}


export default Maker