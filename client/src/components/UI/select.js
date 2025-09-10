import React, { useState } from 'react'


function Select({list, values, check, add}) {
  const [open, setOpen] = useState(false)

  return (
    <div className='select'>
        <div className='select__value' onClick={() => setOpen((prew) => !prew)}>
            {values.length? values.map((item) => <span>{item.label},</span>) : 'ALL'}
        </div>
        <div className={`select__list ${open? 'open' : null}`} >
            {list.map((item) => <div className={`select__item ${check(item)? 'selected' : null}`} onClick={() => add(item)} key={item?.id}>{item?.label}</div>)}
        </div>
    </div>
  )
}

export default Select