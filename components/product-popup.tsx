"use client"

import { useState } from "react"

interface ProductPopupProps {
    product: any
    onClose: () => void
}

export function ProductPopup({ product, onClose }: ProductPopupProps) {
    const [selectedImage, setSelectedImage] = useState(product.images[0]?.url || null)

    if (!product) return null

    // Estilos inline para garantizar tamaños exactos y estilo macOS
    const popupStyles = {
        width: "400px",
        height: "300px",
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
        display: "flex",
        height: "calc(300px - 36px)",
        padding: "0",
    }

    const imageStyles = {
        width: "160px",
        height: "100%",
        position: "relative" as const,
        borderRight: "1px solid #3a3a3a",
    }

    const detailsStyles = {
        width: "calc(400px - 160px)",
        padding: "12px",
        overflowY: "auto" as const,
        fontSize: "13px",
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
                    <span style={{ color: "#cccccc", fontSize: "13px", fontWeight: "normal" }}>{product.title}</span>
                    <div style={{ width: "36px" }}></div> {/* Espacio para equilibrar el header */}
                </div>

                <div style={contentStyles}>
                    <div style={imageStyles}>
                        {selectedImage && (
                            <div style={{ position: "relative", width: "100%", height: "100%" }}>
                                <img
                                    src={selectedImage || "/placeholder.svg"}
                                    alt={product.title}
                                    style={{
                                        position: "absolute",
                                        top: "50%",
                                        left: "50%",
                                        transform: "translate(-50%, -50%)",
                                        maxWidth: "90%",
                                        maxHeight: "90%",
                                        objectFit: "contain",
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    <div style={detailsStyles}>
                        <div style={{ marginBottom: "12px" }}>
                            <p style={{ fontWeight: "bold", margin: "0 0 4px 0" }}>
                                ${Number.parseFloat(product.price).toFixed(2)} {product.currency}
                            </p>
                            <p style={{ color: product.available ? "#27c93f" : "#ff5f56", margin: 0 }}>
                                {product.available ? "En stock" : "Agotado"}
                            </p>
                        </div>

                        <div style={{ marginBottom: "12px" }}>
                            <h3 style={{ fontWeight: "bold", margin: "0 0 4px 0", fontSize: "13px" }}>Descripción:</h3>
                            <p style={{ margin: 0, lineHeight: "1.4" }}>{product.description}</p>
                        </div>

                        {product.variants.length > 0 && (
                            <div>
                                <h3 style={{ fontWeight: "bold", margin: "0 0 4px 0", fontSize: "13px" }}>Variantes:</h3>
                                <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
                                    {product.variants.map((variant, index) => (
                                        <li key={index} style={{ margin: "0 0 4px 0" }}>
                                            {variant.title} - ${Number.parseFloat(variant.price.amount).toFixed(2)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

