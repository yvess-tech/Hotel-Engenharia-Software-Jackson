import { useState } from "react";
import LoginPage from "./components/LoginPage";
import AppShell from "./components/AppShell";
import {
  AccessControlProvider,
  useAccessControl,
  type SessionUser,
} from "./access-control";

export type User = SessionUser;

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const { authenticate, recoverPassword, endSession } = useAccessControl();

  const handleLogin = (email: string, password: string) => {
    const result = authenticate(email, password);
    if (result.user) setUser(result.user);
    return result.error;
  };

  const handleLogout = () => {
    endSession();
    setUser(null);
  };

  if (!user) {
    return (
      <LoginPage
        onLogin={handleLogin}
        onRecoverPassword={recoverPassword}
      />
    );
  }
  return <AppShell user={user} onLogout={handleLogout} />;
}

export default function App() {
  return (
    <AccessControlProvider>
      <AppContent />
    </AccessControlProvider>
  );
}
