"use client"

import type React from "react"

import { useState, useEffect } from "react"

interface TerminalAddressFormProps {
    onClose: () => void
    onSubmit: (address: any) => void
    customerAccessToken: string
    initialData?: {
        id?: string
        address1: string
        address2?: string
        city: string
        province: string
        country: string
        zip: string
        phone?: string
    }
    isEditing?: boolean
}

export function TerminalAddressForm({
                                        onClose,
                                        onSubmit,
                                        customerAccessToken,
                                        initialData,
                                        isEditing = false,
                                    }: TerminalAddressFormProps) {
    const [step, setStep] = useState(0)
    const [address1, setAddress1] = useState(initialData?.address1 || "")
    const [address2, setAddress2] = useState(initialData?.address2 || "")
    const [city, setCity] = useState(initialData?.city || "")
    const [province, setProvince] = useState(initialData?.province || "")
    const [country, setCountry] = useState(initialData?.country || "México")
    const [zip, setZip] = useState(initialData?.zip || "")
    const [phone, setPhone] = useState(initialData?.phone || "+52 ")
    const [currentInput, setCurrentInput] = useState("")
    const [error, setError] = useState("")

    const steps = [
        {
            field: "address1",
            prompt: "Ingresa la dirección (calle y número):",
            setter: setAddress1,
            value: address1,
            required: true,
        },
        {
            field: "address2",
            prompt: "Ingresa información adicional (opcional, presiona Enter para omitir):",
            setter: setAddress2,
            value: address2,
            required: false,
        },
        {
            field: "city",
            prompt: "Ingresa la ciudad:",
            setter: setCity,
            value: city,
            required: true,
        },
        {
            field: "province",
            prompt: "Ingresa el estado/provincia:",
            setter: setProvince,
            value: province,
            required: true,
        },
        {
            field: "country",
            prompt: "Ingresa el país (predeterminado: México):",
            setter: setCountry,
            value: country,
            required: true,
        },
        {
            field: "zip",
            prompt: "Ingresa el código postal:",
            setter: setZip,
            value: zip,
            required: true,
        },
        {
            field: "phone",
            prompt: "Ingresa el teléfono (predeterminado: +52):",
            setter: setPhone,
            value: phone,
            required: false,
        },
    ]

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault()

            const currentStep = steps[step]

            // Si el campo es requerido y está vacío, mostrar error
            if (currentStep.required && !currentInput.trim()) {
                setError(`El campo ${currentStep.field} es requerido.`)
                return
            }

            // Actualizar el valor del campo actual
            if (currentInput.trim() || !currentStep.required) {
                currentStep.setter(currentInput)
            }

            // Avanzar al siguiente paso o finalizar
            if (step < steps.length - 1) {
                setStep(step + 1)
                setCurrentInput(steps[step + 1].value)
                setError("")
            } else {
                // Finalizar el formulario
                const addressData = {
                    address1,
                    address2,
                    city,
                    province,
                    country,
                    zip,
                    phone,
                }

                onSubmit(addressData)
            }
        }
    }

    useEffect(() => {
        // Inicializar el input con el valor del primer paso
        setCurrentInput(steps[0].value)
    }, [])

    return (
        <div className="terminal-form">
            <div className="terminal-form-header">
                <h3>{isEditing ? "Editar Dirección" : "Nueva Dirección"}</h3>
                <p>Presiona ESC en cualquier momento para cancelar</p>
            </div>

            {error && <div className="terminal-form-error">{error}</div>}

            <div className="terminal-form-step">
                <p>{steps[step].prompt}</p>
                <div className="terminal-form-input-line">
                    <span className="terminal-form-prompt">{">"}</span>
                    <input
                        type="text"
                        value={currentInput}
                        onChange={(e) => setCurrentInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        className="terminal-form-input"
                    />
                </div>
            </div>

            <div className="terminal-form-progress">
                <p>
                    Paso {step + 1} de {steps.length}
                </p>
            </div>
        </div>
    )
}

