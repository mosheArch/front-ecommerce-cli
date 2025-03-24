"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function CallbackPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [status, setStatus] = useState("Procesando autenticación...")
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Verificar si hay un código de autorización en los parámetros
        const code = searchParams.get("code")
        const state = searchParams.get("state")
        const errorParam = searchParams.get("error")
        const source = searchParams.get("source")

        if (errorParam) {
            setError(`Error de autenticación: ${errorParam}`)
            return
        }

        if (!code) {
            setError("No se recibió código de autorización")
            return
        }

        // Si estamos en una ventana emergente, enviar un mensaje a la ventana principal
        if (window.opener) {
            try {
                window.opener.postMessage(
                    {
                        type: "SHOPIFY_AUTH_SUCCESS",
                        code: code,
                        state: state,
                    },
                    window.location.origin,
                )
                setStatus("Autenticación exitosa. Esta ventana se cerrará automáticamente...")

                // Cerrar esta ventana después de un breve retraso
                setTimeout(() => {
                    window.close()
                }, 2000)
            } catch (err) {
                setError(`Error al comunicarse con la ventana principal: ${err.message}`)
            }
        } else {
            // Si no estamos en una ventana emergente, redirigir a la página de órdenes
            setStatus("Autenticación exitosa. Redirigiendo...")

            // Simular un token de acceso
            const mockToken = "mock_token_" + Date.now()
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

            // Guardar el token en localStorage
            localStorage.setItem("customerAccessToken", mockToken)
            localStorage.setItem("tokenExpiresAt", expiresAt)

            // Redirigir a la página de órdenes
            setTimeout(() => {
                router.push("/orders")
            }, 1500)
        }
    }, [searchParams, router])

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
            <div className="text-center max-w-md p-6 bg-gray-800 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-4">Autenticación de Shopify</h1>

                {error ? (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded mb-4">
                        <p>{error}</p>
                        <button onClick={() => window.close()} className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded">
                            Cerrar ventana
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

