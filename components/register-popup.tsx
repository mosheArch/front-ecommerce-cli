"use client"

import type React from "react"

import { useState } from "react"

interface RegisterPopupProps {
  onClose: () => void
  onRegisterSuccess: () => void
  onSwitchToLogin: () => void
}

export function RegisterPopup({ onClose, onRegisterSuccess, onSwitchToLogin }: RegisterPopupProps) {
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [acceptsMarketing, setAcceptsMarketing] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/shopify/customer/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          acceptsMarketing,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al registrarse")
      }

      if (data.success) {
        // Notificar éxito y cerrar el popup
        onRegisterSuccess()

        // Eliminar la redirección a la página de cuenta
        // if (data.accountUrl) {
        //   window.location.href = data.accountUrl
        // }
      } else {
        setError(data.error || "Error desconocido al registrarse")
      }
    } catch (error) {
      setError(error.message || "Error al registrarse")
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
    maxHeight: "500px",
    overflowY: "auto" as const,
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

  const checkboxContainerStyle = {
    display: "flex",
    alignItems: "center",
    marginBottom: "15px",
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
            <span style={{ color: "#cccccc", fontSize: "13px", fontWeight: "normal" }}>Registro</span>
            <div style={{ width: "36px" }}></div> {/* Espacio para equilibrar el header */}
          </div>

          <div style={contentStyles}>
            <form onSubmit={handleSubmit}>
              {error && <div style={errorStyle}>{error}</div>}

              <div>
                <label htmlFor="firstName" style={{ display: "block", marginBottom: "5px" }}>
                  Nombre:
                </label>
                <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="lastName" style={{ display: "block", marginBottom: "5px" }}>
                  Apellido:
                </label>
                <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    style={inputStyle}
                />
              </div>

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
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" style={{ display: "block", marginBottom: "5px" }}>
                  Confirmar Contraseña:
                </label>
                <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={inputStyle}
                />
              </div>

              <div style={checkboxContainerStyle}>
                <input
                    type="checkbox"
                    id="acceptsMarketing"
                    checked={acceptsMarketing}
                    onChange={(e) => setAcceptsMarketing(e.target.checked)}
                    style={{ marginRight: "10px" }}
                />
                <label htmlFor="acceptsMarketing">Quiero recibir ofertas y novedades por email</label>
              </div>

              <button type="submit" disabled={isLoading} style={buttonStyle}>
                {isLoading ? "Registrando..." : "Registrarse"}
              </button>
            </form>

            <div style={{ textAlign: "center", marginTop: "20px" }}>
              <p>¿Ya tienes una cuenta?</p>
              <a onClick={onSwitchToLogin} style={linkStyle}>
                Iniciar Sesión
              </a>
            </div>
          </div>
        </div>
      </>
  )
}

