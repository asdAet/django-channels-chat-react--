import { useEffect, useState } from 'react'

import { authController } from '../controllers/AuthController'
import { debugLog } from '../shared/lib/debug'

export const usePasswordRules = (enabled: boolean) => {
  const [rules, setRules] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!enabled) return
    let active = true
    queueMicrotask(() => setLoading(true))
    authController
      .getPasswordRules()
      .then((data) => {
        if (!active) return
        setRules(Array.isArray(data.rules) ? data.rules : [])
      })
      .catch((err) => {
        debugLog('Password rules fetch failed', err)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [enabled])

  return { rules, loading }
}
