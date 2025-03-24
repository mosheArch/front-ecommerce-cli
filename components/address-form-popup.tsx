"use client"

import type React from "react"

import { useState, useEffect } from "react"

interface AddressFormPopupProps {
    onClose: () => void
    onAddressSubmitted: () => void
    customerAccessToken: string
    initialData?: {
        id?: string
        address1: string
        address2?: string
        city: string
        province: string
        country: string
        zip: string
        phone?: string
    }
    isEditing?: boolean
    addressId?: string | null
}

export function AddressFormPopup({
                                     onClose,
                                     onAddressSubmitted,
                                     customerAccessToken,
                                     initialData,
                                     isEditing = false,
                                     addressId = null,
                                 }: AddressFormPopupProps) {
    const [address1, setAddress1] = useState(initialData?.address1 || "")
    const [address2, setAddress2] = useState(initialData?.address2 || "")
    const [city, setCity] = useState(initialData?.city || "")
    const [province, setProvince] = useState(initialData?.province || "")
    const [country, setCountry] = useState(initialData?.country || "México")
    const [zip, setZip] = useState(initialData?.zip || "")
    const [phone, setPhone] = useState(initialData?.phone || "+52 ")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [loadingAddress, setLoadingAddress] = useState(isEditing && addressId)

    // Cargar los datos de la dirección si se está editando
    useEffect(() => {
        if (isEditing && addressId && customerAccessToken) {
            fetchAddressDetails()
        }
    }, [isEditing, addressId, customerAccessToken])

    const fetchAddressDetails = async () => {
        try {
            setLoadingAddress(true)
            const response = await fetch(`/api/shopify/customer/info?token=${customerAccessToken}`)
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Error al obtener información del cliente")
            }

            if (data.success && data.customer) {
                // Buscar la dirección por ID numérico
                const addressEdge = data.customer.addresses.edges.find((edge) => {
                    const idParts = edge.node.id.split("/")
                    const numericId = idParts[idParts.length - 1].split("?")[0] // Obtener solo el ID numérico sin el token
                    return numericId === addressId
                })

                if (addressEdge) {
                    const address = addressEdge.node
                    setAddress1(address.address1 || "")
                    setAddress2(address.address2 || "")
                    setCity(address.city || "")
                    setProvince(address.province || "")
                    setCountry(address.country || "México")
                    setZip(address.zip || "")
                    setPhone(address.phone || "+52 ")
                } else {
                    setError("No se encontró la dirección especificada")
                }
            }
        } catch (error) {
            setError("Error al cargar los datos de la dirección: " + error.message)
        } finally {
            setLoadingAddress(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setSuccess("")
        setIsLoading(true)

        try {
            // Si estamos editando, primero necesitamos obtener el ID completo
            let fullAddressId = null

            if (isEditing && addressId) {
                const infoResponse = await fetch(`/api/shopify/customer/info?token=${customerAccessToken}`)
                const infoData = await infoResponse.json()

                if (!infoResponse.ok || !infoData.success) {
                    throw new Error(infoData.error || "Error al obtener información del cliente")
                }

                // Buscar la dirección por ID numérico
                const addressEdge = infoData.customer.addresses.edges.find((edge) => {
                    const idParts = edge.node.id.split("/")
                    const numericId = idParts[idParts.length - 1].split("?")[0] // Obtener solo el ID numérico sin el token
                    return numericId === addressId
                })

                if (!addressEdge) {
                    throw new Error(`No se encontró una dirección con ID ${addressId}`)
                }

                fullAddressId = addressEdge.node.id
            }

            const endpoint = isEditing ? "/api/shopify/customer/address/update" : "/api/shopify/customer/address/create"

            const payload = isEditing
                ? {
                    token: customerAccessToken,
                    addressId: fullAddressId,
                    address: {
                        address1,
                        address2,
                        city,
                        province,
                        country,
                        zip,
                        phone,
                    },
                }
                : {
                    token: customerAccessToken,
                    address: {
                        address1,
                        address2,
                        city,
                        province,
                        country,
                        zip,
                        phone,
                    },
                }

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || `Error al ${isEditing ? "actualizar" : "crear"} dirección`)
            }

            if (data.success) {
                setSuccess(data.message || `Dirección ${isEditing ? "actualizada" : "creada"} correctamente`)

                // Notificar al componente padre que la dirección se creó/actualizó
                setTimeout(() => {
                    onAddressSubmitted()
                }, 1500)
            } else {
                setError(data.error || `Error desconocido al ${isEditing ? "actualizar" : "crear"} dirección`)
            }
        } catch (error) {
            setError(error.message || `Error al ${isEditing ? "actualizar" : "crear"} dirección`)
        } finally {
            setIsLoading(false)
        }
    }

    // Estilos inline para garantizar tamaños exactos y estilo macOS
    const popupStyles = {
        width: "450px",
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
                    <span style={{ color: "#cccccc", fontSize: "13px", fontWeight: "normal" }}>
            {isEditing ? "Editar Dirección" : "Nueva Dirección"}
          </span>
                    <div style={{ width: "36px" }}></div> {/* Espacio para equilibrar el header */}
                </div>

                <div style={contentStyles}>
                    {loadingAddress ? (
                        <div style={{ textAlign: "center", padding: "20px" }}>Cargando datos de la dirección...</div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {error && <div style={errorStyle}>{error}</div>}
                            {success && <div style={successStyle}>{success}</div>}

                            <div>
                                <label htmlFor="address1" style={{ display: "block", marginBottom: "5px" }}>
                                    Dirección Línea 1:
                                </label>
                                <input
                                    type="text"
                                    id="address1"
                                    value={address1}
                                    onChange={(e) => setAddress1(e.target.value)}
                                    required
                                    style={inputStyle}
                                    placeholder="Calle y número"
                                />
                            </div>

                            <div>
                                <label htmlFor="address2" style={{ display: "block", marginBottom: "5px" }}>
                                    Dirección Línea 2 (opcional):
                                </label>
                                <input
                                    type="text"
                                    id="address2"
                                    value={address2}
                                    onChange={(e) => setAddress2(e.target.value)}
                                    style={inputStyle}
                                    placeholder="Apartamento, suite, unidad, etc."
                                />
                            </div>

                            <div>
                                <label htmlFor="city" style={{ display: "block", marginBottom: "5px" }}>
                                    Ciudad:
                                </label>
                                <input
                                    type="text"
                                    id="city"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    required
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label htmlFor="province" style={{ display: "block", marginBottom: "5px" }}>
                                    Estado/Provincia:
                                </label>
                                <input
                                    type="text"
                                    id="province"
                                    value={province}
                                    onChange={(e) => setProvince(e.target.value)}
                                    required
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label htmlFor="country" style={{ display: "block", marginBottom: "5px" }}>
                                    País:
                                </label>
                                <input
                                    type="text"
                                    id="country"
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    required
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label htmlFor="zip" style={{ display: "block", marginBottom: "5px" }}>
                                    Código Postal:
                                </label>
                                <input
                                    type="text"
                                    id="zip"
                                    value={zip}
                                    onChange={(e) => setZip(e.target.value)}
                                    required
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label htmlFor="phone" style={{ display: "block", marginBottom: "5px" }}>
                                    Teléfono (opcional):
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
                                    {isLoading ? "Guardando..." : isEditing ? "Actualizar" : "Guardar"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </>
    )
}

