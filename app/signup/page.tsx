import { redirect } from 'next/navigation'

// Google OAuth handles signup automatically — no separate signup page needed
export default function SignupPage() {
  redirect('/login')
}
