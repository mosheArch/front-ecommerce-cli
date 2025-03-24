"use client"

import type React from "react"

import { useState } from "react"

interface EditProfilePopupProps {
    onClose: () => void
    onProfileUpdated: () => void
    customerAccessToken: string
    initialData: {
        firstName: string
        lastName: string
        email: string
        phone: string
    }
}

export function EditProfilePopup({
                                     onClose,
                                     onProfileUpdated,
                                     customerAccessToken,
                                     initialData,
                                 }: EditProfilePopupProps) {
    const [firstName, setFirstName] = useState(initialData.firstName || "")
    const [lastName, setLastName] = useState(initialData.lastName || "")
    const [email, setEmail] = useState(initialData.email || "")
    const [phone, setPhone] = useState(initialData.phone || "")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setSuccess("")
        setIsLoading(true)

        try {
            const response = await fetch("/api/shopify/customer/update", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token: customerAccessToken,
                    firstName,
                    lastName,
                    email,
                    phone,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Error al actualizar perfil")
            }

            if (data.success) {
                setSuccess(data.message || "Perfil actualizado correctamente")

                // Notificar al componente padre que el perfil se actualizó
                setTimeout(() => {
                    onProfileUpdated()
                }, 1500)
            } else {
                setError(data.error || "Error desconocido al actualizar perfil")
            }
        } catch (error) {
            setError(error.message || "Error al actualizar perfil")
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
                    <span style={{ color: "#cccccc", fontSize: "13px", fontWeight: "normal" }}>Editar Perfil</span>
                    <div style={{ width: "36px" }}></div> {/* Espacio para equilibrar el header */}
                </div>

                <div style={contentStyles}>
                    <form onSubmit={handleSubmit}>
                        {error && <div style={errorStyle}>{error}</div>}
                        {success && <div style={successStyle}>{success}</div>}

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
                            <label htmlFor="phone" style={{ display: "block", marginBottom: "5px" }}>
                                Teléfono:
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                style={inputStyle}
                            />
                        </div>

                        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                            <button
                                type="button"
                                onClick={onClose}
                                style={{ ...buttonStyle, backgroundColor: "#555", flex: 1 }}
                                disabled={isLoading}
                            >
                                Cancelar
                            </button>
                            <button type="submit" style={{ ...buttonStyle, flex: 1 }} disabled={isLoading}>
                                {isLoading ? "Guardando..." : "Guardar cambios"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    )
}

