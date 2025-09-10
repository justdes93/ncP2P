import useApi from '../hooks/api.hook'


export default function useUserApi() {
    const { publicRequest, protectedRequest } = useApi()

    const twoFA = async (login, password) => {
        try { return await publicRequest('api/user/2fa', {login, password}) }
        catch(error) { return null } 
    }

    const verify = async (login, password, code) => {
        try { return await publicRequest('api/user/login', {login, password, code}) }
        catch(error) { return null } 
    }

    const get = async (id) => {
        try { return await protectedRequest('api/user/get', {id}) }
        catch(error) { return null } 
    }
    
    const UserList = async () => {
        try { return await protectedRequest('api/user/user-list', {}) }
        catch(error) { return [] } 
    }

    const MakerList = async () => {
        try { return await protectedRequest('api/user/maker-list', {}) }
        catch(error) { return [] } 
    }

    const PartnerList = async () => {
        try { return await protectedRequest('api/user/partner-list', {}) }
        catch(error) { return [] } 
    }

    const getAutoStatistics = async (start, stop) => {       
        try { return await protectedRequest('api/user/autoStatistic', {start, stop}) }
        catch(error) { return null } 
    }

    return { 
        twoFA,
        verify,
        get,
        UserList,
        MakerList,
        PartnerList,
        getAutoStatistics
    }
}