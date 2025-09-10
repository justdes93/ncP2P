import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

import useProofApi from '../../API/proof.api'
import usePage from '../../hooks/page.hook'

import * as filterSelectors from '../../redux/selectors/filter.selectors'
import * as authSelectors from '../../redux/selectors/auth.selectors'

import Proof from '../../components/Proof/Proof'
import ProofFilter from '../../components/ProofFilter/ProofFilter'

import styles from './Valid.module.css'

import { useDispatch } from 'react-redux'
import * as filterActions from '../../redux/actions/filter.actions'


function Valid() {
  const dispatch = useDispatch()

  const proofApi = useProofApi()

  const pagination = usePage(30)
  const page = pagination.page

  const user = useSelector(authSelectors.userId)
  const triger = useSelector(filterSelectors.proofTriger)
  const auto = useSelector(filterSelectors.proofAuto)

  const [proofs, setProofs] = useState([])
  const [data, setData] = useState(null)

  const load = async (page) => {
    const {list, count} = await proofApi.list(page, pagination.limit)

    pagination.setCount(count)
    setProofs(list)

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startTime = startOfDay.getTime()
    const stopTime = now.getTime()

    const proofData = await proofApi.getStatistics(startTime, stopTime, user)
    if(proofData?.avgWaitToFinal) { proofData.avgWaitToFinal = `${parseInt(proofData.avgWaitToFinal / (1000 * 60))} min ${parseInt(proofData.avgWaitToFinal / 1000) % 60} s` }
    if(proofData?.avgValidOkToFinal) { proofData.avgValidOkToFinal = `${parseInt(proofData.avgValidOkToFinal / (1000 * 60))} min ${parseInt(proofData.avgValidOkToFinal / 1000) % 60} s` }

    setData(proofData)
  }

  const autoHandler = () => dispatch(filterActions.autoProof())

  useEffect(() => {
    load(page)

    if(auto) { 
      const timer = setInterval(() => load(page), 10000) 

      return () => { clearInterval(timer) }
    }

  }, [page, triger, auto])


  return (
    <div className={styles.main}>
        <div className={styles.top}>
          <div className={styles.row}>
            <div>
              Count: {data?.finalCount || 0} | Wait: {data?.avgWaitToFinal || 0} | ValidOk: {data?.avgValidOkToFinal || 0}
            </div>
            <div className={`${styles.auto} ${auto? styles.open : null}`} onClick={autoHandler}>Auto</div>
          </div>
          <ProofFilter />
        </div>

        <div className={styles.table}>
            {proofs.map((proof) => <Proof proof={proof} refresh={() => load(page)} key={proof.id} />)}
        </div>

        <div className={styles.bottom}>
            <button onClick={pagination.back}>
                Previos
            </button>
            <button onClick={pagination.next}>
                Next
            </button>
        </div>
    </div>
  )
}

export default Valid