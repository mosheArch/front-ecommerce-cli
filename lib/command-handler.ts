import { getProducts } from "./shopify"

// Función para parsear argumentos al estilo Linux
function parseArgs(argsString) {
    const args = {}
    const regex = /--([a-zA-Z0-9_]+)(?:=([^\s]+))?/g
    let match

    while ((match = regex.exec(argsString)) !== null) {
        const key = match[1]
        const value = match[2] !== undefined ? match[2] : true
        args[key] = value
    }

    return args
}

// Lista de comandos disponibles para sugerencias
const availableCommands = [
    "ls --producto",
    "ls --productos",
    "ls --productos --all",
    "cat --producto --id=ID",
    "head --producto",
    "tail --producto",
    "ls --carrito",
    "add --carrito --producto=ID --cantidad=N",
    "remove --carrito --id=ID",
    "update --carrito --id=ID --cantidad=N",
    "clear --carrito",
    "checkout",
    "ls --direccion",
    "ls --direccion --gui",
    "cat --direccion --id=ID",
    "add --direccion",
    "add --direccion --gui",
    "edit --direccion --id=ID",
    "edit --direccion --id=ID --gui",
    "remove --direccion --id=ID",
    "default --direccion --id=ID",
    "ls --orden",
    "ls --ordenes",
    "ls --ordenes --gui",
    "cat --orden --id=ID",
    "edit --perfil",
    "edit --perfil --gui",
    "login",
    "register",
    "logout",
    "whoami",
    "help",
    "clear",
]

// Función para encontrar sugerencias basadas en un comando incorrecto
function getSuggestions(command) {
    const commandParts = command.trim().toLowerCase().split(" ")
    const mainCommand = commandParts[0]

    // Si el comando principal es válido, buscar sugerencias basadas en argumentos
    if (
        [
            "ls",
            "cat",
            "head",
            "tail",
            "add",
            "edit",
            "remove",
            "default",
            "login",
            "register",
            "logout",
            "whoami",
            "update",
            "clear",
            "checkout",
        ].includes(mainCommand)
    ) {
        return availableCommands.filter((cmd) => cmd.startsWith(mainCommand)).slice(0, 3) // Limitar a 3 sugerencias
    }

    // Si el comando principal no es válido, sugerir comandos que podrían ser similares
    return availableCommands
        .filter((cmd) => {
            const cmdParts = cmd.split(" ")
            return cmdParts[0].startsWith(mainCommand.substring(0, 1))
        })
        .slice(0, 3) // Limitar a 3 sugerencias
}

// Almacenamiento global para mapear IDs cortos a IDs completos
const productIdMap = new Map()
let lastProductList = []

