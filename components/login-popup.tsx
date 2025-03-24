"use client"

import type React from "react"

import { useState } from "react"

interface LoginPopupProps {
  onClose: () => void
  onLoginSuccess: (token: string, expiresAt: string) => void
  onSwitchToRegister: () => void
  onSwitchToRecover: () => void
}

export function LoginPopup({ onClose, onLoginSuccess, onSwitchToRegister, onSwitchToRecover }: LoginPopupProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/shopify/customer/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al iniciar sesión")
      }

      if (data.success && data.customerAccessToken) {
        // Guardar el token localmente
        onLoginSuccess(data.customerAccessToken.accessToken, data.customerAccessToken.expiresAt)

        // Eliminar la redirección a la página de cuenta
        // if (data.accountUrl) {
        //   window.location.href = data.accountUrl
        // }
      } else {
        setError(data.error || "Error desconocido al iniciar sesión")
      }
    } catch (error) {
      setError(error.message || "Error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  // Estilos inline para garantizar tamaños exactos y estilo macOS
  const popupStyles = {
    width: "400px",
    position: "fixed" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "#1e1e1e",
    borderRadius: "8px",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column" as const,
    overflow: "hidden",
  }

  const headerStyles = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    backgroundColor: "#2d2d2d",
    borderTopLeftRadius: "8px",
    borderTopRightRadius: "8px",
  }

  const contentStyles = {
    padding: "20px",
    color: "#f8f8f8",
    fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
  }

  const overlayStyles = {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    backdropFilter: "blur(3px)",
    zIndex: 999,
  }

  // Estilo para los botones de control de ventana
  const controlsContainerStyle = {
    display: "flex",
    gap: "6px",
  }

  const controlButtonStyle = {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    cursor: "pointer",
  }

  const inputStyle = {
    width: "100%",
    padding: "8px 12px",
    marginBottom: "15px",
    backgroundColor: "#333",
    border: "1px solid #444",
    borderRadius: "4px",
    color: "#f8f8f8",
    fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
    fontSize: "14px",
  }

  const buttonStyle = {
    width: "100%",
    padding: "10px",
    backgroundColor: "#007aff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
    fontSize: "14px",
    marginTop: "10px",
  }

  const linkStyle = {
    color: "#007aff",
    textDecoration: "none",
    cursor: "pointer",
    marginTop: "15px",
    display: "inline-block",
    fontSize: "14px",
  }

  const errorStyle = {
    color: "#ff5f56",
    marginBottom: "15px",
    fontSize: "14px",
  }

  return (
      <>
        <div style={overlayStyles} onClick={onClose}></div>
        <div style={popupStyles}>
          <div style={headerStyles}>
            <div style={controlsContainerStyle}>
              <div style={{ ...controlButtonStyle, backgroundColor: "#ff5f56" }} onClick={onClose}></div>
              <div style={{ ...controlButtonStyle, backgroundColor: "#ffbd2e" }}></div>
              <div style={{ ...controlButtonStyle, backgroundColor: "#27c93f" }}></div>
            </div>
            <span style={{ color: "#cccccc", fontSize: "13px", fontWeight: "normal" }}>Iniciar Sesión</span>
            <div style={{ width: "36px" }}></div> {/* Espacio para equilibrar el header */}
          </div>

          <div style={contentStyles}>
            <form onSubmit={handleLogin}>
              {error && <div style={errorStyle}>{error}</div>}

              <div>
                <label htmlFor="email" style={{ display: "block", marginBottom: "5px" }}>
                  Email:
                </label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={inputStyle}
                    placeholder="tu@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" style={{ display: "block", marginBottom: "5px" }}>
                  Contraseña:
                </label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={inputStyle}
                    placeholder="Tu contraseña"
                />
              </div>

              <div style={{ textAlign: "right", marginBottom: "15px" }}>
                <a onClick={onSwitchToRecover} style={linkStyle}>
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <button type="submit" disabled={isLoading} style={buttonStyle}>
                {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <p>¿No tienes una cuenta?</p>
              <a onClick={onSwitchToRegister} style={linkStyle}>
                Registrarse
              </a>
            </div>
          </div>
        </div>
      </>
  )
}

