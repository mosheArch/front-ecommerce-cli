"use client"

import { useState, useEffect } from "react"
import { User, Package, MapPin, LogOut, Edit, Plus, Trash, Star } from "lucide-react"
import { EditProfilePopup } from "./edit-profile-popup"
import { AddressFormPopup } from "./address-form-popup"

interface CustomerProfilePopupProps {
  onClose: () => void
  onLogout: () => void
  customerAccessToken: string
  initialActiveTab?: string
}

export function CustomerProfilePopup({
                                       onClose,
                                       onLogout,
                                       customerAccessToken,
                                       initialActiveTab = "profile",
                                     }: CustomerProfilePopupProps) {
  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState(initialActiveTab)

  // Estados para los popups de edición
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [editingAddress, setEditingAddress] = useState<any>(null)

  const fetchCustomerInfo = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/shopify/customer/info?token=${customerAccessToken}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al obtener información del cliente")
      }

      if (data.success) {
        setCustomer(data.customer)
      } else {
        setError(data.error || "Error desconocido al obtener información del cliente")
      }
    } catch (error) {
      setError(error.message || "Error al obtener información del cliente")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomerInfo()
  }, [customerAccessToken])

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/shopify/customer/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: customerAccessToken }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al cerrar sesión")
      }

      if (data.success) {
        onLogout()
      } else {
        setError(data.error || "Error desconocido al cerrar sesión")
      }
    } catch (error) {
      setError(error.message || "Error al cerrar sesión")
    }
  }

  const handleEditProfile = () => {
    setShowEditProfile(true)
  }

  const handleAddAddress = () => {
    setShowAddAddress(true)
    setEditingAddress(null)
  }

  const handleEditAddress = (address) => {
    setEditingAddress(address)
    setShowAddAddress(true)
  }

  const handleDeleteAddress = async (addressId) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta dirección?")) {
      return
    }

    try {
      const response = await fetch("/api/shopify/customer/address/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: customerAccessToken,
          addressId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al eliminar dirección")
      }

      if (data.success) {
        // Actualizar la información del cliente
        fetchCustomerInfo()
      } else {
        setError(data.error || "Error desconocido al eliminar dirección")
      }
    } catch (error) {
      setError(error.message || "Error al eliminar dirección")
    }
  }

  const handleSetDefaultAddress = async (addressId) => {
    try {
      const response = await fetch("/api/shopify/customer/address/set-default", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: customerAccessToken,
          addressId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al establecer dirección predeterminada")
      }

      if (data.success) {
        // Actualizar la información del cliente
        fetchCustomerInfo()
      } else {
        setError(data.error || "Error desconocido al establecer dirección predeterminada")
      }
    } catch (error) {
      setError(error.message || "Error al establecer dirección predeterminada")
    }
  }

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

  const tabsContainerStyle = {
    display: "flex",
    borderBottom: "1px solid #444",
    marginBottom: "20px",
  }

  const tabStyle = {
    padding: "10px 15px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  }

  const activeTabStyle = {
    ...tabStyle,
    borderBottom: "2px solid #007aff",
    color: "#007aff",
  }

  const buttonStyle = {
    padding: "8px 15px",
    backgroundColor: "#007aff",
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
  }

  const dangerButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#ff5f56",
  }

  const iconButtonStyle = {
    padding: "5px",
    backgroundColor: "transparent",
    color: "#f8f8f8",
    border: "1px solid #444",
    borderRadius: "4px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }

  const errorStyle = {
    color: "#ff5f56",
    marginBottom: "15px",
    fontSize: "14px",
  }

  const addressCardStyle = {
    marginBottom: "15px",
    padding: "10px",
    border: "1px solid #444",
    borderRadius: "4px",
    position: "relative" as const,
  }

  const addressActionsStyle = {
    display: "flex",
    gap: "8px",
    marginTop: "10px",
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
            <span style={{ color: "#cccccc", fontSize: "13px", fontWeight: "normal" }}>Mi Cuenta</span>
            <div style={{ width: "36px" }}></div> {/* Espacio para equilibrar el header */}
          </div>

          <div style={contentStyles}>
            {loading ? (
                <div style={{ textAlign: "center", padding: "20px" }}>Cargando información...</div>
            ) : error ? (
                <div style={errorStyle}>{error}</div>
            ) : customer ? (
                <>
                  <div style={tabsContainerStyle}>
                    <div
                        style={activeTab === "profile" ? activeTabStyle : tabStyle}
                        onClick={() => setActiveTab("profile")}
                    >
                      <User size={16} />
                      <span>Perfil</span>
                    </div>
                    <div style={activeTab === "orders" ? activeTabStyle : tabStyle} onClick={() => setActiveTab("orders")}>
                      <Package size={16} />
                      <span>Pedidos</span>
                    </div>
                    <div
                        style={activeTab === "addresses" ? activeTabStyle : tabStyle}
                        onClick={() => setActiveTab("addresses")}
                    >
                      <MapPin size={16} />
                      <span>Direcciones</span>
                    </div>
                  </div>

                  {activeTab === "profile" && (
                      <div>
                        <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "15px",
                            }}
                        >
                          <h3 style={{ fontSize: "18px", margin: 0 }}>Información Personal</h3>
                          <button onClick={handleEditProfile} style={{ ...iconButtonStyle }}>
                            <Edit size={16} />
                          </button>
                        </div>
                        <p>
                          <strong>Nombre:</strong> {customer.firstName} {customer.lastName}
                        </p>
                        <p>
                          <strong>Email:</strong> {customer.email}
                        </p>
                        <p>
                          <strong>Teléfono:</strong> {customer.phone || "No especificado"}
                        </p>

                        <button onClick={handleLogout} style={{ ...dangerButtonStyle, marginTop: "20px" }}>
                          <LogOut size={16} />
                          <span>Cerrar Sesión</span>
                        </button>
                      </div>
                  )}

                  {activeTab === "orders" && (
                      <div>
                        <h3 style={{ marginBottom: "15px", fontSize: "18px" }}>Mis Pedidos</h3>
                        {customer.orders.edges.length > 0 ? (
                            <div>
                              {customer.orders.edges.map((edge: any) => {
                                const order = edge.node
                                return (
                                    <div
                                        key={order.id}
                                        style={{
                                          marginBottom: "15px",
                                          padding: "10px",
                                          border: "1px solid #444",
                                          borderRadius: "4px",
                                        }}
                                    >
                                      <p>
                                        <strong>Número de Orden:</strong> #{order.orderNumber}
                                      </p>
                                      <p>
                                        <strong>Fecha:</strong> {new Date(order.processedAt).toLocaleDateString()}
                                      </p>
                                      <p>
                                        <strong>Estado de Pago:</strong> {order.financialStatus}
                                      </p>
                                      <p>
                                        <strong>Estado de Envío:</strong> {order.fulfillmentStatus || "Pendiente"}
                                      </p>
                                      <p>
                                        <strong>Total:</strong> ${order.totalPrice.amount} {order.totalPrice.currencyCode}
                                      </p>
                                    </div>
                                )
                              })}
                            </div>
                        ) : (
                            <p>No tienes pedidos recientes.</p>
                        )}
                      </div>
                  )}

                  {activeTab === "addresses" && (
                      <div>
                        <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "15px",
                            }}
                        >
                          <h3 style={{ fontSize: "18px", margin: 0 }}>Mis Direcciones</h3>
                          <button onClick={handleAddAddress} style={{ ...buttonStyle }}>
                            <Plus size={16} />
                            <span>Agregar Dirección</span>
                          </button>
                        </div>

                        {customer.addresses.edges.length > 0 ? (
                            <div>
                              {customer.addresses.edges.map((edge: any) => {
                                const address = edge.node
                                const isDefault = customer.defaultAddress && customer.defaultAddress.id === address.id
                                return (
                                    <div
                                        key={address.id}
                                        style={{
                                          ...addressCardStyle,
                                          borderColor: isDefault ? "#27c93f" : "#444",
                                        }}
                                    >
                                      {isDefault && (
                                          <div
                                              style={{
                                                color: "#27c93f",
                                                marginBottom: "5px",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "5px",
                                              }}
                                          >
                                            <Star size={14} />
                                            <span>Dirección Predeterminada</span>
                                          </div>
                                      )}
                                      <p>{address.address1}</p>
                                      {address.address2 && <p>{address.address2}</p>}
                                      <p>
                                        {address.city}, {address.province} {address.zip}
                                      </p>
                                      <p>{address.country}</p>
                                      {address.phone && <p>Teléfono: {address.phone}</p>}

                                      <div style={addressActionsStyle}>
                                        <button
                                            onClick={() => handleEditAddress(address)}
                                            style={iconButtonStyle}
                                            title="Editar dirección"
                                        >
                                          <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteAddress(address.id)}
                                            style={{ ...iconButtonStyle, color: "#ff5f56" }}
                                            title="Eliminar dirección"
                                        >
                                          <Trash size={16} />
                                        </button>
                                        {!isDefault && (
                                            <button
                                                onClick={() => handleSetDefaultAddress(address.id)}
                                                style={{ ...iconButtonStyle, color: "#27c93f" }}
                                                title="Establecer como predeterminada"
                                            >
                                              <Star size={16} />
                                            </button>
                                        )}
                                      </div>
                                    </div>
                                )
                              })}
                            </div>
                        ) : (
                            <p>No tienes direcciones guardadas.</p>
                        )}
                      </div>
                  )}
                </>
            ) : (
                <div style={{ textAlign: "center", padding: "20px" }}>No se pudo cargar la información del cliente.</div>
            )}
          </div>
        </div>

        {/* Popup para editar perfil */}
        {showEditProfile && customer && (
            <EditProfilePopup
                onClose={() => setShowEditProfile(false)}
                onProfileUpdated={() => {
                  setShowEditProfile(false)
                  fetchCustomerInfo()
                }}
                customerAccessToken={customerAccessToken}
                initialData={{
                  firstName: customer.firstName,
                  lastName: customer.lastName,
                  email: customer.email,
                  phone: customer.phone || "",
                }}
            />
        )}

        {/* Popup para agregar/editar dirección */}
        {showAddAddress && (
            <AddressFormPopup
                onClose={() => {
                  setShowAddAddress(false)
                  setEditingAddress(null)
                }}
                onAddressSubmitted={() => {
                  setShowAddAddress(false)
                  setEditingAddress(null)
                  fetchCustomerInfo()
                }}
                customerAccessToken={customerAccessToken}
                initialData={editingAddress}
                isEditing={!!editingAddress}
            />
        )}
      </>
  )
}

