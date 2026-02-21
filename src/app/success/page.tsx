'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

// 1. Move the logic using useSearchParams into a child component
function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  return <div>Thank you! Your session ID is: {sessionId}</div>
}

// 2. Wrap that child in Suspense in your main page component
export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent />
    </Suspense>
  )
}