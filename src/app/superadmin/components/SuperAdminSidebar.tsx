'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSidebar } from '@/context/SidebarContext'
import {
  GridIcon,
  HorizontaLDots,
} from '@/icons/index'
import {
  Users,
  Send,
  LogOut,
  Settings,
  Cog,
} from 'lucide-react'

type NavItem = {
  name: string
  icon: React.ReactNode
  path: string
}

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: 'Dashboard',
    path: '/superadmin',
  },
  {
    icon: <Users size={20} />,
    name: 'Users',
    path: '/superadmin/users',
  },
  {
    icon: <Send size={20} />,
    name: 'Broadcast',
    path: '/superadmin/broadcast',
  },
  {
    icon: <Cog size={20} />,
    name: 'Pengaturan',
    path: '/superadmin/settings',
  },
]

const SuperAdminSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, closeMobileSidebar } = useSidebar()
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (path: string) => {
    if (path === '/superadmin') {
      return pathname === '/superadmin'
    }
    return pathname.startsWith(path)
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/superadmin/api/auth/logout', {
        method: 'POST',
      })
      
      if (response.ok) {
        router.push('/superadmin/login')
        router.refresh()
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

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
        <Link href="/superadmin" className="flex items-center gap-3">
          <Image src="/logo/logo-peeka.png" alt="Peeka" width={36} height={36} className="flex-shrink-0 rounded-lg" />
          {(isExpanded || isHovered || isMobileOpen) && (
            <div>
              <p
                className="font-bold text-gray-900 dark:text-white leading-tight"
                style={{ fontFamily: 'Syne, sans-serif', fontSize: 18 }}
              >
                Peeka
              </p>
              <p className="text-[10px] text-brand-500 leading-tight font-medium">
                Superadmin
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Nav */}
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar flex-1">
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
          </div>
        </nav>
      </div>

      {/* Logout Button */}
      <div className="pb-6">
        <h2
          className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
            !isExpanded && !isHovered
              ? 'lg:justify-center'
              : 'justify-start'
          }`}
        >
          {isExpanded || isHovered || isMobileOpen ? (
            'Account'
          ) : (
            <Settings size={16} />
          )}
        </h2>
        <button
          onClick={handleLogout}
          className={`menu-item group menu-item-inactive w-full ${
            !isExpanded && !isHovered
              ? 'lg:justify-center'
              : 'lg:justify-start'
          }`}
        >
          <span className="menu-item-icon-inactive">
            <LogOut size={20} />
          </span>
          {(isExpanded || isHovered || isMobileOpen) && (
            <span className="menu-item-text">Logout</span>
          )}
        </button>
      </div>
    </aside>
  )
}

export default SuperAdminSidebar