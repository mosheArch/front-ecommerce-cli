"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

export default function AuthCallback() {
    const searchParams = useSearchParams()
    const [status, setStatus] = useState("Procesando...")
    const [error, setError] = useState<string | null>(null)
    const [code, setCode] = useState<string | null>(null)

    useEffect(() => {
        // Obtener los parámetros de la URL
        const codeParam = searchParams.get("code")
        const stateParam = searchParams.get("state")
        const errorParam = searchParams.get("error")

        if (errorParam) {
            setError(`Error de autenticación: ${errorParam}`)
            return
        }

        if (!codeParam) {
            setError("No se recibió código de autorización")
            return
        }

        setCode(codeParam)
        setStatus("Código de autorización recibido")

        // Intentar enviar un mensaje a la ventana principal
        if (window.opener) {
            try {
                window.opener.postMessage(
                    {
                        type: "SHOPIFY_AUTH_CALLBACK",
                        code: codeParam,
                        state: stateParam,
                    },
                    "*",
                ) // Usar "*" para evitar problemas de origen

                setStatus("Mensaje enviado a la ventana principal")
            } catch (err) {
                setError(`Error al enviar mensaje: ${err.message}`)
            }
        } else {
            setStatus("No se encontró ventana principal. Copia el código manualmente:")
        }
    }, [searchParams])

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
            <div className="text-center max-w-md p-6 bg-gray-800 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-4">Autenticación de Shopify</h1>

                {error ? (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded mb-4">
                        <p>{error}</p>
                    </div>
                ) : (
                    <div className="mb-4">
                        <p>{status}</p>
                    </div>
                )}

                {code && (
                    <div className="mt-4">
                        <p className="mb-2 font-bold">Código de autorización:</p>
                        <div className="bg-gray-700 p-3 rounded text-xs overflow-auto max-h-32 text-left">
                            <code>{code}</code>
                        </div>
                        <p className="mt-4 text-sm">
                            Si la ventana no se cierra automáticamente, puedes cerrarla manualmente y continuar en la aplicación
                            principal.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

