'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSidebar } from '../context/SidebarContext'
import {
  GridIcon,
  HorizontaLDots,
} from '../icons/index'
import {
  ArrowLeftRight,
  TrendingDown,
  Users,
  Settings,
  User,
} from 'lucide-react'

type NavItem = {
  name: string
  icon: React.ReactNode
  path: string
}

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: 'Overview',
    path: '/dashboard',
  },
  {
    icon: <ArrowLeftRight size={20} />,
    name: 'Transaksi',
    path: '/dashboard/transaksi',
  },
  {
    icon: <TrendingDown size={20} />,
    name: 'Pengeluaran',
    path: '/dashboard/pengeluaran',
  },
  {
    icon: <Users size={20} />,
    name: 'Piutang',
    path: '/dashboard/piutang',
  },
]

const settingItems: NavItem[] = [
  {
    icon: <User size={20} />,
    name: 'Profile',
    path: '/dashboard/profile',
  },
]

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, closeMobileSidebar } = useSidebar()
  const pathname = usePathname()

  const isActive = (path: string) => path === pathname

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-950 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200
        ${
          isExpanded || isMobileOpen
            ? 'w-[290px]'
            : isHovered
            ? 'w-[290px]'
            : 'w-[90px]'
        }
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? 'lg:justify-center' : 'justify-start'
        }`}
      >
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image src="/logo/logo-peeka.png" alt="Peeka" width={36} height={36} className="flex-shrink-0 rounded-lg" />
          {(isExpanded || isHovered || isMobileOpen) && (
            <div>
              <p
                className="font-bold text-gray-900 dark:text-white leading-tight"
                style={{ fontFamily: 'Syne, sans-serif', fontSize: 18 }}
              >
                Peeka
              </p>
              <p className="text-[10px] text-gray-400 leading-tight">
                Kasir & Keuangan UMKM
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Nav */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? 'lg:justify-center'
                    : 'justify-start'
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  'Menu'
                ) : (
                  <HorizontaLDots />
                )}
              </h2>

              <ul className="flex flex-col gap-4">
                {navItems.map((nav) => (
                  <li key={nav.name}>
                    <Link
                      href={nav.path}
                      onClick={closeMobileSidebar}
                      className={`menu-item group ${
                        isActive(nav.path)
                          ? 'menu-item-active'
                          : 'menu-item-inactive'
                      } ${
                        !isExpanded && !isHovered
                          ? 'lg:justify-center'
                          : 'lg:justify-start'
                      }`}
                    >
                      <span
                        className={
                          isActive(nav.path)
                            ? 'menu-item-icon-active'
                            : 'menu-item-icon-inactive'
                        }
                      >
                        {nav.icon}
                      </span>
                      {(isExpanded || isHovered || isMobileOpen) && (
                        <span className="menu-item-text">{nav.name}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? 'lg:justify-center'
                    : 'justify-start'
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  'Setting'
                ) : (
                  <Settings size={16} />
                )}
              </h2>

              <ul className="flex flex-col gap-4">
                {settingItems.map((nav) => (
                  <li key={nav.name}>
                    <Link
                      href={nav.path}
                      onClick={closeMobileSidebar}
                      className={`menu-item group ${
                        isActive(nav.path)
                          ? 'menu-item-active'
                          : 'menu-item-inactive'
                      } ${
                        !isExpanded && !isHovered
                          ? 'lg:justify-center'
                          : 'lg:justify-start'
                      }`}
                    >
                      <span
                        className={
                          isActive(nav.path)
                            ? 'menu-item-icon-active'
                            : 'menu-item-icon-inactive'
                        }
                      >
                        {nav.icon}
                      </span>
                      {(isExpanded || isHovered || isMobileOpen) && (
                        <span className="menu-item-text">{nav.name}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </nav>
      </div>
    </aside>
  )
}

export default AppSidebar