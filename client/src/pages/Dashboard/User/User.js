import React, { useEffect, useState } from 'react'

import styles from '../Dashboard.module.css'
import useProofApi from '../../../API/proof.api'
import Copy from '../../../components/UI/copy'
import { getTimestamp } from '../../../utils'


function User({user, start, stop, name, triger}) {
  const proofApi = useProofApi()

  const [data, setData] = useState(null)

  const load = async () => {
    if(!user) { return }

    const startTime = getTimestamp(start)
    const stopTime = getTimestamp(stop)

    const proofData = await proofApi.getStatistics(startTime, stopTime, user)
    if(proofData?.avgWaitToFinal) { proofData.avgWaitToFinal = `${parseInt(proofData.avgWaitToFinal / (1000 * 60))} min ${parseInt(proofData.avgWaitToFinal / 1000) % 60} s` }
    if(proofData?.avgValidOkToFinal) { proofData.avgValidOkToFinal = `${parseInt(proofData.avgValidOkToFinal / (1000 * 60))} min ${parseInt(proofData.avgValidOkToFinal / 1000) % 60} s` }

    setData(proofData)
  }

  useEffect(() => { load() }, [triger])

  return (
    <div className={`${styles.user} ${data?.finalCount? null : styles.hide}`}>
      <h1>{name}</h1>
      <div>
        <span className={styles.item}>FinalCount: <Copy value={data?.finalCount || 0} label={data?.finalCount || 0} /></span>
        <span className={styles.item}>AvgWaitToFinal: <Copy value={data?.avgWaitToFinal || 0} label={data?.avgWaitToFinal || 0} /></span>
        <span className={styles.item}>AvgValidOkToFinal: <Copy value={data?.avgValidOkToFinal || 0} label={data?.avgValidOkToFinal || 0} /></span>
      </div>
    </div>
  )
}


export default User