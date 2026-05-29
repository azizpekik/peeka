'use client'

import { useSidebar } from '@/context/SidebarContext'
import SuperAdminHeader from './components/SuperAdminHeader'
import SuperAdminSidebar from './components/SuperAdminSidebar'
import Backdrop from '@/layout/Backdrop'
import React from 'react'
import { usePathname } from 'next/navigation'

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar()
  const pathname = usePathname()
  
  // Check if current page is login page - don't show sidebar
  const isLoginPage = pathname === '/superadmin/login'

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? 'ml-0'
    : isExpanded || isHovered
    ? 'lg:ml-[290px]'
    : 'lg:ml-[90px]'

  // For login page, render children without sidebar
  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen xl:flex">
      {/* Sidebar and Backdrop */}
      <SuperAdminSidebar />
      <Backdrop />
      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}>
        {/* Header */}
        <SuperAdminHeader />
        {/* Page Content */}
        <div className="p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  )
}