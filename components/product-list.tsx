"use client"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProductList({ products }) {
    const router = useRouter()

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {products.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                    <div className="aspect-square relative">
                        {product.images.edges[0] && (
                            <Image
                                src={product.images.edges[0].node.url || "/placeholder.svg"}
                                alt={product.title}
                                fill
                                className="object-cover"
                            />
                        )}
                    </div>
                    <CardHeader>
                        <CardTitle>{product.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-bold">${product.priceRange.minVariantPrice.amount}</p>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={() => router.push(`/product/${product.handle}`)}>
                            Ver detalles
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
    )
}

