"use client"

import { useState, useEffect } from "react"
import { Calendar, DollarSign, Truck, ShoppingBag, Eye } from "lucide-react"
import { OrderDetailsPopup } from "./order-details-popup"

interface OrdersPopupProps {
    onClose: () => void
    customerAccessToken: string
}

export function OrdersPopup({ onClose, customerAccessToken }: OrdersPopupProps) {
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null)

    useEffect(() => {
        fetchOrders()
    }, [customerAccessToken])

    const fetchOrders = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/shopify/customer/orders?token=${customerAccessToken}`)
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Error al obtener órdenes")
            }

            if (data.success) {
                setOrders(data.orders)
            } else {
                setError(data.error || "Error desconocido al obtener órdenes")
            }
        } catch (error) {
            setError(error.message || "Error al obtener órdenes")
        } finally {
            setLoading(false)
        }
    }

    // Estilos inline para garantizar tamaños exactos y estilo macOS
    const popupStyles = {
        width: "700px",
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

    const orderCardStyle = {
        backgroundColor: "rgba(45, 45, 45, 0.5)",
        borderRadius: "6px",
        padding: "15px",
        marginBottom: "15px",
    }

    const orderHeaderStyle = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "10px",
    }

    const orderInfoStyle = {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "10px",
    }

    const infoItemStyle = {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "13px",
    }

    const statusBadgeStyle = (status) => {
        let bgColor = "#555"

        if (status === "PAID") bgColor = "#27c93f"
        else if (status === "PENDING") bgColor = "#ffbd2e"
        else if (status === "REFUNDED") bgColor = "#ff5f56"

        return {
            display: "inline-block",
            padding: "3px 8px",
            backgroundColor: bgColor,
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: "bold" as const,
        }
    }

    const buttonStyle = {
        display: "flex",
        alignItems: "center",
        gap: "5px",
        padding: "5px 10px",
        backgroundColor: "#333",
        border: "1px solid #555",
        borderRadius: "4px",
        color: "#f8f8f8",
        cursor: "pointer",
        fontSize: "12px",
    }

    const emptyStateStyle = {
        textAlign: "center" as const,
        padding: "40px 0",
        color: "#999",
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
            <ShoppingBag size={14} style={{ marginRight: "6px", display: "inline" }} />
            Mis Órdenes
          </span>
                    <div style={{ width: "36px" }}></div> {/* Espacio para equilibrar el header */}
                </div>

                <div style={contentStyles}>
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "20px" }}>Cargando órdenes...</div>
                    ) : error ? (
                        <div style={{ color: "#ff5f56", padding: "20px" }}>{error}</div>
                    ) : orders.length === 0 ? (
                        <div style={emptyStateStyle}>
                            <p>No tienes órdenes recientes.</p>
                            <p style={{ fontSize: "12px", marginTop: "10px" }}>
                                Cuando realices una compra, tus órdenes aparecerán aquí.
                            </p>
                        </div>
                    ) : (
                        <>
                            <h2 style={{ marginBottom: "15px", fontSize: "18px" }}>Historial de Órdenes</h2>
                            {orders.map((order) => {
                                const formattedDate = new Date(order.processedAt).toLocaleDateString("es-MX", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                })

                                return (
                                    <div key={order.id} style={orderCardStyle}>
                                        <div style={orderHeaderStyle}>
                                            <h3 style={{ fontSize: "16px", margin: 0 }}>Orden #{order.orderNumber}</h3>
                                            <button style={buttonStyle} onClick={() => setSelectedOrder(order)}>
                                                <Eye size={14} />
                                                Ver detalles
                                            </button>
                                        </div>
                                        <div style={orderInfoStyle}>
                                            <div style={infoItemStyle}>
                                                <Calendar size={14} />
                                                <span>{formattedDate}</span>
                                            </div>
                                            <div style={infoItemStyle}>
                                                <DollarSign size={14} />
                                                <span>
                          ${Number(order.currentTotalPrice.amount).toFixed(2)} {order.currentTotalPrice.currencyCode}
                        </span>
                                            </div>
                                            <div style={infoItemStyle}>
                                                <DollarSign size={14} />
                                                <span>
                          Estado de pago:{" "}
                                                    <span style={statusBadgeStyle(order.financialStatus)}>{order.financialStatus}</span>
                        </span>
                                            </div>
                                            <div style={infoItemStyle}>
                                                <Truck size={14} />
                                                <span>
                          Estado de envío:{" "}
                                                    <span style={statusBadgeStyle(order.fulfillmentStatus || "UNFULFILLED")}>
                            {order.fulfillmentStatus || "PENDIENTE"}
                          </span>
                        </span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </>
                    )}
                </div>
            </div>

            {selectedOrder && <OrderDetailsPopup order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
        </>
    )
}

