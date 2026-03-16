'use client'

import React, {useEffect, useRef, useState} from "react";
import useRenderer from "@/hooks/useRenderer";
import ControlOverlay from "@/components/ControlOverlay";
import CommandPrompt from "@/components/CommandPrompt";
import CommandProcessor from "@/simulation/CommandProcessor";

export default function Page() {
    const rendererRef = useRef<HTMLDivElement>(null)
    const particleSystem = useRenderer(rendererRef)

    const [commandProcessor, setCommandProcessor] = useState<CommandProcessor | null>(null)

    useEffect(() => {
        particleSystem.current && setCommandProcessor(new CommandProcessor(particleSystem.current))
    }, [particleSystem]);

    return (
        <>
            <div className="w-full h-svh z-10 pointer-events-auto">
                <div ref={rendererRef} className="w-full h-full"></div>
            </div>

            <ControlOverlay systemRef={particleSystem}></ControlOverlay>

            <CommandPrompt processor={commandProcessor}></CommandPrompt>
        </>
    )
}