"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function OrdersPage() {
    const router = useRouter()
    const [isAuthenticated, setIsAuthenticated] = useState(true)

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Mis Pedidos</h1>
                    <button onClick={() => router.push("/")} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded">
                        Volver al inicio
                    </button>
                </div>

                <div className="bg-green-900/50 border border-green-500 text-green-200 p-6 rounded mb-6 text-center">
                    <h2 className="text-2xl font-bold mb-4">¡Autenticación exitosa!</h2>
                    <p className="text-lg">Has iniciado sesión correctamente y has sido redirigido a la página de órdenes.</p>
                </div>

                <div className="bg-gray-800 rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4">Información del Cliente</h2>
                    <p>
                        <strong>Email:</strong> Usuario autenticado
                    </p>

                    <h2 className="text-xl font-semibold mt-6 mb-4">Historial de Pedidos</h2>
                    <div className="bg-gray-700 rounded-lg p-4 text-center">
                        <p>No tienes pedidos recientes.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

