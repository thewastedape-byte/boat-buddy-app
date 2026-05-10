'use client'

export interface User {
  email: string
  name: string
}

const AUTH_KEY = 'boat_buddy_auth'
const TC_KEY = 'boat_buddy_tc_accepted'
const USERS_KEY = 'boat_buddy_users'
const SESSION_KEY = 'boat_buddy_session_id'

function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

function generateSessionId(): string {
  return 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function getUsers(): Record<string, { password: string; name: string }> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function signup(email: string, password: string): { success: boolean; error?: string } {
  const users = getUsers()
  if (users[email]) {
    return { success: false, error: 'An account with this email already exists.' }
  }
  users[email] = { password, name: email.split('@')[0] }
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  return { success: true }
}

export function login(email: string, password: string): { success: boolean; error?: string; firstLogin?: boolean } {
  const users = getUsers()
  if (!users[email]) {
    return { success: false, error: 'No account found with this email.' }
  }
  if (users[email].password !== password) {
    return { success: false, error: 'Incorrect password.' }
  }
  const token = generateToken()
  const auth = { token, email, name: users[email].name, loginTime: Date.now() }
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth))
  
  // Check if T&C accepted
  const tcAccepted = localStorage.getItem(TC_KEY + '_' + email)
  return { success: true, firstLogin: !tcAccepted }
}

const ADMIN_EMAILS = ['thewastedape@gmail.com', 'howirolloldschool@gmail.com', 'benjamin.green7@gmail.com', 'zrudick@gmail.com', 'brittanirudick@gmail.com']

export function getAuth(): { token: string; email: string; name: string; subscription?: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    const auth = JSON.parse(raw)
    // Admin emails always get Admiral tier regardless of stored subscription
    if (auth?.email && ADMIN_EMAILS.includes(auth.email.toLowerCase())) {
      return { ...auth, subscription: 'admiral' }
    }
    return auth
  } catch {
    return null
  }
}

export function isLoggedIn(): boolean {
  return getAuth() !== null
}

export function logout() {
  localStorage.removeItem(AUTH_KEY)
}

export function acceptTerms() {
  const auth = getAuth()
  if (auth) {
    localStorage.setItem(TC_KEY + '_' + auth.email, 'true')
  }
}

export function hasAcceptedTerms(): boolean {
  const auth = getAuth()
  if (!auth) return false
  return localStorage.getItem(TC_KEY + '_' + auth.email) === 'true'
}

export function getOrCreateSessionId(): string {
  let sid = localStorage.getItem(SESSION_KEY)
  if (!sid) {
    sid = generateSessionId()
    localStorage.setItem(SESSION_KEY, sid)
  }
  return sid
}

export function newSession(): string {
  const sid = generateSessionId()
  localStorage.setItem(SESSION_KEY, sid)
  return sid
}

export function changePassword(email: string, currentPassword: string, newPassword: string): { success: boolean; error?: string } {
  const users = getUsers()
  if (!users[email]) return { success: false, error: 'Account not found.' }
  if (users[email].password !== currentPassword) return { success: false, error: 'Current password is incorrect.' }
  if (newPassword.length < 6) return { success: false, error: 'New password must be at least 6 characters.' }
  users[email].password = newPassword
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  return { success: true }
}

export function generateResetCode(email: string): string | null {
  const users = getUsers()
  if (!users[email]) return null
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const resetData = { code, email, expires: Date.now() + 15 * 60 * 1000 } // 15 min
  localStorage.setItem('boat_buddy_reset_' + email, JSON.stringify(resetData))
  return code
}

export function verifyResetCode(email: string, code: string): boolean {
  try {
    const raw = localStorage.getItem('boat_buddy_reset_' + email)
    if (!raw) return false
    const data = JSON.parse(raw)
    if (data.code !== code) return false
    if (Date.now() > data.expires) return false
    return true
  } catch { return false }
}

export function resetPassword(email: string, code: string, newPassword: string): { success: boolean; error?: string } {
  if (!verifyResetCode(email, code)) return { success: false, error: 'Invalid or expired reset code.' }
  const users = getUsers()
  if (!users[email]) return { success: false, error: 'Account not found.' }
  if (newPassword.length < 6) return { success: false, error: 'Password must be at least 6 characters.' }
  users[email].password = newPassword
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  localStorage.removeItem('boat_buddy_reset_' + email)
  return { success: true }
}

