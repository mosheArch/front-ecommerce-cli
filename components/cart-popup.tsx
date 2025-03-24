"use client"

import { useState } from "react"
import { ShoppingCart, Plus, Minus, Trash2, CreditCard } from "lucide-react"

interface CartItem {
    id: string
    productId: string
    variantId: string
    title: string
    price: number
    currency: string
    quantity: number
    imageUrl?: string
}

interface CartPopupProps {
    onClose: () => void
    cart: CartItem[]
    onUpdateQuantity: (itemId: string, newQuantity: number) => void
    onRemoveItem: (itemId: string) => void
    onCheckout: () => void
}

export function CartPopup({ onClose, cart, onUpdateQuantity, onRemoveItem, onCheckout }: CartPopupProps) {
    const [isCheckingOut, setIsCheckingOut] = useState(false)

    // Calcular el total del carrito
    const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)

    // Estilos inline para garantizar tamaños exactos y estilo macOS
    const popupStyles = {
        width: "500px",
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

    const cartItemStyle = {
        display: "flex",
        alignItems: "center",
        padding: "10px",
        borderBottom: "1px solid #444",
        gap: "15px",
    }

    const imageContainerStyle = {
        width: "60px",
        height: "60px",
        position: "relative" as const,
        overflow: "hidden",
        borderRadius: "4px",
        backgroundColor: "#333",
        flexShrink: 0,
    }

    const itemDetailsStyle = {
        flex: 1,
    }

    const quantityControlsStyle = {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    }

    const buttonStyle = {
        padding: "5px",
        backgroundColor: "#333",
        border: "1px solid #555",
        borderRadius: "4px",
        color: "#f8f8f8",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    }

    const checkoutButtonStyle = {
        width: "100%",
        padding: "12px",
        backgroundColor: "#007aff",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
        fontSize: "14px",
        marginTop: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
    }

    const emptyCartStyle = {
        textAlign: "center" as const,
        padding: "30px 0",
        color: "#999",
    }

    const totalStyle = {
        marginTop: "20px",
        padding: "15px 0",
        borderTop: "1px solid #444",
        display: "flex",
        justifyContent: "space-between",
        fontWeight: "bold" as const,
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
            <ShoppingCart size={14} style={{ marginRight: "6px", display: "inline" }} />
            Carrito de Compras
          </span>
                    <div style={{ width: "36px" }}></div> {/* Espacio para equilibrar el header */}
                </div>

                <div style={contentStyles}>
                    {cart.length === 0 ? (
                        <div style={emptyCartStyle}>
                            <p>Tu carrito está vacío</p>
                            <p style={{ fontSize: "12px", marginTop: "10px" }}>
                                Usa el comando <code>add --carrito --producto=ID</code> para agregar productos
                            </p>
                        </div>
                    ) : (
                        <>
                            {cart.map((item) => (
                                <div key={item.id} style={cartItemStyle}>
                                    <div style={imageContainerStyle}>
                                        {item.imageUrl && (
                                            <img
                                                src={item.imageUrl || "/placeholder.svg"}
                                                alt={item.title}
                                                style={{
                                                    position: "absolute",
                                                    top: "50%",
                                                    left: "50%",
                                                    transform: "translate(-50%, -50%)",
                                                    maxWidth: "100%",
                                                    maxHeight: "100%",
                                                    objectFit: "contain",
                                                }}
                                            />
                                        )}
                                    </div>
                                    <div style={itemDetailsStyle}>
                                        <div style={{ fontWeight: "bold", marginBottom: "5px" }}>{item.title}</div>
                                        <div style={{ fontSize: "12px", color: "#999" }}>
                                            Precio: ${item.price.toFixed(2)} {item.currency}
                                        </div>
                                    </div>
                                    <div style={quantityControlsStyle}>
                                        <button
                                            style={buttonStyle}
                                            onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                            title="Disminuir cantidad"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span style={{ minWidth: "30px", textAlign: "center" }}>{item.quantity}</span>
                                        <button
                                            style={buttonStyle}
                                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                            title="Aumentar cantidad"
                                        >
                                            <Plus size={14} />
                                        </button>
                                        <button
                                            style={{ ...buttonStyle, marginLeft: "10px", color: "#ff5f56" }}
                                            onClick={() => onRemoveItem(item.id)}
                                            title="Eliminar del carrito"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <div style={totalStyle}>
                                <span>Total:</span>
                                <span>
                  ${cartTotal.toFixed(2)} {cart[0]?.currency || "MXN"}
                </span>
                            </div>

                            <button
                                style={checkoutButtonStyle}
                                onClick={() => {
                                    setIsCheckingOut(true)
                                    onCheckout()
                                }}
                                disabled={isCheckingOut}
                            >
                                <CreditCard size={16} />
                                {isCheckingOut ? "Procesando..." : "Proceder al pago"}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </>
    )
}

