import ParticleSystem from "@/lib/ParticleSystem";

import {setupThree} from "@/three/utils";
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls.js";

import * as Three from "three"
import {Vector2} from "three"
import {ViewportGizmo} from "three-viewport-gizmo";
import {EffectComposer} from "three/examples/jsm/postprocessing/EffectComposer.js";
import {RenderPass} from "three/examples/jsm/postprocessing/RenderPass.js";
import {UnrealBloomPass} from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

export default class RenderPipeline {
    particleCount: number
    viewport: HTMLElement

    camera!: Three.PerspectiveCamera
    scene!: Three.Scene
    renderer!: Three.WebGLRenderer
    rendererElement!: HTMLCanvasElement

    effectComposer!: EffectComposer
    bloomPass!: UnrealBloomPass

    orbitControls!: OrbitControls;
    viewportGizmo!: ViewportGizmo

    particleSystem: ParticleSystem

    constructor(viewport: HTMLElement, particleCount: number) {
        this.particleCount = particleCount
        this.viewport = viewport

        this.setupThreeObjects()
        this.setupCameraControls()

        this.particleSystem = new ParticleSystem(this.scene, this.particleCount)

        this.setupRenderPipeline()

        window.addEventListener("resize", this.onResize.bind(this))

        requestAnimationFrame(this.render.bind(this))

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
        this.effectComposer.addPass(new RenderPass(this.scene, this.camera))

        this.bloomPass = new UnrealBloomPass(
            new Vector2(this.viewport.clientWidth, this.viewport.clientHeight),
            0.5,
            0.25,
            0.3
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
        return [
            this.viewport.clientWidth,
            this.viewport.clientHeight
        ]
    }

    private render() {
        this.orbitControls.update()
        this.particleSystem.update()

        this.effectComposer.render()
        this.viewportGizmo.render()

        requestAnimationFrame(this.render.bind(this))
    }

    private onResize() {
        const [width, height] = this.getViewportDimensions()

        this.bloomPass.resolution.set(width, height)
        this.renderer.setSize(width, height)

        this.viewportGizmo.update()

        this.camera.aspect = width / height
        this.camera.updateProjectionMatrix()
    }

}