'use client'

import { createContext, useContext } from 'react'
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

const InitialSessionContext = createContext(null)

export function ServerSessionProvider({ session, children }) {
  return (
    <InitialSessionContext.Provider value={session}>
      {children}
    </InitialSessionContext.Provider>
  )
}

export function useInitialSession() {
  return useContext(InitialSessionContext)
}

export function SessionProvider({ children, session }) {
  return (
    <NextAuthSessionProvider
      session={session}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      {children}
    </NextAuthSessionProvider>
  )
}
