"use client"

import Link from "next/link"
import Image from "next/image"
import { FC } from "react"

interface BrandProps {
  theme?: "dark" | "light"
}

export const Brand: FC<BrandProps> = ({ theme = "dark" }) => {
  return (
    <Link
      className="flex cursor-pointer flex-col items-center hover:opacity-50"
      href="https://www.chatbotui.com"
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="mb-2">
        <Image
          src="/logo.png"
          alt="Chatbot UI Logo"
          width={250}
          height={250}
          className="scale-30"
        />
      </div>

      {/* <div className="text-l font-bold tracking-wide">Making large language models clearer, fairer, and easier to understand.</div> */}
    </Link>
  )
}
