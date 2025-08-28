export type LoginMethod = 'password' | 'google'

const LAST_LOGIN_METHOD_KEY = 'lastLoginMethod'

export function setLastLoginMethod(method: LoginMethod): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LAST_LOGIN_METHOD_KEY, method)
  }
}

export function getLastLoginMethod(): LoginMethod | null {
  if (typeof window !== 'undefined') {
    const method = localStorage.getItem(LAST_LOGIN_METHOD_KEY)
    if (method === 'password' || method === 'google') {
      return method
    }
  }
  return null
}

export function clearLastLoginMethod(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LAST_LOGIN_METHOD_KEY)
  }
}

export function getLoginMethodDisplayName(method: LoginMethod): string {
  switch (method) {
    case 'password':
      return 'Email & Password'
    case 'google':
      return 'Google'
    default:
      return 'Unknown'
  }
}
