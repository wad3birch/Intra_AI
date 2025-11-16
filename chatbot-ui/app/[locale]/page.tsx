"use client"

import { IconArrowRight } from "@tabler/icons-react"
import Image from "next/image"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="flex size-full flex-col items-center justify-center">
      <div>
        <Image
          src="/logo.png"
          alt="Chatbot UI Logo"
          width={250}
          height={250}
          className="scale-30"
        />
      </div>

      {/* <div className="mt-2 text-4xl font-bold">Chatbot UI</div> */}

      <Link
        className="mt-4 flex w-[200px] items-center justify-center rounded-md"
        style={{ backgroundColor: "rgb(25,46,81)" }}
        href="/login"
      >
        <span className="p-2 font-semibold text-white">Start Chatting</span>
        <IconArrowRight className="ml-1" size={20} color="white" />
      </Link>
    </div>
  )
}
