// Reemplazar la importación de uuid con una función personalizada para generar IDs
// import { v4 as uuidv4 } from 'uuid';

// Función para generar un ID único
function generateUniqueId(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === "x" ? r : (r & 0x3) | 0x8
        return v.toString(16)
    })
}

export interface CartItem {
    id: string
    productId: string
    variantId: string
    title: string
    price: number
    currency: string
    quantity: number
    imageUrl?: string
}

// Función para obtener el carrito del localStorage
export function getCart(): CartItem[] {
    if (typeof window === "undefined") return []

    const cartJson = localStorage.getItem("shopify_cart")
    if (!cartJson) return []

    try {
        return JSON.parse(cartJson)
    } catch (error) {
        console.error("Error parsing cart from localStorage:", error)
        return []
    }
}

// Función para guardar el carrito en localStorage
export function saveCart(cart: CartItem[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem("shopify_cart", JSON.stringify(cart))
}

// Función para agregar un producto al carrito
export function addToCart(product: any, variantId: string, quantity = 1): CartItem[] {
    const cart = getCart()

    // Verificar si el producto ya está en el carrito
    const existingItemIndex = cart.findIndex((item) => item.productId === product.id && item.variantId === variantId)

    if (existingItemIndex >= 0) {
        // Actualizar la cantidad si ya existe
        cart[existingItemIndex].quantity += quantity
    } else {
        // Agregar nuevo item si no existe
        const newItem: CartItem = {
            id: generateUniqueId(), // Usar nuestra función en lugar de uuidv4()
            productId: product.id,
            variantId: variantId,
            title: product.title,
            price: Number.parseFloat(product.price),
            currency: product.currency || "MXN",
            quantity: quantity,
            imageUrl: product.images?.[0]?.url || product.imageUrl,
        }

        cart.push(newItem)
    }

    saveCart(cart)
    return cart
}

// Función para actualizar la cantidad de un producto
export function updateCartItemQuantity(itemId: string, newQuantity: number): CartItem[] {
    const cart = getCart()

    const updatedCart = cart.map((item) => {
        if (item.id === itemId) {
            return { ...item, quantity: newQuantity }
        }
        return item
    })

    saveCart(updatedCart)
    return updatedCart
}

// Función para eliminar un producto del carrito
export function removeFromCart(itemId: string): CartItem[] {
    const cart = getCart()

    const updatedCart = cart.filter((item) => item.id !== itemId)

    saveCart(updatedCart)
    return updatedCart
}

// Función para vaciar el carrito
export function clearCart(): CartItem[] {
    saveCart([])
    return []
}

// Función para calcular el total del carrito
export function getCartTotal(cart: CartItem[]): number {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
}

// Función para obtener el número de items en el carrito
export function getCartItemCount(cart: CartItem[]): number {
    return cart.reduce((count, item) => count + item.quantity, 0)
}

