"use client"

import { useState, useEffect, useRef } from "react"
import Terminal from "@/components/terminal"
import { ProductPopup } from "@/components/product-popup"
import { LoginPopup } from "@/components/login-popup"
import { RegisterPopup } from "@/components/register-popup"
import { RecoverPasswordPopup } from "@/components/recover-password-popup"
import { CustomerProfilePopup } from "@/components/customer-profile-popup"
import { EditProfilePopup } from "@/components/edit-profile-popup"
import { AddressFormPopup } from "@/components/address-form-popup"
import { TerminalAddressForm } from "@/components/terminal-address-form"
import { CartPopup } from "@/components/cart-popup"
import { executeCommand } from "@/lib/command-handler"
import { getProductById } from "@/lib/shopify"
import {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  type CartItem,
} from "@/lib/cart-service"
// Importar los nuevos componentes
import { OrdersPopup } from "@/components/orders-popup"

export default function Home() {
  // Usar un estado para la fecha de inicio de sesión para evitar problemas de hidratación
  const [loginTime, setLoginTime] = useState("")

  // Modificar el tipo de historial para incluir información sobre la autenticación
  const [history, setHistory] = useState<Array<{ text: string; isCommand: boolean; isAuthenticated: boolean }>>([])
  const [wallpaper, setWallpaper] = useState<string | null>(
      "https://cdn.shopify.com/s/files/1/0903/4019/6722/files/wallpaper1.jpg?v=1742721153",
  )
  const [currentCommand, setCurrentCommand] = useState("")
  const [showProductPopup, setShowProductPopup] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [terminalPosition, setTerminalPosition] = useState({ x: 50, y: 50 })
  const terminalRef = useRef<HTMLInputElement>(null)

  // Estados para la autenticación
  const [showLoginPopup, setShowLoginPopup] = useState(false)
  const [showRegisterPopup, setShowRegisterPopup] = useState(false)
  const [showRecoverPopup, setShowRecoverPasswordPopup] = useState(false)
  const [showProfilePopup, setShowProfilePopup] = useState(false)
  const [customerAccessToken, setCustomerAccessToken] = useState<string | null>(null)
  const [tokenExpiresAt, setTokenExpiresAt] = useState<string | null>(null)

  // Estados para los popups independientes
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("profile")

  // Estados para formularios en terminal
  const [showTerminalAddressForm, setShowTerminalAddressForm] = useState(false)
  const [showTerminalEditAddressForm, setShowTerminalEditAddressForm] = useState(false)
  const [showTerminalEditProfileForm, setShowTerminalEditProfileForm] = useState(false)
  const [terminalFormData, setTerminalFormData] = useState<any>(null)

  // Estados para el carrito
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCartPopup, setShowCartPopup] = useState(false)

  // Agregar un nuevo estado para el popup de órdenes
  const [showOrdersPopup, setShowOrdersPopup] = useState(false)

  // Inicializar el historial después del montaje
  useEffect(() => {
    const now = new Date()
    const formattedDate = `${now.toDateString()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`
    setLoginTime(formattedDate)

    setHistory([
      { text: `Last login: ${formattedDate} on ttys000`, isCommand: false, isAuthenticated: false },
      { text: `shop@clicafe ~ % `, isCommand: false, isAuthenticated: false },
      { text: "", isCommand: false, isAuthenticated: false },
      { text: "🛍️ Terminal Coffee v1.0.0", isCommand: false, isAuthenticated: false },
      {
        text: "Conectado a: " + process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
        isCommand: false,
        isAuthenticated: false,
      },
      { text: "Escribe 'help' para ver todos los comandos disponibles", isCommand: false, isAuthenticated: false },
      { text: "", isCommand: false, isAuthenticated: false },
    ])

    // Recuperar el token de acceso del localStorage
    const storedToken = localStorage.getItem("customerAccessToken")
    const storedExpiresAt = localStorage.getItem("tokenExpiresAt")

    if (storedToken && storedExpiresAt) {
      // Verificar si el token ha expirado
      const expiresAt = new Date(storedExpiresAt)
      const now = new Date()

      if (expiresAt > now) {
        setCustomerAccessToken(storedToken)
        setTokenExpiresAt(storedExpiresAt)
        setHistory((prev) => [
          ...prev,
          { text: "Sesión activa detectada.", isCommand: false, isAuthenticated: true },
          { text: "", isCommand: false, isAuthenticated: true },
        ])
      } else {
        // Si el token ha expirado, eliminarlo
        localStorage.removeItem("customerAccessToken")
        localStorage.removeItem("tokenExpiresAt")
      }
    }

    // Cargar el carrito desde localStorage
    setCart(getCart())
  }, [])

  useEffect(() => {
    // Enfocar el terminal al cargar
    if (terminalRef.current) {
      terminalRef.current.focus()
    }
  }, [])

  // En la función handleCommand, modificar cómo se añaden los comandos al historial
  const handleCommand = async (cmd: string) => {
    if (!cmd.trim()) return

    setCurrentCommand("")

    // Añadir el comando al historial con la información de autenticación
    const isAuth = !!customerAccessToken
    setHistory((prev) => [
      ...prev,
      {
        text: `shop@clicafe ~ % ${cmd}`,
        isCommand: true,
        isAuthenticated: isAuth,
      },
    ])

    // Si el comando es clear, limpiamos el historial
    if (cmd.trim().toLowerCase() === "clear") {
      setHistory([
        { text: `Last login: ${loginTime} on ttys000`, isCommand: false, isAuthenticated: isAuth },
        { text: `shop@clicafe ~ % `, isCommand: false, isAuthenticated: isAuth },
        { text: "", isCommand: false, isAuthenticated: isAuth },
        { text: "🛍️ Terminal Coffee v1.0.0", isCommand: false, isAuthenticated: isAuth },
        {
          text: "Conectado a: " + process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
          isCommand: false,
          isAuthenticated: isAuth,
        },
        { text: "Escribe 'help' para ver todos los comandos disponibles", isCommand: false, isAuthenticated: isAuth },
        { text: "", isCommand: false, isAuthenticated: isAuth },
        { text: "", isCommand: false, isAuthenticated: isAuth },
      ])
      return
    }

    // Si el comando es register, mostramos el popup de registro
    if (cmd.trim().toLowerCase() === "register") {
      setShowRegisterPopup(true)
      setHistory((prev) => [
        ...prev,
        { text: "Abriendo formulario de registro...", isCommand: false, isAuthenticated: !!customerAccessToken },
        { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
      ])
      return
    }

    // Procesar el comando y obtener respuesta
    try {
      setIsLoading(true)
      const response = await executeCommand(cmd, customerAccessToken)
      setIsLoading(false)

      // Si la respuesta contiene __CLEAR__, limpiamos el historial
      if (response.includes("__CLEAR__")) {
        setHistory([
          { text: `Last login: ${loginTime} on ttys000`, isCommand: false, isAuthenticated: !!customerAccessToken },
          { text: `shop@clicafe ~ % `, isCommand: false, isAuthenticated: !!customerAccessToken },
          { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
          { text: "🛍️ Terminal Coffee v1.0.0", isCommand: false, isAuthenticated: !!customerAccessToken },
          {
            text: "Conectado a: " + process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
            isCommand: false,
            isAuthenticated: !!customerAccessToken,
          },
          {
            text: "Escribe 'help' para ver todos los comandos disponibles",
            isCommand: false,
            isAuthenticated: !!customerAccessToken,
          },
          { text: "", isCommand: false, isAuthenticated: !!customerAccessToken }, // Línea en blanco adicional
          { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
        ])
        return
      }

      // Si la respuesta contiene __SHOW_PRODUCT__, mostramos el popup
      const productCommand = response.find((line) => line.startsWith("__SHOW_PRODUCT__"))
      if (productCommand) {
        const productId = productCommand.replace("__SHOW_PRODUCT__", "")
        setHistory((prev) => [
          ...prev,
          { text: "Cargando detalles del producto...", isCommand: false, isAuthenticated: !!customerAccessToken },
        ])

        try {
          console.log("Fetching product with ID:", productId)
          const product = await getProductById(productId)

          if (product) {
            setSelectedProduct(product)
            setShowProductPopup(true)
            setHistory((prev) => [
              ...prev,
              {
                text: `Mostrando detalles del producto: ${product.title}`,
                isCommand: false,
                isAuthenticated: !!customerAccessToken,
              },
              { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
              { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
            ])
          } else {
            setHistory((prev) => [
              ...prev,
              {
                text: `Error: No se encontró un producto con ID ${productId}`,
                isCommand: false,
                isAuthenticated: !!customerAccessToken,
              },
              { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
              { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
            ])
          }
        } catch (error) {
          console.error("Error fetching product:", error)
          setHistory((prev) => [
            ...prev,
            {
              text: `Error al obtener el producto: ${error.message}`,
              isCommand: false,
              isAuthenticated: !!customerAccessToken,
            },
            { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
            { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
          ])
        }

        return
      }

      // Si la respuesta contiene __SHOW_CART__, mostramos el popup del carrito
      if (response.includes("__SHOW_CART__")) {
        setShowCartPopup(true)
        setHistory((prev) => [
          ...prev,
          { text: "Mostrando carrito de compras...", isCommand: false, isAuthenticated: !!customerAccessToken },
          { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
        ])
        return
      }

      // Si la respuesta contiene __ADD_TO_CART__, agregamos el producto al carrito
      const addToCartCommand = response.find((line) => line.startsWith("__ADD_TO_CART__"))
      if (addToCartCommand) {
        const parts = addToCartCommand.replace("__ADD_TO_CART__", "").split("__")
        const productId = parts[0]
        const quantity = Number.parseInt(parts[1], 10)

        try {
          const product = await getProductById(productId)

          if (product) {
            // Usar el primer variante disponible o el primero si no hay disponibles
            const variant = product.variants.find((v) => v.availableForSale) || product.variants[0]

            if (!variant) {
              throw new Error("No se encontraron variantes para este producto")
            }

            // Agregar al carrito
            const updatedCart = addToCart(product, variant.id, quantity)
            setCart(updatedCart)

            setHistory((prev) => [
              ...prev,
              {
                text: `Producto "${product.title}" agregado al carrito (cantidad: ${quantity}).`,
                isCommand: false,
                isAuthenticated: !!customerAccessToken,
              },
              { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
            ])
          } else {
            throw new Error(`No se encontró un producto con ID ${productId}`)
          }
        } catch (error) {
          console.error("Error adding to cart:", error)
          setHistory((prev) => [
            ...prev,
            {
              text: `Error al agregar al carrito: ${error.message}`,
              isCommand: false,
              isAuthenticated: !!customerAccessToken,
            },
            { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
          ])
        }
        return
      }

      // Si la respuesta contiene __REMOVE_FROM_CART__, eliminamos el producto del carrito
      const removeFromCartCommand = response.find((line) => line.startsWith("__REMOVE_FROM_CART__"))
      if (removeFromCartCommand) {
        const itemId = removeFromCartCommand.replace("__REMOVE_FROM_CART__", "")

        try {
          // Buscar el item en el carrito
          const item = cart.find((item) => item.id === itemId)

          if (!item) {
            throw new Error(`No se encontró un ítem con ID ${itemId} en el carrito`)
          }

          // Eliminar del carrito
          const updatedCart = removeFromCart(itemId)
          setCart(updatedCart)

          setHistory((prev) => [
            ...prev,
            {
              text: `Producto "${item.title}" eliminado del carrito.`,
              isCommand: false,
              isAuthenticated: !!customerAccessToken,
            },
            { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
          ])
        } catch (error) {
          console.error("Error removing from cart:", error)
          setHistory((prev) => [
            ...prev,
            {
              text: `Error al eliminar del carrito: ${error.message}`,
              isCommand: false,
              isAuthenticated: !!customerAccessToken,
            },
            { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
          ])
        }
        return
      }

      // Si la respuesta contiene __UPDATE_CART_ITEM__, actualizamos la cantidad del producto
      const updateCartItemCommand = response.find((line) => line.startsWith("__UPDATE_CART_ITEM__"))
      if (updateCartItemCommand) {
        const parts = updateCartItemCommand.replace("__UPDATE_CART_ITEM__", "").split("__")
        const itemId = parts[0]
        const quantity = Number.parseInt(parts[1], 10)

        try {
          // Buscar el item en el carrito
          const item = cart.find((item) => item.id === itemId)

          if (!item) {
            throw new Error(`No se encontró un ítem con ID ${itemId} en el carrito`)
          }

          // Actualizar cantidad en el carrito
          const updatedCart = updateCartItemQuantity(itemId, quantity)
          setCart(updatedCart)

          setHistory((prev) => [
            ...prev,
            {
              text: `Cantidad del producto "${item.title}" actualizada a ${quantity}.`,
              isCommand: false,
              isAuthenticated: !!customerAccessToken,
            },
            { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
          ])
        } catch (error) {
          console.error("Error updating cart item:", error)
          setHistory((prev) => [
            ...prev,
            {
              text: `Error al actualizar el carrito: ${error.message}`,
              isCommand: false,
              isAuthenticated: !!customerAccessToken,
            },
            { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
          ])
        }
        return
      }

      // Si la respuesta contiene __CLEAR_CART__, vaciamos el carrito
      if (response.includes("__CLEAR_CART__")) {
        const updatedCart = clearCart()
        setCart(updatedCart)

        setHistory((prev) => [
          ...prev,
          {
            text: "Carrito vaciado correctamente.",
            isCommand: false,
            isAuthenticated: !!customerAccessToken,
          },
          { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
        ])
        return
      }

      // Si la respuesta contiene __CHECKOUT__, procedemos al checkout
      if (response.includes("__CHECKOUT__")) {
        handleCheckout()
        return
      }

      // Si la respuesta contiene __SHOW_LOGIN__, mostramos el popup de login
      if (response.includes("__SHOW_LOGIN__")) {
        setShowLoginPopup(true)
        setHistory((prev) => [
          ...prev,
          { text: "Iniciando sesión...", isCommand: false, isAuthenticated: !!customerAccessToken },
          { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
          { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
        ])
        return
      }

      // Si la respuesta contiene __LOGOUT__, cerramos la sesión
      if (response.includes("__LOGOUT__")) {
        if (customerAccessToken) {
          try {
            const response = await fetch("/api/shopify/customer/logout", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ token: customerAccessToken }),
            })

            const data = await response.json()

            if (data.success) {
              setCustomerAccessToken(null)
              setTokenExpiresAt(null)
              localStorage.removeItem("customerAccessToken")
              localStorage.removeItem("tokenExpiresAt")
              setHistory((prev) => [
                ...prev,
                { text: "Sesión cerrada correctamente.", isCommand: false, isAuthenticated: false },
                { text: "", isCommand: false, isAuthenticated: false },
                { text: "", isCommand: false, isAuthenticated: false },
              ])
            } else {
              setHistory((prev) => [
                ...prev,
                {
                  text: `Error al cerrar sesión: ${data.error}`,
                  isCommand: false,
                  isAuthenticated: !!customerAccessToken,
                },
                { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
              ])
            }
          } catch (error) {
            setHistory((prev) => [
              ...prev,
              {
                text: `Error al cerrar sesión: ${error.message}`,
                isCommand: false,
                isAuthenticated: !!customerAccessToken,
              },
              { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
            ])
          }
        } else {
          setHistory((prev) => [
            ...prev,
            { text: "No has iniciado sesión.", isCommand: false, isAuthenticated: false },
            { text: "", isCommand: false, isAuthenticated: false },
          ])
        }
        return
      }

      // Si la respuesta contiene __SHOW_PROFILE__, mostramos el perfil del usuario
      if (response.includes("__SHOW_PROFILE__")) {
        if (customerAccessToken) {
          setShowProfilePopup(true)
          setActiveTab("profile")
          setHistory((prev) => [
            ...prev,
            { text: "Cargando perfil de usuario...", isCommand: false, isAuthenticated: !!customerAccessToken },
            { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
          ])
        } else {
          setHistory((prev) => [
            ...prev,
            {
              text: "No has iniciado sesión. Usa 'login' para iniciar sesión.",
              isCommand: false,
              isAuthenticated: false,
            },
            { text: "", isCommand: false, isAuthenticated: false },
          ])
        }
        return
      }

      // Si la respuesta contiene __SHOW_PROFILE_ADDRESSES__, mostramos la pestaña de direcciones
      if (response.includes("__SHOW_PROFILE_ADDRESSES__")) {
        if (customerAccessToken) {
          setShowProfilePopup(true)
          setActiveTab("addresses")
          setHistory((prev) => [
            ...prev,
            { text: "Mostrando direcciones guardadas...", isCommand: false, isAuthenticated: !!customerAccessToken },
            { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
          ])
        } else {
          setHistory((prev) => [
            ...prev,
            {
              text: "No has iniciado sesión. Usa 'login' para iniciar sesión.",
              isCommand: false,
              isAuthenticated: false,
            },
            { text: "", isCommand: false, isAuthenticated: false },
          ])
        }
        return
      }

      // Si la respuesta contiene __SHOW_ADD_ADDRESS__, mostramos el formulario de agregar dirección
      if (response.includes("__SHOW_ADD_ADDRESS__")) {
        if (customerAccessToken) {
          setShowAddAddress(true)
          setEditingAddressId(null)
          setHistory((prev) => [
            ...prev,
            {
              text: "Abriendo formulario para agregar dirección...",
              isCommand: false,
              isAuthenticated: !!customerAccessToken,
            },
            { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
          ])
        } else {
          setHistory((prev) => [
            ...prev,
            {
              text: "No has iniciado sesión. Usa 'login' para iniciar sesión.",
              isCommand: false,
              isAuthenticated: false,
            },
            { text: "", isCommand: false, isAuthenticated: false },
          ])
        }
        return
      }

      // Si la respuesta contiene __SHOW_ADD_ADDRESS_TERMINAL__, mostramos el formulario en terminal
      if (response.includes("__SHOW_ADD_ADDRESS_TERMINAL__")) {
        if (customerAccessToken) {
          setShowTerminalAddressForm(true)
          setHistory((prev) => [
            ...prev,
            {
              text: "Ingresa los datos de la nueva dirección:",
              isCommand: false,
              isAuthenticated: !!customerAccessToken,
            },
            { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
          ])
        } else {
          setHistory((prev) => [
            ...prev,
            {
              text: "No has iniciado sesión. Usa 'login' para iniciar sesión.",
              isCommand: false,
              isAuthenticated: false,
            },
            { text: "", isCommand: false, isAuthenticated: false },
          ])
        }
        return
      }

      // Si la respuesta contiene __EDIT_ADDRESS__, mostramos el formulario de editar dirección
      const editAddressCommand = response.find((line) => line.startsWith("__EDIT_ADDRESS__"))
      if (editAddressCommand) {
        if (customerAccessToken) {
          const addressId = editAddressCommand.replace("__EDIT_ADDRESS__", "")

          // Obtener primero la información del cliente para encontrar el ID completo
          try {
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

            // Usar el ID numérico para la edición
            setEditingAddressId(addressId)
            setShowAddAddress(true)
            setHistory((prev) => [
              ...prev,
              {
                text: `Editando dirección con ID: ${addressId}...`,
                isCommand: false,
                isAuthenticated: !!customerAccessToken,
              },
              { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
            ])
          } catch (error) {
            setHistory((prev) => [
              ...prev,
              { text: `Error: ${error.message}`, isCommand: false, isAuthenticated: !!customerAccessToken },
              { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
            ])
          }
        } else {
          setHistory((prev) => [
            ...prev,
            {
              text: "No has iniciado sesión. Usa 'login' para iniciar sesión.",
              isCommand: false,
              isAuthenticated: false,
            },
            { text: "", isCommand: false, isAuthenticated: false },
          ])
        }
        return
      }

      // Si la respuesta contiene __EDIT_ADDRESS_TERMINAL__, mostramos el formulario en terminal
      const editAddressTerminalCommand = response.find((line) => line.startsWith("__EDIT_ADDRESS_TERMINAL__"))
      if (editAddressTerminalCommand) {
        if (customerAccessToken) {
          const addressId = editAddressTerminalCommand.replace("__EDIT_ADDRESS_TERMINAL__", "")
          setEditingAddressId(addressId)
          setShowTerminalEditAddressForm(true)

          // Cargar los datos de la dirección
          try {
            const response = await fetch(`/api/shopify/customer/info?token=${customerAccessToken}`)
            const data = await response.json()

            if (data.success && data.customer) {
              // Buscar la dirección por ID numérico
              const addressEdge = data.customer.addresses.edges.find((edge) => {
                const idParts = edge.node.id.split("/")
                const numericId = idParts[idParts.length - 1].split("?")[0] // Obtener solo el ID numérico sin el token
                return numericId === addressId
              })

              if (addressEdge) {
                setTerminalFormData(addressEdge.node)
                setHistory((prev) => [
                  ...prev,
                  {
                    text: `Editando dirección con ID: ${addressId}...`,
                    isCommand: false,
                    isAuthenticated: !!customerAccessToken,
                  },
                  { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
                ])
              } else {
                setHistory((prev) => [
                  ...prev,
                  {
                    text: `No se encontró una dirección con ID ${addressId}.`,
                    isCommand: false,
                    isAuthenticated: !!customerAccessToken,
                  },
                  { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
                ])
                setShowTerminalEditAddressForm(false)
              }
            }
          } catch (error) {
            setHistory((prev) => [
              ...prev,
              {
                text: `Error al cargar datos de la dirección: ${error.message}`,
                isCommand: false,
                isAuthenticated: !!customerAccessToken,
              },
              { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
            ])
            setShowTerminalEditAddressForm(false)
          }
        } else {
          setHistory((prev) => [
            ...prev,
            {
              text: "No has iniciado sesión. Usa 'login' para iniciar sesión.",
              isCommand: false,
              isAuthenticated: false,
            },
            { text: "", isCommand: false, isAuthenticated: false },
          ])
        }
        return
      }

      // Si la respuesta contiene __REMOVE_ADDRESS__, eliminamos la dirección
      const removeAddressCommand = response.find((line) => line.startsWith("__REMOVE_ADDRESS__"))
      if (removeAddressCommand) {
        if (customerAccessToken) {
          const addressId = removeAddressCommand.replace("__REMOVE_ADDRESS__", "")
          handleDeleteAddress(addressId)
        } else {
          setHistory((prev) => [
            ...prev,
            {
              text: "No has iniciado sesión. Usa 'login' para iniciar sesión.",
              isCommand: false,
              isAuthenticated: false,
            },
            { text: "", isCommand: false, isAuthenticated: false },
          ])
        }
        return
      }

      // Si la respuesta contiene __SET_DEFAULT_ADDRESS__, establecemos la dirección como predeterminada
      const setDefaultAddressCommand = response.find((line) => line.startsWith("__SET_DEFAULT_ADDRESS__"))
      if (setDefaultAddressCommand) {
        if (customerAccessToken) {
          const addressId = setDefaultAddressCommand.replace("__SET_DEFAULT_ADDRESS__", "")
          handleSetDefaultAddress(addressId)
        } else {
          setHistory((prev) => [
            ...prev,
            {
              text: "No has iniciado sesión. Usa 'login' para iniciar sesión.",
              isCommand: false,
              isAuthenticated: false,
            },
            { text: "", isCommand: false, isAuthenticated: false },
          ])
        }
        return
      }

      // Si la respuesta contiene __EDIT_PROFILE__, mostramos el formulario de editar perfil
      if (response.includes("__EDIT_PROFILE__")) {
        if (customerAccessToken) {
          setShowEditProfile(true)
          setHistory((prev) => [
            ...prev,
            {
              text: "Abriendo formulario para editar perfil...",
              isCommand: false,
              isAuthenticated: !!customerAccessToken,
            },
            { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
          ])
        } else {
          setHistory((prev) => [
            ...prev,
            {
              text: "No has iniciado sesión. Usa 'login' para iniciar sesión.",
              isCommand: false,
              isAuthenticated: false,
            },
            { text: "", isCommand: false, isAuthenticated: false },
          ])
        }
        return
      }

      // Si la respuesta contiene __EDIT_PROFILE_TERMINAL__, mostramos el formulario en terminal
      if (response.includes("__EDIT_PROFILE_TERMINAL__")) {
        if (customerAccessToken) {
          setShowTerminalEditProfileForm(true)

          // Cargar los datos del perfil
          try {
            const response = await fetch(`/api/shopify/customer/info?token=${customerAccessToken}`)
            const data = await response.json()

            if (data.success && data.customer) {
              setTerminalFormData(data.customer)
              setHistory((prev) => [
                ...prev,
                { text: "Editando perfil...", isCommand: false, isAuthenticated: !!customerAccessToken },
                { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
              ])
            }
          } catch (error) {
            setHistory((prev) => [
              ...prev,
              {
                text: `Error al cargar datos del perfil: ${error.message}`,
                isCommand: false,
                isAuthenticated: !!customerAccessToken,
              },
              { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
            ])
            setShowTerminalEditProfileForm(false)
          }
        } else {
          setHistory((prev) => [
            ...prev,
            {
              text: "No has iniciado sesión. Usa 'login' para iniciar sesión.",
              isCommand: false,
              isAuthenticated: false,
            },
            { text: "", isCommand: false, isAuthenticated: false },
          ])
        }
        return
      }

      // Si la respuesta contiene __SHOW_REGISTER__, mostramos el popup de registro
      if (response.includes("__SHOW_REGISTER__")) {
        setShowRegisterPopup(true)
        setHistory((prev) => [
          ...prev,
          { text: "Abriendo formulario de registro...", isCommand: false, isAuthenticated: !!customerAccessToken },
          { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
        ])
        return
      }

      // Agregar el siguiente código en la función handleCommand, justo después del bloque que maneja "__SHOW_REGISTER__"
      // Si la respuesta contiene __SHOW_ORDERS_GUI__, mostramos el popup de órdenes
      if (response.includes("__SHOW_ORDERS_GUI__")) {
        if (customerAccessToken) {
          setShowOrdersPopup(true)
          setHistory((prev) => [
            ...prev,
            { text: "Mostrando órdenes...", isCommand: false, isAuthenticated: !!customerAccessToken },
            { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
          ])
        } else {
          setHistory((prev) => [
            ...prev,
            {
              text: "No has iniciado sesión. Usa 'login' para iniciar sesión.",
              isCommand: false,
              isAuthenticated: false,
            },
            { text: "", isCommand: false, isAuthenticated: false },
          ])
        }
        return
      }

      // Añadir respuesta al historial
      setHistory((prev) => [
        ...prev,
        ...response.map((text) => ({ text: text, isCommand: false, isAuthenticated: !!customerAccessToken })),
        { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
      ])
    } catch (error) {
      console.error("Error handling command:", error)
      setIsLoading(false)
      setHistory((prev) => [
        ...prev,
        {
          text: "Error al procesar el comando. Inténtalo de nuevo.",
          isCommand: false,
          isAuthenticated: !!customerAccessToken,
        },
        { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
      ])
    }
  }

  const closeProductPopup = () => {
    setShowProductPopup(false)
    setSelectedProduct(null)

    // Volver a enfocar el terminal
    if (terminalRef.current) {
      terminalRef.current.focus()
    }
  }

  const handleLoginSuccess = (token: string, expiresAt: string) => {
    setCustomerAccessToken(token)
    setTokenExpiresAt(expiresAt)
    setShowLoginPopup(false)
    setShowRegisterPopup(false)
    setShowRecoverPasswordPopup(false)

    // Guardar el token en localStorage
    localStorage.setItem("customerAccessToken", token)
    localStorage.setItem("tokenExpiresAt", expiresAt)

    setHistory((prev) => [
      ...prev,
      { text: "Sesión iniciada correctamente.", isCommand: false, isAuthenticated: true },
      { text: "", isCommand: false, isAuthenticated: true },
    ])

    // Volver a enfocar el terminal
    if (terminalRef.current) {
      terminalRef.current.focus()
    }
  }

  const handleRegisterSuccess = () => {
    setShowRegisterPopup(false)
    setShowLoginPopup(true)
    setHistory((prev) => [
      ...prev,
      {
        text: "✅ Registro exitoso. Ahora puedes iniciar sesión con tus credenciales.",
        isCommand: false,
        isAuthenticated: false,
      },
      {
        text: "Por favor, ingresa tus datos en el formulario de inicio de sesión que se ha abierto.",
        isCommand: false,
        isAuthenticated: false,
      },
      { text: "", isCommand: false, isAuthenticated: false },
      { text: "", isCommand: false, isAuthenticated: false },
    ])
  }

  const handleLogout = () => {
    setCustomerAccessToken(null)
    setTokenExpiresAt(null)
    setShowProfilePopup(false)

    // Eliminar el token del localStorage
    localStorage.removeItem("customerAccessToken")
    localStorage.removeItem("tokenExpiresAt")

    setHistory((prev) => [
      ...prev,
      { text: "Sesión cerrada correctamente.", isCommand: false, isAuthenticated: false },
      { text: "", isCommand: false, isAuthenticated: false },
    ])

    // Volver a enfocar el terminal
    if (terminalRef.current) {
      terminalRef.current.focus()
    }
  }

  const handleDeleteAddress = async (addressId) => {
    try {
      setIsLoading(true)

      // Obtener primero la información del cliente para encontrar el ID completo
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

      // Usar el ID completo para la eliminación
      const fullAddressId = addressEdge.node.id

      const response = await fetch("/api/shopify/customer/address/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: customerAccessToken,
          addressId: fullAddressId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al eliminar dirección")
      }

      if (data.success) {
        setHistory((prev) => [
          ...prev,
          { text: "Dirección eliminada correctamente.", isCommand: false, isAuthenticated: !!customerAccessToken },
          { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
        ])
      } else {
        setHistory((prev) => [
          ...prev,
          {
            text: `Error al eliminar dirección: ${data.error}`,
            isCommand: false,
            isAuthenticated: !!customerAccessToken,
          },
          { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
        ])
      }
    } catch (error) {
      setHistory((prev) => [
        ...prev,
        {
          text: `Error al eliminar dirección: ${error.message}`,
          isCommand: false,
          isAuthenticated: !!customerAccessToken,
        },
        { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetDefaultAddress = async (addressId) => {
    try {
      setIsLoading(true)

      // Obtener primero la información del cliente para encontrar el ID completo
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

      // Usar el ID completo para establecer como predeterminada
      const fullAddressId = addressEdge.node.id

      const response = await fetch("/api/shopify/customer/address/set-default", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: customerAccessToken,
          addressId: fullAddressId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al establecer dirección predeterminada")
      }

      if (data.success) {
        setHistory((prev) => [
          ...prev,
          {
            text: "Dirección establecida como predeterminada correctamente.",
            isCommand: false,
            isAuthenticated: !!customerAccessToken,
          },
          { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
        ])
      } else {
        setHistory((prev) => [
          ...prev,
          {
            text: `Error al establecer dirección predeterminada: ${data.error}`,
            isCommand: false,
            isAuthenticated: !!customerAccessToken,
          },
          { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
        ])
      }
    } catch (error) {
      setHistory((prev) => [
        ...prev,
        {
          text: `Error al establecer dirección predeterminada: ${error.message}`,
          isCommand: false,
          isAuthenticated: !!customerAccessToken,
        },
        { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleTerminalAddressSubmit = async (addressData) => {
    try {
      setIsLoading(true)

      // Si estamos editando, primero necesitamos obtener el ID completo
      let fullAddressId = null

      if (showTerminalEditAddressForm && editingAddressId) {
        const infoResponse = await fetch(`/api/shopify/customer/info?token=${customerAccessToken}`)
        const infoData = await infoResponse.json()

        if (!infoResponse.ok || !infoData.success) {
          throw new Error(infoData.error || "Error al obtener información del cliente")
        }

        // Buscar la dirección por ID numérico
        const addressEdge = infoData.customer.addresses.edges.find((edge) => {
          const idParts = edge.node.id.split("/")
          const numericId = idParts[idParts.length - 1].split("?")[0] // Obtener solo el ID numérico sin el token
          return numericId === editingAddressId
        })

        if (!addressEdge) {
          throw new Error(`No se encontró una dirección con ID ${editingAddressId}`)
        }

        fullAddressId = addressEdge.node.id
      }

      const endpoint = showTerminalEditAddressForm
          ? "/api/shopify/customer/address/update"
          : "/api/shopify/customer/address/create"

      const payload = showTerminalEditAddressForm
          ? {
            token: customerAccessToken,
            addressId: fullAddressId,
            address: addressData,
          }
          : {
            token: customerAccessToken,
            address: addressData,
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
        throw new Error(data.error || `Error al ${showTerminalEditAddressForm ? "actualizar" : "crear"} dirección`)
      }

      if (data.success) {
        setHistory((prev) => [
          ...prev,
          {
            text: `Dirección ${showTerminalEditAddressForm ? "actualizada" : "creada"} correctamente.`,
            isCommand: false,
            isAuthenticated: !!customerAccessToken,
          },
          { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
          { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
        ])
      } else {
        setHistory((prev) => [
          ...prev,
          {
            text: `Error al ${showTerminalEditAddressForm ? "actualizar" : "crear"} dirección: ${data.error}`,
            isCommand: false,
            isAuthenticated: !!customerAccessToken,
          },
          { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
          { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
        ])
      }
    } catch (error) {
      setHistory((prev) => [
        ...prev,
        {
          text: `Error al ${showTerminalEditAddressForm ? "actualizar" : "crear"} dirección: ${error.message}`,
          isCommand: false,
          isAuthenticated: !!customerAccessToken,
        },
        { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
        { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
      ])
    } finally {
      setIsLoading(false)
      setShowTerminalAddressForm(false)
      setShowTerminalEditAddressForm(false)
      setEditingAddressId(null)
      setTerminalFormData(null)
    }
  }

  const handleTerminalProfileSubmit = async (profileData) => {
    try {
      setIsLoading(true)

      const response = await fetch("/api/shopify/customer/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: customerAccessToken,
          ...profileData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar perfil")
      }

      if (data.success) {
        setHistory((prev) => [
          ...prev,
          { text: "Perfil actualizado correctamente.", isCommand: false, isAuthenticated: !!customerAccessToken },
          { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
        ])
      } else {
        setHistory((prev) => [
          ...prev,
          {
            text: `Error al actualizar perfil: ${data.error}`,
            isCommand: false,
            isAuthenticated: !!customerAccessToken,
          },
          { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
        ])
      }
    } catch (error) {
      setHistory((prev) => [
        ...prev,
        {
          text: `Error al actualizar perfil: ${error.message}`,
          isCommand: false,
          isAuthenticated: !!customerAccessToken,
        },
        { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
      ])
    } finally {
      setIsLoading(false)
      setShowTerminalEditProfileForm(false)
      setTerminalFormData(null)
    }
  }

  // Función para manejar el checkout
  const handleCheckout = async () => {
    try {
      setIsLoading(true)

      if (cart.length === 0) {
        setHistory((prev) => [
          ...prev,
          {
            text: "El carrito está vacío. Agrega productos antes de proceder al pago.",
            isCommand: false,
            isAuthenticated: !!customerAccessToken,
          },
          { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
        ])
        return
      }

      // Preparar los items para el checkout
      const items = cart.map((item) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      }))

      const response = await fetch("/api/shopify/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          customerAccessToken,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al crear checkout")
      }

      if (data.success && data.checkout) {
        // Redirigir al usuario a la URL de checkout
        window.open(data.checkout.webUrl, "_blank")

        setHistory((prev) => [
          ...prev,
          {
            text: "Checkout creado correctamente. Abriendo página de pago...",
            isCommand: false,
            isAuthenticated: !!customerAccessToken,
          },
          {
            text: `Total: $${data.checkout.totalPrice.amount} ${data.checkout.totalPrice.currencyCode}`,
            isCommand: false,
            isAuthenticated: !!customerAccessToken,
          },
          { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
        ])

        // Vaciar el carrito después de un checkout exitoso
        clearCart()
        setCart([])
        setShowCartPopup(false)
      } else {
        throw new Error(data.error || "Error desconocido al crear checkout")
      }
    } catch (error) {
      console.error("Error creating checkout:", error)
      setHistory((prev) => [
        ...prev,
        {
          text: `Error al proceder al pago: ${error.message}`,
          isCommand: false,
          isAuthenticated: !!customerAccessToken,
        },
        { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
      <div
          className="desktop-container"
          style={{
            backgroundImage: wallpaper ? `url(${wallpaper})` : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
            width: "100vw",
            height: "100vh",
            overflow: "hidden",
            position: "relative",
          }}
      >
        <Terminal
            history={history.map((item) => item)}
            currentCommand={currentCommand}
            setCurrentCommand={setCurrentCommand}
            handleCommand={handleCommand}
            ref={terminalRef}
            isLoading={isLoading}
            initialPosition={terminalPosition}
            isAuthenticated={!!customerAccessToken} // Pasar true si hay token, false si no
        >
          {showTerminalAddressForm && (
              <TerminalAddressForm
                  onClose={() => {
                    setShowTerminalAddressForm(false)
                    setHistory((prev) => [
                      ...prev,
                      { text: "Operación cancelada.", isCommand: false, isAuthenticated: !!customerAccessToken },
                      { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
                    ])
                  }}
                  onSubmit={handleTerminalAddressSubmit}
                  customerAccessToken={customerAccessToken}
                  isEditing={false}
              />
          )}

          {showTerminalEditAddressForm && terminalFormData && (
              <TerminalAddressForm
                  onClose={() => {
                    setShowTerminalEditAddressForm(false)
                    setEditingAddressId(null)
                    setTerminalFormData(null)
                    setHistory((prev) => [
                      ...prev,
                      { text: "Operación cancelada.", isCommand: false, isAuthenticated: !!customerAccessToken },
                      { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
                    ])
                  }}
                  onSubmit={handleTerminalAddressSubmit}
                  customerAccessToken={customerAccessToken}
                  initialData={terminalFormData}
                  isEditing={true}
              />
          )}
        </Terminal>

        {/* Popups independientes */}
        {showProductPopup && selectedProduct && <ProductPopup product={selectedProduct} onClose={closeProductPopup} />}

        {showLoginPopup && (
            <LoginPopup
                onClose={() => setShowLoginPopup(false)}
                onLoginSuccess={handleLoginSuccess}
                onSwitchToRegister={() => {
                  setShowLoginPopup(false)
                  setShowRegisterPopup(true)
                }}
                onSwitchToRecover={() => {
                  setShowLoginPopup(false)
                  setShowRecoverPopup(true)
                }}
            />
        )}

        {showRegisterPopup && (
            <RegisterPopup
                onClose={() => setShowRegisterPopup(false)}
                onRegisterSuccess={handleRegisterSuccess}
                onSwitchToLogin={() => {
                  setShowRegisterPopup(false)
                  setShowLoginPopup(true)
                }}
            />
        )}

        {showRecoverPopup && (
            <RecoverPasswordPopup
                onClose={() => setShowRecoverPopup(false)}
                onSwitchToLogin={() => {
                  setShowRecoverPopup(false)
                  setShowLoginPopup(true)
                }}
            />
        )}

        {showProfilePopup && customerAccessToken && (
            <CustomerProfilePopup
                onClose={() => setShowProfilePopup(false)}
                onLogout={handleLogout}
                customerAccessToken={customerAccessToken}
                initialActiveTab={activeTab}
            />
        )}

        {showEditProfile && customerAccessToken && (
            <EditProfilePopup
                onClose={() => setShowEditProfile(false)}
                onProfileUpdated={() => {
                  setShowEditProfile(false)
                  setHistory((prev) => [
                    ...prev,
                    { text: "Perfil actualizado correctamente.", isCommand: false, isAuthenticated: !!customerAccessToken },
                    { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
                  ])
                }}
                customerAccessToken={customerAccessToken}
                initialData={{
                  firstName: "",
                  lastName: "",
                  email: "",
                  phone: "",
                }}
            />
        )}

        {showAddAddress && customerAccessToken && (
            <AddressFormPopup
                onClose={() => {
                  setShowAddAddress(false)
                  setEditingAddressId(null)
                }}
                onAddressSubmitted={() => {
                  setShowAddAddress(false)
                  setEditingAddressId(null)
                  setHistory((prev) => [
                    ...prev,
                    {
                      text: editingAddressId ? "Dirección actualizada correctamente." : "Dirección agregada correctamente.",
                      isCommand: false,
                      isAuthenticated: !!customerAccessToken,
                    },
                    { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
                    { text: "", isCommand: false, isAuthenticated: !!customerAccessToken },
                  ])
                }}
                customerAccessToken={customerAccessToken}
                addressId={editingAddressId}
                isEditing={!!editingAddressId}
            />
        )}

        {showCartPopup && (
            <CartPopup
                onClose={() => setShowCartPopup(false)}
                cart={cart}
                onUpdateQuantity={(itemId, newQuantity) => {
                  const updatedCart = updateCartItemQuantity(itemId, newQuantity)
                  setCart(updatedCart)
                }}
                onRemoveItem={(itemId) => {
                  const updatedCart = removeFromCart(itemId)
                  setCart(updatedCart)
                }}
                onCheckout={handleCheckout}
            />
        )}
        {/* Agregar el componente OrdersPopup al final del JSX, justo antes del cierre de la etiqueta div principal */}
        {showOrdersPopup && customerAccessToken && (
            <OrdersPopup onClose={() => setShowOrdersPopup(false)} customerAccessToken={customerAccessToken} />
        )}
      </div>
  )
}

