/*
 * Copyright (c) 2026 Piotr Krzysztof Wyrwas [flow]
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import ParticleSystem from "@/lib/simulation/ParticleSystem";

import {setupThree} from "@/three/utils";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";

import * as Three from "three"
import {ViewportGizmo} from "three-viewport-gizmo";
import BlendingRenderPass from "@/lib/render/BlendingRenderPass";
import {EffectComposer} from "three/examples/jsm/postprocessing/EffectComposer.js";
import {RenderPass} from "three/examples/jsm/postprocessing/RenderPass.js";
import {UnrealBloomPass} from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import {Vector2} from "three";
import {WasmModuleLoader} from "@/lib/WasmModuleLoader";

export default class RenderPipeline {
    readonly wasmLoader: WasmModuleLoader

    particleCount: number
    viewport: HTMLElement

    width!: number
    height!: number

    camera!: Three.PerspectiveCamera
    scene!: Three.Scene
    renderer!: Three.WebGLRenderer
    rendererElement!: HTMLCanvasElement

    effectComposer!: EffectComposer
    bloomPass!: UnrealBloomPass

    orbitControls!: OrbitControls;
    viewportGizmo!: ViewportGizmo

    particleSystem: ParticleSystem

    constructor(viewport: HTMLElement, particleCount: number, wasmLoader: WasmModuleLoader) {
        this.wasmLoader = wasmLoader

        this.particleCount = particleCount
        this.viewport = viewport

        const [width, height] = this.getViewportDimensions()

        this.setupThreeObjects()
        this.setupCameraControls()

        this.particleSystem = new ParticleSystem(wasmLoader, this.scene, this.particleCount, this.camera)

        this.setupRenderPipeline()

        window.addEventListener("resize", this.onResize.bind(this))

        this.renderer.setPixelRatio(width / height)
        this.renderer.setAnimationLoop(() => this.render())

        this.viewport.appendChild(this.renderer.domElement)
    }

    private setupThreeObjects() {
        const [camera, scene, renderer] = setupThree(...this.getViewportDimensions())
        this.camera = camera
        this.scene = scene
        this.renderer = renderer

        this.rendererElement = this.renderer.domElement
    }

    private setupRenderPipeline() {
        this.effectComposer = new EffectComposer(this.renderer)

        this.effectComposer.setSize(this.width, this.height)
        this.effectComposer.setPixelRatio(this.width / this.height)

        this.effectComposer.addPass(new RenderPass(this.scene, this.camera))

        this.bloomPass = new UnrealBloomPass(
            new Vector2(this.width, this.height),
            0.5,
            0.25,
            0.5
        )
        this.effectComposer.addPass(this.bloomPass)
    }

    private setupCameraControls() {
        this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement)
        this.orbitControls.enablePan = true
        this.orbitControls.enableRotate = true
        this.orbitControls.enableZoom = true
        this.orbitControls.zoomSpeed = 1.0

        this.viewportGizmo = new ViewportGizmo(this.camera, this.renderer, {
            x: {color: 0xd12a43},
            y: {color: 0x2ad16a},
            z: {color: 0x2a6ad1}
        })
        this.viewportGizmo.attachControls(this.orbitControls)
    }

    private getViewportDimensions(): [number, number] {
        this.width = window.innerWidth
        this.height = window.innerHeight
        return [this.width, this.height]
    }

    private render() {
        this.orbitControls.update()
        this.particleSystem.update()

        this.effectComposer.render()
        this.viewportGizmo.render()
    }

    private onResize() {
        const [width, height] = this.getViewportDimensions()

        this.effectComposer.setSize(width, height)
        this.effectComposer.setPixelRatio(width / height)

        this.bloomPass.resolution.set(width, height)

        this.renderer.setPixelRatio(width / height)
        this.renderer.setSize(width, height, true)

        this.viewportGizmo.update()

        this.camera.aspect = width / height
        this.camera.updateProjectionMatrix()
    }

}