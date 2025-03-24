"use client"
import { Package, Calendar, DollarSign, Truck } from "lucide-react"

interface OrderDetailsPopupProps {
    order: any
    onClose: () => void
}

export function OrderDetailsPopup({ order, onClose }: OrderDetailsPopupProps) {
    // Formatear la fecha
    const formattedDate = new Date(order.processedAt).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })

    // Estilos inline para garantizar tamaños exactos y estilo macOS
    const popupStyles = {
        width: "600px",
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

    const orderInfoStyle = {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "15px",
        marginBottom: "20px",
        padding: "15px",
        backgroundColor: "rgba(45, 45, 45, 0.5)",
        borderRadius: "6px",
    }

    const infoItemStyle = {
        display: "flex",
        alignItems: "center",
        gap: "8px",
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

    const lineItemStyle = {
        display: "flex",
        gap: "15px",
        padding: "12px",
        borderBottom: "1px solid #444",
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
            <Package size={14} style={{ marginRight: "6px", display: "inline" }} />
            Orden #{order.orderNumber}
          </span>
                    <div style={{ width: "36px" }}></div> {/* Espacio para equilibrar el header */}
                </div>

                <div style={contentStyles}>
                    <div style={orderInfoStyle}>
                        <div style={infoItemStyle}>
                            <Calendar size={16} />
                            <span>Fecha: {formattedDate}</span>
                        </div>
                        <div style={infoItemStyle}>
                            <DollarSign size={16} />
                            <span>
                Total: ${Number(order.currentTotalPrice.amount).toFixed(2)} {order.currentTotalPrice.currencyCode}
              </span>
                        </div>
                        <div style={infoItemStyle}>
                            <DollarSign size={16} />
                            <span>
                Estado de pago: <span style={statusBadgeStyle(order.financialStatus)}>{order.financialStatus}</span>
              </span>
                        </div>
                        <div style={infoItemStyle}>
                            <Truck size={16} />
                            <span>
                Estado de envío:{" "}
                                <span style={statusBadgeStyle(order.fulfillmentStatus || "UNFULFILLED")}>
                  {order.fulfillmentStatus || "PENDIENTE"}
                </span>
              </span>
                        </div>
                    </div>

                    <h3 style={{ fontSize: "16px", marginBottom: "10px" }}>Productos</h3>
                    <div style={{ backgroundColor: "rgba(45, 45, 45, 0.5)", borderRadius: "6px", marginBottom: "20px" }}>
                        {order.lineItems.edges.map((edge, index) => {
                            const item = edge.node
                            return (
                                <div key={index} style={lineItemStyle}>
                                    <div style={imageContainerStyle}>
                                        {item.variant?.image?.url && (
                                            <img
                                                src={item.variant.image.url || "/placeholder.svg"}
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
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                                            {item.variant?.product?.title || item.title}
                                        </div>
                                        {item.variant?.title !== "Default Title" && (
                                            <div style={{ fontSize: "12px", color: "#aaa", marginBottom: "4px" }}>
                                                Variante: {item.variant.title}
                                            </div>
                                        )}
                                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                                            <span>Cantidad: {item.quantity}</span>
                                            <span>
                        ${Number(item.originalTotalPrice.amount).toFixed(2)} {item.originalTotalPrice.currencyCode}
                      </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </>
    )
}

