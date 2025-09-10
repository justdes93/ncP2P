import React, { useEffect, useState } from 'react'

import styles from './Dashboard.module.css'
import usePaymentApi from '../../API/payment.api'
import useInvoiceApi from '../../API/invoice.api'
import useProofApi from '../../API/proof.api'
import useUserApi from '../../API/user.api'
import Copy from '../../components/UI/copy'
import Input from '../../components/UI/Input'
import useInput from '../../hooks/input.hook'
import { getTimestamp } from '../../utils'
import Maker from './Maker/Maker'
import User from './User/User'


function Dashboard() {
  const paymentApi = usePaymentApi()
  const invoiceApi = useInvoiceApi()
  const proofApi = useProofApi()
  const userApi = useUserApi()

  const [data, setData] = useState(null)
  const [triger, setTriger] = useState(false)
  const [makers, setMakers] = useState([])
  const [users, setUsers] = useState([])

  const min = useInput(null)
  const max = useInput(null)

  const load = async () => {
    const start = getTimestamp(min.value)
    const stop = getTimestamp(max.value)

    const paymentData = await paymentApi.getStatistics(start, stop)
    const invoiceData = await invoiceApi.getStatistics(start, stop)
    const proofData = await proofApi.getStatistics(start, stop)
    const autoData = await userApi.getAutoStatistics(start, stop)

    setTriger(!triger)

    if(paymentData?.conversion) { paymentData.conversion = paymentData.conversion.toFixed(2) }
    if(paymentData?.avarageSum) { paymentData.avarageSum = paymentData.avarageSum.toFixed(2) }
    if(invoiceData?.conversion) { invoiceData.conversion = invoiceData.conversion.toFixed(2) }
    if(invoiceData?.avarageSum) { invoiceData.avarageSum = invoiceData.avarageSum.toFixed(2) }

    if(proofData?.avgWaitToFinal) { proofData.avgWaitToFinal = `${parseInt(proofData.avgWaitToFinal / (1000 * 60))} min ${parseInt(proofData.avgWaitToFinal / 1000) % 60} s` }
    if(proofData?.avgValidOkToFinal) { proofData.avgValidOkToFinal = `${parseInt(proofData.avgValidOkToFinal / (1000 * 60))} min ${parseInt(proofData.avgValidOkToFinal / 1000) % 60} s` }

    setData({
      payment: paymentData,
      invoice: invoiceData,
      proof: proofData,
      autoData: autoData
    })
  }

  useEffect(() => { 
    const load = async () => { 
      setMakers(await userApi.MakerList()) 
      setUsers(await userApi.UserList()) 
    }

    load()
  }, [])


  return (
    <div className={styles.main}>
      <h1>Dashboard</h1>

      <div className={styles.flex}>
          <Input input={min} placeholder='Start Date'/>
          <Input input={max} placeholder='Stop Date'/>

          <button className='button' onClick={() => load()}>Load</button>
      </div>

      <h1>Invoice</h1>
      <div>
        <span className={styles.item}>count: <Copy value={data?.invoice?.count || 0} label={data?.invoice?.count || 0} /></span>
        <span className={styles.item}>confirmCount: <Copy value={data?.invoice?.confirmCount || 0} label={data?.invoice?.confirmCount || 0} /> </span>
        <span className={styles.item}>ValidCount: <Copy value={data?.invoice?.countValid || 0} label={data?.invoice?.countValid || 0} /> </span>
        <span className={styles.item}>ValidOkCount: <Copy value={data?.invoice?.countValidOk || 0} label={data?.invoice?.countValidOk || 0} /> </span>
        <span className={styles.item}>conversion: <Copy value={data?.invoice?.conversion || 0} label={data?.invoice?.conversion || 0} /></span>
        <span className={styles.item}>totalConfirm: <Copy value={data?.invoice?.totalConfirm || 0} label={data?.invoice?.totalConfirm || 0} /></span>
        <span className={styles.item}>totalInitialConfirm: <Copy value={data?.invoice?.totalInitialConfirm || 0} label={data?.invoice?.totalInitialConfirm || 0} /></span>
        <span className={styles.item}>totalValidandValidOk: <Copy value={data?.invoice?.totalValidandValidOk || 0} label={data?.invoice?.totalValidandValidOk || 0} /></span>
        <span className={styles.item}>avarageSum: <Copy value={data?.invoice?.avarageSum || 0} label={data?.invoice?.avarageSum || 0} /></span>
      </div>

      <h1>Payment</h1>
      <div>
        <span className={styles.item}>count: <Copy value={data?.payment?.count || 0} label={data?.payment?.count || 0} /></span>
        <span className={styles.item}>confirmCount: <Copy value={data?.payment?.confirmCount || 0} label={data?.payment?.confirmCount || 0} /> </span>
        <span className={styles.item}>conversion: <Copy value={data?.payment?.conversion || 0} label={data?.payment?.conversion || 0} /></span>
        <span className={styles.item}>totalConfirm: <Copy value={data?.payment?.totalConfirm || 0} label={data?.payment?.totalConfirm || 0} /></span>
        <span className={styles.item}>totalInitialConfirm: <Copy value={data?.payment?.totalInitialConfirm || 0} label={data?.payment?.totalInitialConfirm || 0} /></span>
        <span className={styles.item}>avarageSum: <Copy value={data?.payment?.avarageSum || 0} label={data?.payment?.avarageSum || 0} /></span>
        <span className={styles.item}>overPayments: <Copy value={data?.payment?.overPayments || 0} label={data?.payment?.overPayments?.toFixed(2) || 0} /></span>
        <span className={styles.item}>totalReject: <Copy value={data?.payment?.totalReject || 0} label={data?.payment?.totalReject || 0} /></span>
        <span className={styles.item}>total with out Reject: <Copy value={data?.payment?.totalNoReject || 0} label={data?.payment?.totalNoReject || 0} /></span>
        <span className={styles.item}>total USDT: <Copy value={data?.payment?.totalUSDT || 0} label={data?.payment?.totalUSDT?.toFixed(2) || 0} /></span>
      </div>

      <div className={styles.row}>
        {makers.map((maker) => <Maker maker={maker.accessId} start={min.value} stop={max.value} name={maker.login} triger={triger} key={maker.id} />)}
      </div>

      <h1>Auto</h1>
      <div>
        <span className={styles.item}>Mono conversion: <Copy value={data?.autoData?.mono?.conversion || 0} label={data?.autoData?.mono?.conversion?.toFixed(2) || 0} /></span>
        <span className={styles.item}>Privat conversion: <Copy value={data?.autoData?.privat?.conversion || 0} label={data?.autoData?.privat?.conversion?.toFixed(2) || 0} /></span>
      </div>

      <h1>Proofs</h1>
      <div>
        <span className={styles.item}>FinalCount: <Copy value={data?.proof?.finalCount || 0} label={data?.proof?.finalCount || 0} /></span>
        <span className={styles.item}>AvgWaitToFinal: <Copy value={data?.proof?.avgWaitToFinal || 0} label={data?.proof?.avgWaitToFinal || 0} /></span>
        <span className={styles.item}>AvgValidOkToFinal: <Copy value={data?.proof?.avgValidOkToFinal || 0} label={data?.proof?.avgValidOkToFinal || 0} /></span>
      </div>

      <div className={styles.users}>
        {users.map((user) => <User user={user._id} start={min.value} stop={max.value} name={user.login} triger={triger} key={user._id} />)}
      </div>
    </div>
  )
}


export default Dashboard 