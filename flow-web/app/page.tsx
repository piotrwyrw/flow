'use client'

import React, {useEffect, useRef, useState} from "react";
import useRenderer from "@/hooks/useRenderer";
import ControlOverlay from "@/components/ControlOverlay";
import CommandPrompt from "@/components/CommandPrompt";
import CommandProcessor from "@/simulation/CommandProcessor";
import ParticleSystem from "@/simulation/ParticleSystem";

export default function Page() {
    const rendererRef = useRef<HTMLDivElement>(null)
    const particleSystemRef = useRenderer(rendererRef)

    const [commandProcessor, setCommandProcessor] = useState<CommandProcessor | null>(null)
    const [particleSystem, setParticleSystem] = useState<ParticleSystem | null>(null)

    useEffect(() => {
        particleSystemRef.current && setCommandProcessor(new CommandProcessor(particleSystemRef.current))
        particleSystemRef.current && setParticleSystem(particleSystemRef.current)
    }, [particleSystemRef]);

    return (
        <>
            <div className="w-full h-svh z-10 pointer-events-auto">
                <div ref={rendererRef} className="w-full h-full"></div>
            </div>

            {
                particleSystem
                && <ControlOverlay system={particleSystem}></ControlOverlay>
            }

            {
                commandProcessor
                && <CommandPrompt processor={commandProcessor}></CommandPrompt>
            }
        </>
    )
}