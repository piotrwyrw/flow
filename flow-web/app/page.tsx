/*
 * Copyright (c) 2026 Piotr Krzysztof Wyrwas [flow]
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

"use client";

import React, {useEffect, useRef, useState} from "react";
import CommandProcessor from "@/lib/CommandProcessor";
import ParticleSystem from "@/lib/simulation/ParticleSystem";
import ControlOverlay from "@/components/ControlOverlay";
import CommandPrompt from "@/components/CommandPrompt";
import RenderPipeline from "@/lib/render/RenderPipeline";
import {getWasmLoaderInstance, WasmModuleLoader} from "@/lib/WasmModuleLoader";

export default function Page() {
    const rendererRef = useRef<HTMLDivElement>(null)

    const [pipeline, setPipeline] = useState<RenderPipeline | null>(null)
    const [commandProcessor, setCommandProcessor] = useState<CommandProcessor | null>(null)
    const [particleSystem, setParticleSystem] = useState<ParticleSystem | null>(null);

    const [wasmLoader, setWasmLoader] = useState<WasmModuleLoader | null>(null)

    useEffect(() => {
        if (!rendererRef.current)
            return

        const loader = getWasmLoaderInstance()
        loader.loadMissingModules().then(() => {
            setWasmLoader(loader)

            const pipe = new RenderPipeline(rendererRef.current!, 100000, loader)
            const processor = new CommandProcessor(pipe.particleSystem)

            setPipeline(pipe)
            setCommandProcessor(processor)
            setParticleSystem(pipe.particleSystem)
        })
    }, [rendererRef]);

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