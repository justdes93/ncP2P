import React from 'react'
import { NavLink } from 'react-router-dom'

import useAuth from '../../hooks/auth.hook'
import { useSelector } from 'react-redux'
import * as authSelectors from '../../redux/selectors/auth.selectors'

import styles from './Menu.module.css'
import PartnerSelect from './PartnerSelect/PartnerSelect'


function Menu() {
    const { logout } = useAuth()
    const access = useSelector(authSelectors.access)


    return (
        <div className={styles.main}>
            <div className={styles.menu}>
                {(access === 'ADMIN' || access === 'MAKER') && (
                    <NavLink to={'./statistic'} className={styles.item}>
                        <div className={styles.icon}>
                            <i class="fa-solid fa-chart-line"></i>
                        </div>
                        <div className={styles.value}>
                            Dashboard
                        </div>
                    </NavLink>
                )}
                <NavLink to={'./invoices'} className={styles.item}>
                    <div className={styles.icon}>
                        <i class="fa-solid fa-forward"></i>
                    </div>
                    <div className={styles.value}>
                        Pay-in
                    </div>
                </NavLink>
                <NavLink to={'./payments'} className={styles.item}>
                    <div className={styles.icon}>
                        <i class="fa-solid fa-backward"></i>
                    </div>
                    <div className={styles.value}>
                        Pay-out
                    </div>
                </NavLink>
                <NavLink to={'./pool'} className={styles.item}>
                    <div className={styles.icon}>
                        <i class="fa-solid fa-list-ul"></i>
                    </div>
                    <div className={styles.value}>
                        Pool
                    </div>
                </NavLink>
                <NavLink to={'./proof'} className={styles.item}>
                    <div className={styles.icon}>
                        <i class="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <div className={styles.value}>
                        Proof
                    </div>
                </NavLink>
                {(access === 'ADMIN' || access === 'MAKER') && (
                    <NavLink to={'./make'} className={styles.item}>
                        <div className={styles.icon}>
                            <i class="fa-solid fa-calculator"></i>
                        </div>
                        <div className={styles.value}>
                            Make
                        </div>
                    </NavLink>
                )}
                {access === 'ADMIN' && (
                    <NavLink to={'./logs'} className={styles.item}>
                        <div className={styles.icon}>
                            <i class="fa-solid fa-code"></i>                    
                        </div>
                        <div className={styles.value}>
                            Logs
                        </div>
                    </NavLink>
                )}
            </div>

            <PartnerSelect />

            <div className={styles.logout}>
                <div className={styles.item} onClick={logout}>
                    <div className={styles.icon}>
                        <i class="fa-solid fa-key"></i>
                    </div>
                    <div className={styles.value}>
                        Logout
                    </div>
                </div>
            </div>
        </div>
    )
}


export default Menu