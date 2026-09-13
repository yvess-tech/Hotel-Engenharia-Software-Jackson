import { useState } from "react";
import imgForest from "@/imports/Tela1/3a93009c2376d8a57b19c35dd183458cfa7efcfa.png";
import imgBg from "@/imports/Tela1/a0d675e5dbbaa64a9cbd0de29255fe8fe8cd0e10.png";

const SERIF = "'Inria Serif', Georgia, serif";

type Props = { onLogin: (email: string, password: string) => void };

export default function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    onLogin(email, password);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#3e5525",
      }}
    >
      {/* Left panel — forest photo */}
      <div
        style={{
          position: "relative",
          width: "45%",
          minWidth: "340px",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <img
          src={imgForest}
          alt="Floresta Pacaás Novos"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
        {/* Overlay gradient */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(90deg, rgba(30,45,14,0.35) 0%, rgba(62,85,37,0.55) 100%)",
          }}
        />
        {/* Text on photo */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            left: "32px",
            right: "32px",
          }}
        >
          <p
            style={{
              fontFamily: SERIF,
              fontWeight: 400,
              fontSize: "1rem",
              color: "rgba(255,255,255,0.8)",
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
              color: "#ffffff",
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
              color: "rgba(255,255,255,0.55)",
              marginTop: "6px",
            }}
          >
            Porto Velho · Rondônia
          </p>
        </div>
      </div>

      {/* Right panel — login form */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 32px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background texture */}
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
            opacity: 0.07,
            pointerEvents: "none",
          }}
        />

        <div style={{ width: "100%", maxWidth: "380px", position: "relative", zIndex: 1 }}>
          {/* Brand */}
          <div style={{ marginBottom: "36px", textAlign: "center" }}>
            <div
              style={{
                width: "60px",
                height: "60px",
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(4px)",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
                border: "1.5px solid rgba(255,255,255,0.25)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              }}
            >
              <span
                style={{
                  fontFamily: SERIF,
                  fontWeight: 700,
                  fontSize: "1.8rem",
                  color: "#ffffff",
                }}
              >
                H
              </span>
            </div>
            <p
              style={{
                fontFamily: SERIF,
                fontWeight: 400,
                fontSize: "1rem",
                color: "rgba(255,255,255,0.7)",
                marginBottom: "4px",
              }}
            >
              Bem-vindo ao
            </p>
            <h1
              style={{
                fontFamily: SERIF,
                fontWeight: 700,
                fontSize: "1.75rem",
                color: "#ffffff",
                textShadow: "0 2px 8px rgba(0,0,0,0.25)",
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
                color: "rgba(255,255,255,0.45)",
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
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(12px)",
                borderRadius: "18px",
                padding: "28px 26px",
                border: "1.5px solid rgba(255,255,255,0.18)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
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
                    color: "rgba(255,255,255,0.85)",
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
                    color: "#1a1a1a",
                    background: "#f3f3f3",
                    border: "none",
                    borderRadius: "11px",
                    padding: "11px 14px",
                    width: "100%",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
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
                    color: "rgba(255,255,255,0.85)",
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
                    color: "#1a1a1a",
                    background: "#f3f3f3",
                    border: "none",
                    borderRadius: "11px",
                    padding: "11px 14px",
                    width: "100%",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                  }}
                />
              </div>

              {error && (
                <div
                  style={{
                    background: "rgba(220,38,38,0.15)",
                    border: "1px solid rgba(220,38,38,0.4)",
                    borderRadius: "9px",
                    padding: "9px 12px",
                    fontFamily: SERIF,
                    fontSize: "0.8rem",
                    color: "#fca5a5",
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
                  color: "#3e5525",
                  background: loading ? "rgba(243,243,243,0.7)" : "#f3f3f3",
                  border: "none",
                  borderRadius: "11px",
                  padding: "13px",
                  width: "100%",
                  cursor: loading ? "wait" : "pointer",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                  transition: "opacity 0.15s",
                  marginTop: "4px",
                }}
              >
                {loading ? "Entrando…" : "Entrar"}
              </button>
            </div>
          </form>

          <p
            style={{
              fontFamily: SERIF,
              fontSize: "0.72rem",
              color: "rgba(255,255,255,0.3)",
              textAlign: "center",
              marginTop: "20px",
            }}
          >
            Esqueceu a senha? Contate o administrador.
          </p>
        </div>
      </div>
    </div>
  );
}
