'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

// 1. Create a component for the content that needs search params
function PaymentContent() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status')
  
  return <div>Payment Status: {status}</div>
}

// 2. Wrap it in Suspense in your default export
export default function PaymentPage() {
  return (
    // The fallback is shown while the client-side params are being resolved
    <Suspense fallback={<div>Loading payment details...</div>}>
      <PaymentContent />
    </Suspense>
  )
}