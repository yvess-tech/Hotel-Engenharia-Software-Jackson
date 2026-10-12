import LoginPage from "./components/LoginPage";
import AppShell from "./components/AppShell";
import {
  AccessControlProvider,
  useAccessControl,
  type SessionUser,
} from "./access-control";

export type User = SessionUser;

function AppContent() {
  const { authenticate, recoverPassword, endSession, activeSession: user } =
    useAccessControl();

  const handleLogin = (email: string, password: string) => {
    const result = authenticate(email, password);
    return result.error;
  };

  const handleLogout = () => {
    endSession();
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
