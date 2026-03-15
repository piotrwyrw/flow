'use client'

import {useRef} from "react";
import useRenderer from "@/hooks/useRenderer";

export default function Visualisation() {
    const rendererRef = useRef<HTMLDivElement>(null)

    useRenderer(rendererRef)

    return (
        <div ref={rendererRef} className="w-full h-full"></div>
    )
}