import { useState } from "react"
import LoginPage from "./components/LoginPage"
import AppShell from "./components/AppShell"

export type User = {
  name: string
  role: string
  email: string
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)

  const handleLogin = (email: string, _password: string) => {
    setUser({ name: "João Carlos", role: "Administrador", email })
  }

  const handleLogout = () => setUser(null)

  if (!user) return <LoginPage onLogin={handleLogin} />
  return <AppShell user={user} onLogout={handleLogout} />
}
