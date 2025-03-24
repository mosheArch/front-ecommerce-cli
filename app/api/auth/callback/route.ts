import { NextResponse } from "next/server"

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const accessToken = searchParams.get("access_token")
        const expiresAt = searchParams.get("expires_at")

        if (!accessToken || !expiresAt) {
            return NextResponse.redirect(new URL("/?auth_error=missing_token", request.url))
        }

        // Redirigir a la página principal con los parámetros de autenticación
        return NextResponse.redirect(new URL(`/?access_token=${accessToken}&expires_at=${expiresAt}`, request.url))
    } catch (error) {
        console.error("Error en el callback de autenticación:", error)
        return NextResponse.redirect(new URL("/?auth_error=unexpected", request.url))
    }
}

