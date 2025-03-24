"use client"

import type React from "react"

import { useState } from "react"

interface RecoverPasswordPopupProps {
    onClose: () => void
    onSwitchToLogin: () => void
}

export function RecoverPasswordPopup({ onClose, onSwitchToLogin }: RecoverPasswordPopupProps) {
    const [email, setEmail] = useState("")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setSuccess("")
        setIsLoading(true)

        try {
            const response = await fetch("/api/shopify/customer/recover", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Error al solicitar recuperación de contraseña")
            }

            if (data.success) {
                setSuccess(
                    data.message || "Se ha enviado un correo electrónico con instrucciones para restablecer tu contraseña.",
                )
            } else {
                setError(data.error || "Error desconocido al solicitar recuperación de contraseña")
            }
        } catch (error) {
            setError(error.message || "Error al solicitar recuperación de contraseña")
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

    const successStyle = {
        color: "#27c93f",
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
                    <span style={{ color: "#cccccc", fontSize: "13px", fontWeight: "normal" }}>Recuperar Contraseña</span>
                    <div style={{ width: "36px" }}></div> {/* Espacio para equilibrar el header */}
                </div>

                <div style={contentStyles}>
                    {success ? (
                        <div>
                            <div style={successStyle}>{success}</div>
                            <p style={{ marginBottom: "15px" }}>
                                Revisa tu correo electrónico y sigue las instrucciones para restablecer tu contraseña.
                            </p>
                            <button onClick={onSwitchToLogin} style={buttonStyle}>
                                Volver a Iniciar Sesión
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {error && <div style={errorStyle}>{error}</div>}

                            <p style={{ marginBottom: "15px" }}>
                                Ingresa tu dirección de correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
                            </p>

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

                            <button type="submit" disabled={isLoading} style={buttonStyle}>
                                {isLoading ? "Enviando..." : "Enviar instrucciones"}
                            </button>

                            <div style={{ textAlign: "center", marginTop: "20px" }}>
                                <a onClick={onSwitchToLogin} style={linkStyle}>
                                    Volver a Iniciar Sesión
                                </a>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </>
    )
}