// Manejadores específicos para cada tipo de recurso
const handlers = {
    // Manejador para productos (singular)
    producto: {
        ls: async (args) => {
            // Si se especifica --all, usar el límite máximo de Shopify
            if (args.all) {
                const products = await getProducts(250)

                // Guardar la lista de productos para referencia
                lastProductList = products

                // Limpiar y reconstruir el mapa de IDs
                productIdMap.clear()

                if (products.length === 0) return ["No hay productos disponibles."]

                return [
                    `Mostrando todos los productos (${products.length}):`,
                    "ID    | NOMBRE                 | PRECIO      | DISPONIBLE",
                    "------------------------------------------------------",
                    ...products.map((p, index) => {
                        // Extraer el ID numérico del GID de Shopify
                        const numericId = p.id.split("/").pop()

                        // Guardar el mapeo de ID corto a ID completo
                        productIdMap.set(numericId, p.id)

                        return `${numericId} | ${p.title.substring(0, 20).padEnd(22)} | ${Number.parseFloat(p.price).toFixed(2)} ${p.currency} | ${p.available ? "Sí" : "No"}`
                    }),
                    "",
                    "Para ver detalles de un producto: cat --producto --id=ID",
                    "Para ver los primeros N productos: head --producto --limit=N",
                    "Para ver los últimos N productos: tail --producto --limit=N",
                ]
            }

            // Comportamiento normal con límite
            const limit = args.limit ? Number.parseInt(args.limit) : 20

            if (isNaN(limit) || limit <= 0) {
                return [`Error: "${args.limit}" no es un número válido. Usa un número positivo.`]
            }

            if (limit > 250) {
                return [
                    "Error: El límite máximo de productos que puedes obtener es 250.",
                    "Shopify no permite obtener más de 250 productos en una sola consulta.",
                    "Por favor, usa un número entre 1 y 250.",
                ]
            }

            const products = await getProducts(limit)

            // Guardar la lista de productos para referencia
            lastProductList = products

            // Limpiar y reconstruir el mapa de IDs
            productIdMap.clear()

            if (products.length === 0) return ["No hay productos disponibles."]

            return [
                `Mostrando ${products.length} productos:`,
                "ID    | NOMBRE                 | PRECIO      | DISPONIBLE",
                "------------------------------------------------------",
                ...products.map((p, index) => {
                    // Extraer el ID numérico del GID de Shopify
                    const numericId = p.id.split("/").pop()

                    // Guardar el mapeo de ID corto a ID completo
                    productIdMap.set(numericId, p.id)

                    return `${numericId} | ${p.title.substring(0, 20).padEnd(22)} | ${Number.parseFloat(p.price).toFixed(2)} ${p.currency} | ${p.available ? "Sí" : "No"}`
                }),
                "",
                "Para ver detalles de un producto: cat --producto --id=ID",
                "Para ver todos los productos: ls --productos --all",
                "Para ver los primeros N productos: head --producto --limit=N",
                "Para ver los últimos N productos: tail --producto --limit=N",
            ]
        },

        cat: async (args) => {
            if (!args.id) {
                return ["Error: Debes especificar un ID. Ejemplo: cat --producto --id=123456"]
            }

            const numericId = args.id
            let productId

            // Buscar el ID completo en el mapa
            if (productIdMap.has(numericId)) {
                productId = productIdMap.get(numericId)
            } else {
                // Si no está en el mapa, intentar construirlo
                productId = `gid://shopify/Product/${numericId}`
            }

            // Señal especial para indicar que queremos mostrar un popup
            return [`__SHOW_PRODUCT__${productId}`]
        },

        head: async (args) => {
            const limit = args.limit ? Number.parseInt(args.limit) : 5

            if (isNaN(limit) || limit <= 0) {
                return [`Error: "${args.limit}" no es un número válido. Usa un número positivo.`]
            }

            if (limit > 250) {
                return ["Error: El límite máximo es 250. Por favor, usa un número entre 1 y 250."]
            }

            const products = await getProducts(limit)

            // Guardar la lista de productos para referencia
            lastProductList = products

            // Limpiar y reconstruir el mapa de IDs
            productIdMap.clear()

            if (products.length === 0) return ["No hay productos disponibles."]

            return [
                `Mostrando los primeros ${products.length} productos:`,
                "ID    | NOMBRE                 | PRECIO      | DISPONIBLE",
                "------------------------------------------------------",
                ...products.map((p, index) => {
                    // Extraer el ID numérico del GID de Shopify
                    const numericId = p.id.split("/").pop()

                    // Guardar el mapeo de ID corto a ID completo
                    productIdMap.set(numericId, p.id)

                    return `${numericId} | ${p.title.substring(0, 20).padEnd(22)} | ${Number.parseFloat(p.price).toFixed(2)} ${p.currency} | ${p.available ? "Sí" : "No"}`
                }),
                "",
                "Para ver detalles de un producto: cat --producto --id=ID",
                "Para ver todos los productos: ls --productos --all",
                "Para ver más productos: ls --productos --limit=N",
            ]
        },

        tail: async (args) => {
            const limit = args.limit ? Number.parseInt(args.limit) : 5

            if (isNaN(limit) || limit <= 0) {
                return [`Error: "${args.limit}" no es un número válido. Usa un número positivo.`]
            }

            if (limit > 250) {
                return ["Error: El límite máximo es 250. Por favor, usa un número entre 1 y 250."]
            }

            // Para tail, obtenemos más productos y luego tomamos los últimos N
            const allProducts = await getProducts(250)
            const products = allProducts.slice(-limit)

            // Guardar la lista de productos para referencia
            lastProductList = products

            // Limpiar y reconstruir el mapa de IDs
            productIdMap.clear()

            if (products.length === 0) return ["No hay productos disponibles."]

            return [
                `Mostrando los últimos ${products.length} productos:`,
                "ID    | NOMBRE                 | PRECIO      | DISPONIBLE",
                "------------------------------------------------------",
                ...products.map((p, index) => {
                    // Extraer el ID numérico del GID de Shopify
                    const numericId = p.id.split("/").pop()

                    // Guardar el mapeo de ID corto a ID completo
                    productIdMap.set(numericId, p.id)

                    return `${numericId} | ${p.title.substring(0, 20).padEnd(22)} | ${Number.parseFloat(p.price).toFixed(2)} ${p.currency} | ${p.available ? "Sí" : "No"}`
                }),
                "",
                "Para ver detalles de un producto: cat --producto --id=ID",
                "Para ver todos los productos: ls --productos --all",
                "Para ver más productos: ls --productos --limit=N",
            ]
        },
    },

    // Alias para productos (plural)
    productos: {
        ls: async (args) => handlers.producto.ls(args),
        cat: async (args) => handlers.producto.cat(args),
        head: async (args) => handlers.producto.head(args),
        tail: async (args) => handlers.producto.tail(args),
    },

    // Manejador para carrito
    carrito: {
        ls: async (args) => {
            return ["__SHOW_CART__"] // Señal especial para mostrar el carrito
        },

        add: async (args) => {
            if (!args.producto) {
                return ["Error: Debes especificar un ID de producto. Ejemplo: add --carrito --producto=123456 --cantidad=1"]
            }

            const cantidad = args.cantidad ? Number.parseInt(args.cantidad) : 1

            if (isNaN(cantidad) || cantidad <= 0) {
                return [`Error: "${args.cantidad}" no es una cantidad válida. Usa un número positivo.`]
            }

            const numericId = args.producto
            let productId

            // Buscar el ID completo en el mapa
            if (productIdMap.has(numericId)) {
                productId = productIdMap.get(numericId)
            } else {
                // Si no está en el mapa, intentar construirlo
                productId = `gid://shopify/Product/${numericId}`
            }

            // Señal especial para agregar al carrito
            return [`__ADD_TO_CART__${productId}__${cantidad}`]
        },

        remove: async (args) => {
            if (!args.id) {
                return ["Error: Debes especificar un ID de ítem. Ejemplo: remove --carrito --id=123456"]
            }

            // Señal especial para eliminar del carrito
            return [`__REMOVE_FROM_CART__${args.id}`]
        },

        update: async (args) => {
            if (!args.id) {
                return ["Error: Debes especificar un ID de ítem. Ejemplo: update --carrito --id=123456 --cantidad=2"]
            }

            if (!args.cantidad) {
                return ["Error: Debes especificar una cantidad. Ejemplo: update --carrito --id=123456 --cantidad=2"]
            }

            const cantidad = Number.parseInt(args.cantidad)

            if (isNaN(cantidad) || cantidad <= 0) {
                return [`Error: "${args.cantidad}" no es una cantidad válida. Usa un número positivo.`]
            }

            // Señal especial para actualizar cantidad en el carrito
            return [`__UPDATE_CART_ITEM__${args.id}__${cantidad}`]
        },

        clear: async (args) => {
            // Señal especial para vaciar el carrito
            return ["__CLEAR_CART__"]
        },
    },

    // Manejador para direcciones
    direccion: {
        ls: async (args, customerAccessToken) => {
            // Si se especifica --gui, mostrar la pestaña de direcciones en el perfil
            if (args.gui) {
                return ["__SHOW_PROFILE_ADDRESSES__"] // Señal especial para mostrar la pestaña de direcciones en el perfil
            }

            // Si no hay token, no se puede mostrar direcciones
            if (!customerAccessToken) {
                return ["No has iniciado sesión. Usa 'login' para iniciar sesión."]
            }

            try {
                // Obtener las direcciones del cliente
                const response = await fetch(`/api/shopify/customer/info?token=${customerAccessToken}`)
                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.error || "Error al obtener información del cliente")
                }

                if (!data.success || !data.customer) {
                    return ["Error al obtener información del cliente. Inténtalo de nuevo."]
                }

                const customer = data.customer
                const addresses = customer.addresses.edges.map((edge) => edge.node)

                if (addresses.length === 0) {
                    return [
                        "No tienes direcciones guardadas.",
                        "",
                        "Comandos disponibles para direcciones:",
                        "  add --direccion                - Agregar nueva dirección en terminal",
                        "  add --direccion --gui          - Agregar nueva dirección en interfaz gráfica",
                    ]
                }

                // Formatear las direcciones para mostrarlas en la terminal
                const formattedAddresses = [
                    `Mostrando ${addresses.length} direcciones:`,
                    "ID    | DIRECCIÓN                                   | CIUDAD                | PREDETERMINADA",
                    "-----------------------------------------------------------------------------------------",
                ]

                addresses.forEach((address) => {
                    // Extraer solo el ID numérico sin el token
                    // El formato es: 11088600596850?model_name=CustomerAddress&customer_access_token=...
                    // Queremos solo el número antes del signo de interrogación
                    const numericId = address.id.split("?")[0].split("/").pop() || address.id

                    const addressLine = `${address.address1}${address.address2 ? ", " + address.address2 : ""}`
                    const isDefault = customer.defaultAddress && customer.defaultAddress.id === address.id

                    formattedAddresses.push(
                        `${numericId.padEnd(6)} | ${addressLine.substring(0, 40).padEnd(42)} | ${address.city.substring(0, 20).padEnd(22)} | ${isDefault ? "Sí" : "No"}`,
                    )
                })

                formattedAddresses.push("")
                formattedAddresses.push("Comandos disponibles para direcciones:")
                formattedAddresses.push("  cat --direccion --id=ID       - Ver detalles de una dirección")
                formattedAddresses.push("  edit --direccion --id=ID      - Editar una dirección en terminal")
                formattedAddresses.push("  edit --direccion --id=ID --gui - Editar una dirección en interfaz gráfica")
                formattedAddresses.push("  remove --direccion --id=ID    - Eliminar una dirección")
                formattedAddresses.push("  default --direccion --id=ID   - Establecer una dirección como predeterminada")
                formattedAddresses.push("  add --direccion               - Agregar nueva dirección en terminal")
                formattedAddresses.push("  add --direccion --gui         - Agregar nueva dirección en interfaz gráfica")
                formattedAddresses.push("  ls --direccion --gui          - Ver direcciones en interfaz gráfica")

                return formattedAddresses
            } catch (error) {
                console.error("Error al obtener direcciones:", error)
                return ["Error al obtener direcciones: " + error.message]
            }
        },

        cat: async (args, customerAccessToken) => {
            if (!args.id) {
                return ["Error: Debes especificar un ID de dirección. Ejemplo: cat --direccion --id=123456"]
            }

            if (!customerAccessToken) {
                return ["No has iniciado sesión. Usa 'login' para iniciar sesión."]
            }

            try {
                // Obtener las direcciones del cliente
                const response = await fetch(`/api/shopify/customer/info?token=${customerAccessToken}`)
                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.error || "Error al obtener información del cliente")
                }

                if (!data.success || !data.customer) {
                    return ["Error al obtener información del cliente. Inténtalo de nuevo."]
                }

                const customer = data.customer

                // Buscar la dirección por su ID numérico
                const addressEdge = customer.addresses.edges.find((edge) => {
                    // Extraer el ID numérico de la dirección
                    const idParts = edge.node.id.split("?")[0].split("/")
                    const numericId = idParts[idParts.length - 1]
                    return numericId === args.id
                })

                if (!addressEdge) {
                    return [`No se encontró una dirección con ID ${args.id}.`]
                }

                const address = addressEdge.node
                const isDefault = customer.defaultAddress && customer.defaultAddress.id === address.id

                return [
                    `Detalles de la dirección (ID: ${args.id}):`,
                    "======================================================",
                    `Dirección: ${address.address1}`,
                    address.address2 ? `          ${address.address2}` : null,
                    `Ciudad: ${address.city}`,
                    `Estado/Provincia: ${address.province}`,
                    `País: ${address.country}`,
                    `Código Postal: ${address.zip}`,
                    address.phone ? `Teléfono: ${address.phone}` : null,
                    `Predeterminada: ${isDefault ? "Sí" : "No"}`,
                    "======================================================",
                    "",
                    "Comandos disponibles para esta dirección:",
                    "------------------------------------------------------",
                    `  edit --direccion --id=${args.id}       - Editar esta dirección en terminal`,
                    `  edit --direccion --id=${args.id} --gui - Editar esta dirección en interfaz gráfica`,
                    `  remove --direccion --id=${args.id}     - Eliminar esta dirección`,
                    isDefault ? null : `  default --direccion --id=${args.id}    - Establecer como predeterminada`,
                    "------------------------------------------------------",
                    "",
                    "Para volver a la lista de direcciones: ls --direccion",
                ].filter((line) => line !== null)
            } catch (error) {
                console.error("Error al obtener detalles de la dirección:", error)
                return ["Error al obtener detalles de la dirección: " + error.message]
            }
        },

        add: async (args) => {
            // Si se especifica --gui, mostrar el formulario de agregar dirección
            if (args.gui) {
                return ["__SHOW_ADD_ADDRESS__"] // Señal especial para mostrar el formulario de agregar dirección
            }

            // De lo contrario, mostrar un formulario interactivo en la terminal
            return ["__SHOW_ADD_ADDRESS_TERMINAL__"] // Señal especial para mostrar el formulario interactivo en la terminal
        },

        edit: async (args) => {
            if (!args.id) {
                return ["Error: Debes especificar un ID de dirección. Ejemplo: edit --direccion --id=123456"]
            }

            // Si se especifica --gui, mostrar el formulario de editar dirección
            if (args.gui) {
                return [`__EDIT_ADDRESS__${args.id}`] // Señal especial para editar una dirección específica en GUI
            }

            // De lo contrario, mostrar un formulario interactivo en la terminal
            return [`__EDIT_ADDRESS_TERMINAL__${args.id}`] // Señal especial para editar una dirección específica en terminal
        },

        remove: async (args) => {
            if (!args.id) {
                return ["Error: Debes especificar un ID de dirección. Ejemplo: remove --direccion --id=123456"]
            }
            return [`__REMOVE_ADDRESS__${args.id}`] // Señal especial para eliminar una dirección
        },

        default: async (args) => {
            if (!args.id) {
                return ["Error: Debes especificar un ID de dirección. Ejemplo: default --direccion --id=123456"]
            }
            return [`__SET_DEFAULT_ADDRESS__${args.id}`] // Señal especial para establecer una dirección como predeterminada
        },
    },

    // Alias para direcciones (plural)
    direcciones: {
        ls: async (args, customerAccessToken) => handlers.direccion.ls(args, customerAccessToken),
        cat: async (args, customerAccessToken) => handlers.direccion.cat(args, customerAccessToken),
        add: async (args) => handlers.direccion.add(args),
        edit: async (args) => handlers.direccion.edit(args),
        remove: async (args) => handlers.direccion.remove(args),
        default: async (args) => handlers.direccion.default(args),
    },

    // Manejador para órdenes
    orden: {
        ls: async (args, customerAccessToken) => {
            // Si se especifica --gui, mostrar la interfaz gráfica de órdenes
            if (args.gui) {
                return ["__SHOW_ORDERS_GUI__"] // Señal especial para mostrar la interfaz gráfica de órdenes
            }

            // Si no hay token, no se puede mostrar órdenes
            if (!customerAccessToken) {
                return ["No has iniciado sesión. Usa 'login' para iniciar sesión."]
            }

            try {
                // Obtener las órdenes del cliente
                const response = await fetch(`/api/shopify/customer/orders?token=${customerAccessToken}`)
                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.error || "Error al obtener órdenes del cliente")
                }

                if (!data.success) {
                    return ["Error al obtener órdenes. Inténtalo de nuevo."]
                }

                const orders = data.orders

                if (orders.length === 0) {
                    return [
                        "No tienes órdenes recientes.",
                        "",
                        "Comandos disponibles para órdenes:",
                        "  ls --orden --gui             - Ver órdenes en interfaz gráfica",
                    ]
                }

                // Formatear las órdenes para mostrarlas en la terminal
                const formattedOrders = [
                    `Mostrando ${orders.length} órdenes:`,
                    "ORDEN # | FECHA                  | TOTAL        | ESTADO PAGO   | ESTADO ENVÍO",
                    "---------------------------------------------------------------------------------",
                ]

                orders.forEach((order) => {
                    const orderNumber = order.orderNumber
                    const date = new Date(order.processedAt).toLocaleDateString("es-MX")
                    const total = `${Number(order.currentTotalPrice.amount).toFixed(2)} ${order.currentTotalPrice.currencyCode}`
                    const paymentStatus = order.financialStatus || "PENDIENTE"
                    const fulfillmentStatus = order.fulfillmentStatus || "PENDIENTE"

                    formattedOrders.push(
                        `${orderNumber.toString().padEnd(7)} | ${date.padEnd(22)} | ${total.padEnd(12)} | ${paymentStatus.padEnd(13)} | ${fulfillmentStatus}`,
                    )
                })

                formattedOrders.push("")
                formattedOrders.push("Comandos disponibles para órdenes:")
                formattedOrders.push("  cat --orden --id=NUMERO      - Ver detalles de una orden")
                formattedOrders.push("  ls --orden --gui             - Ver órdenes en interfaz gráfica")

                return formattedOrders
            } catch (error) {
                console.error("Error al obtener órdenes:", error)
                return ["Error al obtener órdenes: " + error.message]
            }
        },

        cat: async (args, customerAccessToken) => {
            if (!args.id) {
                return ["Error: Debes especificar un número de orden. Ejemplo: cat --orden --id=1001"]
            }

            if (!customerAccessToken) {
                return ["No has iniciado sesión. Usa 'login' para iniciar sesión."]
            }

            try {
                // Obtener las órdenes del cliente
                const response = await fetch(`/api/shopify/customer/orders?token=${customerAccessToken}`)
                const data = await response.json()

                if (!response.ok) {
                    throw new Error(data.error || "Error al obtener órdenes del cliente")
                }

                if (!data.success) {
                    return ["Error al obtener órdenes. Inténtalo de nuevo."]
                }

                const orders = data.orders

                // Buscar la orden por su número
                const order = orders.find((o) => o.orderNumber.toString() === args.id.toString())

                if (!order) {
                    return [`No se encontró una orden con número ${args.id}.`]
                }

                // Formatear la fecha
                const date = new Date(order.processedAt).toLocaleDateString("es-MX", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                })

                // Formatear los detalles de la orden
                const orderDetails = [
                    `Detalles de la Orden #${order.orderNumber}:`,
                    "======================================================",
                    `Fecha: ${date}`,
                    `Total: ${Number(order.currentTotalPrice.amount).toFixed(2)} ${order.currentTotalPrice.currencyCode}`,
                    `Estado de Pago: ${order.financialStatus || "PENDIENTE"}`,
                    `Estado de Envío: ${order.fulfillmentStatus || "PENDIENTE"}`,
                    "",
                    "Productos:",
                    "------------------------------------------------------",
                ]

                // Agregar los productos de la orden
                order.lineItems.edges.forEach((edge, index) => {
                    const item = edge.node
                    const variant = item.variant?.title !== "Default Title" ? ` - ${item.variant.title}` : ""
                    const price = `${Number(item.originalTotalPrice.amount).toFixed(2)} ${item.originalTotalPrice.currencyCode}`

                    orderDetails.push(`${index + 1}. ${item.title}${variant}`)
                    orderDetails.push(`   Cantidad: ${item.quantity} - Precio: ${price}`)
                })

                orderDetails.push("")
                orderDetails.push("Para volver a la lista de órdenes: ls --orden")

                return orderDetails
            } catch (error) {
                console.error("Error al obtener detalles de la orden:", error)
                return ["Error al obtener detalles de la orden: " + error.message]
            }
        },
    },

    // Alias para órdenes (plural)
    ordenes: {
        ls: async (args, customerAccessToken) => handlers.orden.ls(args, customerAccessToken),
        cat: async (args, customerAccessToken) => handlers.orden.cat(args, customerAccessToken),
    },

    // Manejador para perfil
    perfil: {
        edit: async (args) => {
            // Si se especifica --gui, mostrar el formulario de editar perfil
            if (args.gui) {
                return ["__EDIT_PROFILE__"] // Señal especial para mostrar el formulario de editar perfil
            }

            // De lo contrario, mostrar un formulario interactivo en la terminal
            return ["__EDIT_PROFILE_TERMINAL__"] // Señal especial para mostrar el formulario interactivo en la terminal
        },
    },
}

