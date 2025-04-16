"use client"

import { useState, useEffect } from "react"
import type { Space } from "@/types/space"
import axios from "axios"



const apiUrl = import.meta.env.VITE_API_URL + "/space"
// This is a mock function to simulate fetching data from an API
const fetchSpaces = async () => {
  
const spaces:any = await axios.get(apiUrl,{
  headers:{
    Authorization: `Bearer ${localStorage.getItem("token")}`
  }
})
return spaces.data.spaces
}

export function useSpaces() {
  const [spaces, setSpaces] = useState<Space[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const loadSpaces = async () => {
      try {
        const data = await fetchSpaces()
        setSpaces(data)
        setIsLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("An error occurred while fetching spaces"))
        setIsLoading(false)
      }
    }

    loadSpaces()
  }, [])

  return { spaces, isLoading, error }
}
