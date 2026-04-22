"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [userData, setUserData] = useState<{ nama_toko?: string; username?: string } | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const cookieStore = document.cookie
      const sessionMatch = cookieStore.match(/peeka_session=([^;]+)/)
      if (!sessionMatch) return

      try {
        const res = await fetch(`/api/user/me`, {
          headers: { 'x-session-id': sessionMatch[1] }
        })
        const json = await res.json()
        if (json.success) setUserData(json.data)
      } catch (e) {
        console.error('Failed to fetch user:', e)
      }
    }
    fetchUserData()
  }, [])

function toggleDropdown(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
  e.stopPropagation();
  setIsOpen((prev) => !prev);
}

  function closeDropdown() {
    setIsOpen(false);
  }
  return (
    <div className="relative">
      <button
        onClick={toggleDropdown} 
        className="flex items-center text-gray-700 dark:text-gray-400 dropdown-toggle"
      >
        <span className="mr-3 overflow-hidden rounded-full h-11 w-11">
          <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold text-sm">
            A
          </div>
        </span>

        <span className="block mr-1 font-medium text-theme-sm">{userData?.nama_toko || userData?.username || 'User'}</span>

        <svg
          className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div>
<span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
            {userData?.nama_toko || 'User'}
          </span>
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
            {userData?.jenis_usaha || 'User'}
          </span>
        </div>

      </Dropdown>
    </div>
  );
}
