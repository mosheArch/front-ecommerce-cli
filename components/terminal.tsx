"use client"

import type React from "react"

import { forwardRef, type KeyboardEvent, type ChangeEvent, useEffect, useRef, type ReactNode, useState } from "react"
import { Folder } from 'lucide-react'

// Actualizar la interfaz TerminalProps para incluir la prop isAuthenticated y el nuevo tipo de historial
interface TerminalProps {
    history: Array<{text: string; isCommand: boolean; isAuthenticated: boolean}>
    currentCommand: string
    setCurrentCommand: (cmd: string) => void
    handleCommand: (cmd: string) => void
    isLoading?: boolean
    children?: ReactNode
    initialPosition?: { x: number; y: number }
    isAuthenticated?: boolean
}

// Añadir isAuthenticated a los parámetros del componente
const Terminal = forwardRef<HTMLInputElement, TerminalProps>(
    (
        {
            history,
            currentCommand,
            setCurrentCommand,
            handleCommand,
            isLoading = false,
            children,
            initialPosition = { x: 50, y: 50 },
            isAuthenticated = false,
        },
        ref,
    ) => {
        const terminalRef = useRef<HTMLDivElement>(null)
        const containerRef = useRef<HTMLDivElement>(null)

        // Estados para el redimensionamiento
        const [size, setSize] = useState({ width: 800, height: 500 })
        const [isResizing, setIsResizing] = useState(false)
        const [resizeStartPosition, setResizeStartPosition] = useState({ x: 0, y: 0 })
        const [resizeStartSize, setResizeStartSize] = useState({ width: 800, height: 500 })
        const [resizeDirection, setResizeDirection] = useState({ x: 0, y: 0 })

        // Estados para el movimiento
        const [position, setPosition] = useState(initialPosition)
        const [isDragging, setIsDragging] = useState(false)
        const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

        const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                handleCommand(currentCommand)
            }
        }

        const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
            setCurrentCommand(e.target.value)
        }

        // Auto-scroll to bottom when history changes
        useEffect(() => {
            if (terminalRef.current) {
                terminalRef.current.scrollTop = terminalRef.current.scrollHeight
            }
        }, [history])

        // Iniciar el arrastre de la ventana
        const startDrag = (e: React.MouseEvent) => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect()
                setDragOffset({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                })
                setIsDragging(true)
            }
        }

        // Manejar el movimiento durante el arrastre
        useEffect(() => {
            const handleMouseMove = (e: MouseEvent) => {
                if (isDragging) {
                    setPosition({
                        x: e.clientX - dragOffset.x,
                        y: e.clientY - dragOffset.y,
                    })
                }
            }

            const handleMouseUp = () => {
                setIsDragging(false)
            }

            if (isDragging) {
                document.addEventListener("mousemove", handleMouseMove)
                document.addEventListener("mouseup", handleMouseUp)
            }

            return () => {
                document.removeEventListener("mousemove", handleMouseMove)
                document.removeEventListener("mouseup", handleMouseUp)
            }
        }, [isDragging, dragOffset])

        // Iniciar el redimensionamiento
        const startResize = (e: React.MouseEvent, directionX: number, directionY: number) => {
            e.preventDefault()
            e.stopPropagation() // Evitar que se inicie el arrastre
            setIsResizing(true)
            setResizeStartPosition({ x: e.clientX, y: e.clientY })
            setResizeStartSize({ width: size.width, height: size.height })
            setResizeDirection({ x: directionX, y: directionY })

            // Cambiar el cursor durante el redimensionamiento
            document.body.style.cursor =
                directionX === 1 && directionY === 1
                    ? "nwse-resize"
                    : directionX === -1 && directionY === 1
                        ? "nesw-resize"
                        : directionX === 1 && directionY === -1
                            ? "nesw-resize"
                            : directionX === -1 && directionY === -1
                                ? "nwse-resize"
                                : directionX !== 0
                                    ? "ew-resize"
                                    : "ns-resize"
        }

        // Manejar el movimiento durante el redimensionamiento
        useEffect(() => {
            const handleMouseMove = (e: MouseEvent) => {
                if (!isResizing) return

                const deltaX = (e.clientX - resizeStartPosition.x) * resizeDirection.x
                const deltaY = (e.clientY - resizeStartPosition.y) * resizeDirection.y

                // Calcular el nuevo tamaño con límites mínimos
                const newWidth = Math.max(400, resizeStartSize.width + deltaX)
                const newHeight = Math.max(300, resizeStartSize.height + deltaY)

                setSize({ width: newWidth, height: newHeight })
            }

            const handleMouseUp = () => {
                setIsResizing(false)
                document.body.style.cursor = "default"
            }

            if (isResizing) {
                document.addEventListener("mousemove", handleMouseMove)
                document.addEventListener("mouseup", handleMouseUp)
            }

            return () => {
                document.removeEventListener("mousemove", handleMouseMove)
                document.removeEventListener("mouseup", handleMouseUp)
            }
        }, [isResizing, resizeStartPosition, resizeStartSize, resizeDirection])

        return (
            <div
                className={`terminal-container ${isDragging ? "dragging" : ""} ${isResizing ? "resizing" : ""}`}
                ref={containerRef}
                style={{
                    width: `${size.width}px`,
                    height: `${size.height}px`,
                    position: "absolute",
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    zIndex: isDragging ? 1001 : 1000,
                }}
            >
                {/* Barra de título estilo macOS */}
                <div className="terminal-titlebar" onMouseDown={startDrag}>
                    <div className="window-controls">
                        <div className="control-button close-button"></div>
                        <div className="control-button minimize-button"></div>
                        <div className="control-button maximize-button"></div>
                    </div>
                    <div className="window-title">
                        <Folder size={14} className="inline mr-2" /> clicafe — zsh — {Math.floor(size.width / 10)}×
                        {Math.floor(size.height / 20)}
                    </div>
                    <div className="window-spacer"></div> {/* Espacio para equilibrar el header */}
                </div>

                <div
                    className="terminal-content"
                    onClick={() => {
                        if (ref && typeof ref !== "function" && ref.current) {
                            ref.current.focus()
                        }
                    }}
                >
                    <div className="terminal" ref={terminalRef}>
                        {/* Modificar la parte donde se renderizan las líneas de historial */}
                        <div className="terminal-history">
                            {history.map((item, index) => {
                                // Determinar si la línea es un comando (comienza con "shop@clicafe ~ %")
                                const isCommand = item.isCommand || item.text.startsWith("shop@clicafe ~ %");

                                return (
                                    <div
                                        key={index}
                                        className={`terminal-line ${isCommand ? 'command' : ''} ${isCommand && item.isAuthenticated ? 'authenticated' : ''}`}
                                    >
                                        {item.text}
                                    </div>
                                );
                            })}
                        </div>
                        {/* Modificar la parte del JSX donde se muestra el prompt y el input para usar clases condicionales */}
                        <div className="terminal-input-container">
                            {isLoading ? (
                                <span className="terminal-loading">Procesando...</span>
                            ) : (
                                <>
                                    <span className={`terminal-prompt ${isAuthenticated ? 'authenticated' : ''}`}>shop@clicafe ~ %</span>
                                    <input
                                        ref={ref}
                                        type="text"
                                        value={currentCommand}
                                        onChange={handleChange}
                                        onKeyDown={handleKeyDown}
                                        className={`terminal-input ${isAuthenticated ? 'authenticated' : ''}`}
                                        autoFocus
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Controladores de redimensionamiento */}
                <div className="resize-handle resize-handle-se" onMouseDown={(e) => startResize(e, 1, 1)}></div>
                <div className="resize-handle resize-handle-sw" onMouseDown={(e) => startResize(e, -1, 1)}></div>
                <div className="resize-handle resize-handle-ne" onMouseDown={(e) => startResize(e, 1, -1)}></div>
                <div className="resize-handle resize-handle-nw" onMouseDown={(e) => startResize(e, -1, -1)}></div>
                <div className="resize-handle resize-handle-n" onMouseDown={(e) => startResize(e, 0, -1)}></div>
                <div className="resize-handle resize-handle-s" onMouseDown={(e) => startResize(e, 0, 1)}></div>
                <div className="resize-handle resize-handle-e" onMouseDown={(e) => startResize(e, 1, 0)}></div>
                <div className="resize-handle resize-handle-w" onMouseDown={(e) => startResize(e, -1, 0)}></div>

                {children}
            </div>
        )
    },
)

Terminal.displayName = "Terminal"

export default Terminal

