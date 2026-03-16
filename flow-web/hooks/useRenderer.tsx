import React, {useEffect, useRef} from "react";
import ParticleSystem from "@/simulation/ParticleSystem";
import {ACESFilmicToneMapping, Color, SRGBColorSpace, Vector2} from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";
import {EffectComposer} from "three/examples/jsm/postprocessing/EffectComposer.js";
import {RenderPass} from "three/examples/jsm/postprocessing/RenderPass.js";
import {UnrealBloomPass} from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import CommandProcessor from "@/simulation/CommandProcessor";
import {configureThree} from "@/three/utils";

export default function useRenderer(viewportRef: React.RefObject<HTMLElement | null>) {
    const particleSystemRef = useRef<ParticleSystem | null>(null)

    useEffect(() => {
        if (!viewportRef.current) return

        window.addEventListener('resize', onResize)

        const particleCount = 1e5

        const viewport = viewportRef.current
        const width = viewport.clientWidth
        const height = viewport.clientHeight

        let {camera, scene, renderer} = configureThree({width, height})

        renderer.setAnimationLoop(animate)
        viewport.appendChild(renderer.domElement)

        renderer.outputColorSpace = SRGBColorSpace
        renderer.toneMapping = ACESFilmicToneMapping
        renderer.toneMappingExposure = 1

        const orbitControls = new OrbitControls(camera, renderer.domElement)
        orbitControls.enablePan = true
        orbitControls.enableRotate = true
        orbitControls.enableZoom = true
        orbitControls.zoomSpeed = 1.0

        const effectComposer = new EffectComposer(renderer)
        effectComposer.addPass(new RenderPass(scene, camera))
        effectComposer.addPass(new UnrealBloomPass(new Vector2(width, height), 0.2, 0.5, 0.9))

        const system = new ParticleSystem(scene, particleCount)
        particleSystemRef.current = system

        const commandHandler = new CommandProcessor(system)

        const listener = (e: CustomEvent<string>) => {
            const cmd = e.detail
            commandHandler.handle(cmd)
        }

        window.addEventListener('command', listener as any)

        function animate() {
            orbitControls.update()
            system.update()

            renderer.autoClear = false
            renderer.clear()

            effectComposer.render()
        }

        function onResize() {
            const width = viewport.clientWidth
            const height = viewport.clientHeight

            renderer.setSize(width, height)

            camera.aspect = width / height
            camera.updateProjectionMatrix()
        }
    }, [viewportRef])

    return particleSystemRef
}