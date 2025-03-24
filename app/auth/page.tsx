"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function AuthPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState("Verificando autenticación...")
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Verificar si hay un token en los parámetros
        const accessToken = searchParams.get("access_token")
        const expiresAt = searchParams.get("expires_at")

        if (accessToken && expiresAt) {
            // Guardar el token en localStorage
            localStorage.setItem("customerAccessToken", accessToken)
            localStorage.setItem("tokenExpiresAt", expiresAt)

            setStatus("Autenticación exitosa. Redirigiendo...")

            // Redirigir a la página principal
            setTimeout(() => {
                router.push("/")
            }, 1500)
        } else {
            // Verificar si hay un código de autorización
            const code = searchParams.get("code")
            const state = searchParams.get("state")
            const error = searchParams.get("error")

            if (error) {
                setError(`Error de autenticación: ${error}`)
                return
            }

            if (code) {
                setStatus("Código de autorización recibido. Obteniendo token...")

                // Intercambiar el código por un token
                fetch(`/api/shopify/customer/token?code=${code}&state=${state || ""}`)
                    .then((response) => response.json())
                    .then((data) => {
                        if (data.success) {
                            // Guardar el token en localStorage
                            localStorage.setItem("customerAccessToken", data.accessToken)
                            localStorage.setItem("tokenExpiresAt", data.expiresAt)

                            setStatus("Autenticación exitosa. Redirigiendo...")

                            // Redirigir a la página principal
                            setTimeout(() => {
                                router.push("/")
                            }, 1500)
                        } else {
                            setError(data.error || "Error desconocido al obtener token")
                        }
                    })
                    .catch((err) => {
                        setError(`Error al obtener token: ${err.message}`)
                    })
            } else {
                setError("No se encontró token ni código de autorización")
            }
        }
    }, [searchParams, router])

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
            <div className="text-center max-w-md p-6 bg-gray-800 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-4">Autenticación de Shopify</h1>

                {error ? (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded mb-4">
                        <p>{error}</p>
                        <button onClick={() => router.push("/")} className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded">
                            Volver al inicio
                        </button>
                    </div>
                ) : (
                    <div>
                        <p className="mb-4">{status}</p>
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    </div>
                )}
            </div>
        </div>
    )
}

