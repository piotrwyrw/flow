import React, {useEffect, useRef} from "react";
import ParticleSystem from "@/lib/ParticleSystem";
import {ACESFilmicToneMapping, Color, Fog, FogExp2, SRGBColorSpace, Vector2, Vector3} from "three";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";
import CommandProcessor from "@/lib/CommandProcessor";
import {configureThree} from "@/three/utils";
import {EffectComposer} from "three/examples/jsm/postprocessing/EffectComposer.js";
import {RenderPass} from "three/examples/jsm/postprocessing/RenderPass.js";
import {UnrealBloomPass} from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import {BokehPass} from "three/examples/jsm/postprocessing/BokehPass.js";
import {expandPaddingObject} from "@floating-ui/utils";

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

        scene.fog = new Fog(0x000000, 0.1, 1000)

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

        const system = new ParticleSystem(scene, particleCount)
        particleSystemRef.current = system

        const effectComposer = new EffectComposer(renderer)
        effectComposer.addPass(new RenderPass(scene, camera))

        const bloomPass = new UnrealBloomPass(new Vector2(width, height), 1, 1, 0.1)

        effectComposer.addPass(bloomPass)

        // const bokehPass = new BokehPass(scene, camera, {
        //     aspect: camera.aspect,
        //     focus: 200,
        //     aperture: 0.00001,
        //     maxblur: 0.01
        // })
        //
        // effectComposer.addPass(bokehPass)

        const commandHandler = new CommandProcessor(system)

        const listener = (e: CustomEvent<string>) => {
            const cmd = e.detail
            commandHandler.handle(cmd)
        }

        window.addEventListener('command', listener as any)

        function animate() {
            orbitControls.update()
            system.update()

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