export async function executeCommand(command: string, customerAccessToken?: string): Promise<string[]> {
    const fullCommand = command.trim()
    const parts = fullCommand.split(" ")
    const mainCommand = parts[0].toLowerCase()
    const restOfCommand = parts.slice(1).join(" ")

    // Extraer argumentos al estilo Linux
    const args = parseArgs(restOfCommand)

    // Comandos especiales que no siguen la estructura estándar
    if (mainCommand === "clear") {
        return ["__CLEAR__"] // Señal especial para limpiar la terminal
    }

    if (mainCommand === "login") {
        return ["__SHOW_LOGIN__"] // Señal especial para mostrar el popup de login
    }

    if (mainCommand === "register") {
        return ["__SHOW_REGISTER__"] // Señal especial para mostrar el popup de registro
    }

    if (mainCommand === "logout") {
        return ["__LOGOUT__"] // Señal especial para cerrar sesión
    }

    if (mainCommand === "whoami") {
        return ["__SHOW_PROFILE__"] // Señal especial para mostrar el perfil del usuario
    }

    if (mainCommand === "checkout") {
        return ["__CHECKOUT__"] // Señal especial para proceder al checkout
    }

    // Comandos para editar perfil
    if (mainCommand === "edit" && args.perfil) {
        return handlers.perfil.edit(args)
    }

    // En la sección de ayuda, actualizar la descripción de login
    if (mainCommand === "help") {
        return [
            "Comandos disponibles:",
            "======================================================",
            "",
            "PRODUCTOS:",
            "------------------------------------------------------",
            "  ls --producto [--limit=N]     - Listar productos (por defecto 20)",
            "  ls --productos --all          - Listar todos los productos disponibles",
            "  cat --producto --id=ID        - Ver detalles de un producto",
            "  head --producto [--limit=N]   - Mostrar primeros N productos",
            "  tail --producto [--limit=N]   - Mostrar últimos N productos",
            "",
            "CARRITO:",
            "------------------------------------------------------",
            "  ls --carrito                  - Ver carrito de compras",
            "  add --carrito --producto=ID [--cantidad=N] - Agregar producto al carrito",
            "  update --carrito --id=ID --cantidad=N - Actualizar cantidad de un producto",
            "  remove --carrito --id=ID      - Eliminar ítem del carrito",
            "  clear --carrito               - Vaciar el carrito",
            "  checkout                      - Proceder al pago",
            "",
            "DIRECCIONES:",
            "------------------------------------------------------",
            "  ls --direccion                - Listar direcciones guardadas en terminal",
            "  ls --direccion --gui          - Listar direcciones en interfaz gráfica",
            "  cat --direccion --id=ID       - Ver detalles de una dirección",
            "  add --direccion               - Agregar nueva dirección en terminal",
            "  add --direccion --gui         - Agregar nueva dirección en interfaz gráfica",
            "  edit --direccion --id=ID      - Editar dirección existente en terminal",
            "  edit --direccion --id=ID --gui - Editar dirección en interfaz gráfica",
            "  remove --direccion --id=ID    - Eliminar dirección",
            "  default --direccion --id=ID   - Establecer dirección predeterminada",
            "",
            "ÓRDENES:",
            "------------------------------------------------------",
            "  ls --orden                    - Listar órdenes en terminal",
            "  ls --orden --gui              - Listar órdenes en interfaz gráfica",
            "  cat --orden --id=NUMERO       - Ver detalles de una orden",
            "",
            "CUENTA DE USUARIO:",
            "------------------------------------------------------",
            "  edit --perfil                 - Editar información de perfil en terminal",
            "  edit --perfil --gui           - Editar perfil en interfaz gráfica",
            "  login                         - Iniciar sesión con tu cuenta de Clicafe",
            "  register                      - Registrar una nueva cuenta",
            "  logout                        - Cerrar sesión",
            "  whoami                        - Ver información de tu cuenta",
            "",
            "SISTEMA:",
            "------------------------------------------------------",
            "  clear                         - Limpiar la terminal",
            "  help                          - Mostrar esta ayuda",
            "",
            "======================================================",
            "NOTA: También puedes acceder directamente a tu cuenta en https://clicafe.com/account",
        ]
    }

    // Determinar el tipo de recurso (producto, carrito, direccion, etc.)
    let resourceType = null
    for (const key in args) {
        if (handlers[key]) {
            resourceType = key
            break
        }
    }

    // Si no se especificó un tipo de recurso, mostrar error con sugerencias
    if (!resourceType) {
        const suggestions = getSuggestions(fullCommand)
        return [
            `Error: Comando no reconocido o falta especificar un tipo de recurso.`,
            "¿Quizás quisiste decir?:",
            ...suggestions.map((s) => `  ${s}`),
            "",
            "Escribe 'help' para ver todos los comandos disponibles.",
        ]
    }

    // Verificar si el manejador para este tipo de recurso existe
    if (!handlers[resourceType]) {
        const suggestions = getSuggestions(fullCommand)
        return [
            `Error: Tipo de recurso '${resourceType}' no reconocido.`,
            "¿Quizás quisiste decir?:",
            ...suggestions.map((s) => `  ${s}`),
            "",
            "Escribe 'help' para ver todos los comandos disponibles.",
        ]
    }

    // Verificar si el comando existe para este tipo de recurso
    if (!handlers[resourceType][mainCommand]) {
        const suggestions = getSuggestions(fullCommand)
        return [
            `Error: El comando '${mainCommand}' no está disponible para '${resourceType}'.`,
            "¿Quizás quisiste decir?:",
            ...suggestions.map((s) => `  ${s}`),
            "",
            "Escribe 'help' para ver todos los comandos disponibles.",
        ]
    }

    // Ejecutar el comando
    try {
        // Pasar el token de acceso a los manejadores que lo necesitan
        if (
            (mainCommand === "ls" || mainCommand === "cat") &&
            (resourceType === "direccion" ||
                resourceType === "direcciones" ||
                resourceType === "orden" ||
                resourceType === "ordenes")
        ) {
            const result = await handlers[resourceType][mainCommand](args, customerAccessToken)
            // Añadir líneas en blanco adicionales al final
            return [...result, "", ""]
        }

        const result = await handlers[resourceType][mainCommand](args)
        // Añadir líneas en blanco adicionales al final
        return [...result, "", ""]
    } catch (error) {
        console.error(`Error executing ${mainCommand} for ${resourceType}:`, error)
        return [`Error al ejecutar ${mainCommand} para ${resourceType}:`, error.toString(), "", ""]
    }
}

