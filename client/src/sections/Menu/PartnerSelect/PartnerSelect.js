import React, { useEffect, useState } from 'react'

import { useSelector } from 'react-redux'
import * as filterSelectors from '../../../redux/selectors/filter.selectors'

import Select from '../../../components/UI/select'
import useUserApi from '../../../API/user.api'
import useFilter from '../../../hooks/filter.hook'


function PartnerSelect() {
    const userApi = useUserApi()
    const Filter = useFilter()

    const partnerFilter = useSelector(filterSelectors.partners)

    const [partnersList, setPartnersList] = useState([])

    useEffect(() => {
        const load = async () => {
            const list = await userApi.PartnerList()
            setPartnersList(list.map((partner) => ({ id: partner.id, label: partner.name })))
        }

        load()
    }, [])

    const add = (item) => {
        if(partnerFilter?.includes(item.id)) { return Filter.setPartnersFilter(partnerFilter.filter((partner) => item.id !== partner)) }
        return Filter.setPartnersFilter([...partnerFilter, item.id])
    }

    const check = (item) => partnerFilter?.includes(item.id)
    const partnerValues = partnersList.filter((item) => partnerFilter?.includes(item.id)) 

    return <Select list={partnersList} values={partnerValues} add={add} check={check} />
}


export default PartnerSelect