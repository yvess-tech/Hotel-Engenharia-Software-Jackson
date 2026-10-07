import { useState } from "react";
import loginHero from "@/assets/images/login-hero.webp";
import imgBg from "@/imports/Tela1/a0d675e5dbbaa64a9cbd0de29255fe8fe8cd0e10.png";
import logo from "@/assets/logo.png";
import { Alert, Btn, FormActions, Input, Modal } from "./ui";

const SERIF = "'Inria Serif', Georgia, serif";

type Props = {
  onLogin: (email: string, password: string) => string | undefined;
  onRecoverPassword: (email: string) => string;
};

export default function LoginPage({ onLogin, onRecoverPassword }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Preencha e-mail e senha para continuar.");
      return;
    }
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    const loginError = onLogin(email, password);
    if (loginError) setError(loginError);
  };

  const handleRecovery = () => {
    if (!recoveryEmail.trim()) {
      setRecoveryMessage("Informe o e-mail cadastrado.");
      return;
    }
    setRecoveryMessage(onRecoverPassword(recoveryEmail));
  };

  return (
    <div
      className="login-page"
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "var(--bg-card)",
      }}
    >
      {/* Left panel — Pacaás Novos canyon */}
      <div
        className="login-hero"
        style={{
          position: "relative",
          width: "50%",
          minWidth: "340px",
          height: "100vh",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <img
          src={loginHero}
          alt="Cânion do Parque Nacional Pacaás Novos ao entardecer"
          loading="eager"
          fetchPriority="high"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center 40%",
          }}
        />
        {/* Text on photo */}
        <div
          className="login-hero-copy"
          style={{
            position: "absolute",
            bottom: "40px",
            left: "32px",
            right: "32px",
            zIndex: 1,
            textShadow: "0 1px 8px rgb(0 0 0 / 40%)",
          }}
        >
          <p
            style={{
              fontFamily: SERIF,
              fontWeight: 400,
              fontSize: "1rem",
              color: "color-mix(in srgb, var(--bg-card) 90%, transparent)",
              marginBottom: "4px",
            }}
          >
            Parque Nacional
          </p>
          <p
            style={{
              fontFamily: SERIF,
              fontWeight: 700,
              fontSize: "1.6rem",
              color: "var(--bg-card)",
              lineHeight: 1.2,
            }}
          >
            Pacaás Novos
          </p>
          <p
            style={{
              fontFamily: SERIF,
              fontWeight: 400,
              fontSize: "0.8rem",
              color: "color-mix(in srgb, var(--bg-card) 90%, transparent)",
              marginTop: "6px",
            }}
          >
            Porto Velho · Rondônia
          </p>
        </div>
      </div>

      {/* Right panel — white background */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 32px",
          position: "relative",
          overflow: "hidden",
          background: "var(--bg-card)",
        }}
      >
        {/* Subtle background texture */}
        <img
          src={imgBg}
          alt=""
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.03,
            pointerEvents: "none",
          }}
        />

        <div style={{ width: "100%", maxWidth: "380px", position: "relative", zIndex: 1 }}>
          {/* Brand */}
          <div style={{ marginBottom: "36px", textAlign: "center" }}>
            {/* Hotel logo */}
            <img
              src={logo}
              alt="Logo Hotel Pacaas Novos"
              style={{
                width: "120px",
                height: "auto",
                margin: "0 auto 16px",
                display: "block",
                objectFit: "contain",
              }}
            />
            <p
              style={{
                fontFamily: SERIF,
                fontWeight: 400,
                fontSize: "1rem",
                color: "var(--text-muted)",
                marginBottom: "4px",
              }}
            >
              Bem-vindo ao
            </p>
            <h1
              className="hotel-name"
              style={{
                fontFamily: SERIF,
                fontWeight: 700,
                fontSize: "1.75rem",
                color: "var(--brand-900)",
                lineHeight: 1.1,
              }}
            >
              Hotel Pacaas Novos
            </h1>
            <p
              style={{
                fontFamily: SERIF,
                fontWeight: 400,
                fontSize: "0.78rem",
                color: "var(--text-muted)",
                marginTop: "6px",
              }}
            >
              Sistema de Gestão Hoteleira
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div
              style={{
                background: "var(--bg-card)",
                borderRadius: "18px",
                padding: "28px 26px",
                border: "1.5px solid var(--border)",
                boxShadow: "0 4px 20px color-mix(in srgb, var(--brand-700) 7%, transparent)",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              {/* Email */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    color: "var(--brand-700)",
                    letterSpacing: "0.03em",
                  }}
                >
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  autoComplete="email"
                  style={{
                    fontFamily: SERIF,
                    fontSize: "0.92rem",
                    color: "var(--text-strong)",
                    background: "var(--bg-card)",
                    borderWidth: "1.5px",
                    borderStyle: "solid",
                    borderColor: "var(--border)",
                    borderRadius: "11px",
                    padding: "11px 14px",
                    width: "100%",
                  }}
                />
              </div>

              {/* Senha */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label
                  style={{
                    fontFamily: SERIF,
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    color: "var(--brand-700)",
                    letterSpacing: "0.03em",
                  }}
                >
                  Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{
                    fontFamily: SERIF,
                    fontSize: "0.92rem",
                    color: "var(--text-strong)",
                    background: "var(--bg-card)",
                    borderWidth: "1.5px",
                    borderStyle: "solid",
                    borderColor: "var(--border)",
                    borderRadius: "11px",
                    padding: "11px 14px",
                    width: "100%",
                  }}
                />
              </div>

              {error && (
                <div
                  style={{
                    background: "var(--danger-bg)",
                    borderWidth: "1px",
                    borderStyle: "solid",
                    borderColor: "var(--danger-bg)",
                    borderRadius: "9px",
                    padding: "9px 12px",
                    fontFamily: SERIF,
                    fontSize: "0.8rem",
                    color: "var(--danger-fg)",
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  fontFamily: SERIF,
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: "var(--bg-card)",
                  background: loading ? "var(--brand-700)" : "var(--brand-700)",
                  borderWidth: 0,
                  borderStyle: "solid",
                  borderColor: "transparent",
                  borderRadius: "11px",
                  padding: "13px",
                  width: "100%",
                  cursor: loading ? "wait" : "pointer",
                  boxShadow: "0 4px 14px color-mix(in srgb, var(--brand-700) 25%, transparent)",
                  transition: "background 0.15s",
                  marginTop: "4px",
                }}
              >
                {loading ? "Entrando…" : "Entrar"}
              </button>
            </div>
          </form>

          <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <Btn
              variant="ghost"
              fullWidth
              onClick={() => {
                setRecoveryEmail(email);
                setRecoveryMessage("");
                setRecoveryOpen(true);
              }}
            >
              Esqueci minha senha
            </Btn>
            <p
              style={{
                fontFamily: SERIF,
                fontSize: "0.72rem",
                color: "var(--text-muted)",
                textAlign: "center",
              }}
            >
              Acesso demonstrativo: admin@hotel.com · Hotel@2026
            </p>
          </div>
        </div>
      </div>
      {recoveryOpen && (
        <Modal
          title="Recuperar senha"
          onClose={() => setRecoveryOpen(false)}
        >
          <div className="space-y-4">
            <Alert type="info">
              Informe seu e-mail para receber as instruções de recuperação.
            </Alert>
            <Input
              label="E-mail cadastrado"
              type="email"
              value={recoveryEmail}
              onChange={(event) => setRecoveryEmail(event.target.value)}
            />
            {recoveryMessage && (
              <Alert
                type={
                  recoveryMessage.startsWith("Informe")
                    ? "error"
                    : "success"
                }
              >
                {recoveryMessage}
              </Alert>
            )}
            <FormActions>
              <Btn variant="ghost" onClick={() => setRecoveryOpen(false)}>
                Voltar
              </Btn>
              <Btn onClick={handleRecovery}>Enviar instruções</Btn>
            </FormActions>
          </div>
        </Modal>
      )}
    </div>
  );
}
