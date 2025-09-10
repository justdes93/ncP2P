import useApi from '../hooks/api.hook'
import { useSelector } from 'react-redux'
import * as filterSelectors from '../redux/selectors/filter.selectors'


export default function useInvoiceApi() {
    const { publicRequest, protectedRequest } = useApi()

    const filter = useSelector(filterSelectors.invoice)

    const reject = async (id) => {       
        try { return await protectedRequest('api/invoice/reject', {id}) }
        catch(error) { return null } 
    }

    const forse = async (id) => {       
        try { return await protectedRequest('api/invoice/forse', {id}) }
        catch(error) { return null } 
    }

    const valid = async (id) => {       
        try { return await protectedRequest('api/invoice/valid', {id}) }
        catch(error) { return null } 
    }

    const validOk = async (id) => {       
        try { return await protectedRequest('api/invoice/validOk', {id}) }
        catch(error) { return null } 
    }

    const scam = async (id) => {       
        try { return await protectedRequest('api/invoice/scam', {id}) }
        catch(error) { return null } 
    }

    const change = async (id, amount) => {       
        try { return await protectedRequest('api/invoice/change', {id, amount}) }
        catch(error) { return null } 
    }

    const getStatistics = async (start, stop) => {       
        try { return await protectedRequest('api/invoice/statistic', {start, stop}) }
        catch(error) { return null } 
    }

    const list = async (page=1, limit=20) => {       
        try { return await protectedRequest('api/invoice/list', {filter, page, limit}) }
        catch(error) { return {list: [], count: 0} } 
    }

    return { 
        reject,
        valid,
        validOk,
        list,
        forse,
        change,
        scam,

        getStatistics
    }
}