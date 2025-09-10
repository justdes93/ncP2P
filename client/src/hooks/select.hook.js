import {  useRef, useState } from 'react'


export default function useSelect() {
    const [list, setList] = useState([])
    const [values, setValues] = useState([])
    
    const check = (checkItem) => !!values.filter((item) => checkItem.id === item.id).length
    const add = (addItem) => {
        setValues((prew) => {
            const withoutValues = prew.filter((item) => addItem.id !== item.id)
            const exist = (withoutValues.length !== values.length) 

            if(exist) { return withoutValues }
            return [...prew, addItem]
        })
    }

    return {
        bind: { list, values, check, add },
        values,
        setValues,
        setList
    }
}