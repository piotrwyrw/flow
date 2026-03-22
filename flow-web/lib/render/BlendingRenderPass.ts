/*
 * Copyright (c) 2026 Piotr Krzysztof Wyrwas [flow]
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import * as Shaders from '@/lib/render/Shaders'
import * as Three from "three";
import {AdditiveBlending, CineonToneMapping, NormalBlending} from "three";

export default class BlendingRenderPass {
    ready: boolean = false

    blendShaderMaterial!: Three.ShaderMaterial

    camera: Three.Camera
    scene: Three.Scene
    renderer: Three.WebGLRenderer

    blendingScene!: Three.Scene
    screenQuadGeometry!: Three.PlaneGeometry
    screenQuad!: Three.Mesh

    renderDestination: Three.WebGLRenderTarget

    width: number
    height: number

    constructor(camera: Three.Camera, scene: Three.Scene, renderer: Three.WebGLRenderer, width: number, height: number) {
        this.camera = camera
        this.scene = scene
        this.renderer = renderer

        this.width = width
        this.height = height

        this.renderDestination = new Three.WebGLRenderTarget(width, height, {
            type: Three.FloatType,
            format: Three.RGBAFormat,
            colorSpace: Three.LinearSRGBColorSpace,
        })

        this.createMaterial(() => {
            this.blendingScene = new Three.Scene()
            this.blendingScene.background = new Three.Color(0, 0, 0)

            this.screenQuadGeometry = new Three.PlaneGeometry(2, 2)
            this.screenQuad = new Three.Mesh(this.screenQuadGeometry, this.blendShaderMaterial!)

            this.blendingScene.add(this.screenQuad)

            this.ready = true
        })
    }

    setSize(width: number, height: number) {
        this.renderDestination.setSize(width, height)
    }

    private createMaterial(then: () => void) {
        Shaders.loadShader("blend").then(shader => {
            this.blendShaderMaterial = new Three.ShaderMaterial({
                uniforms: {
                    uFrame: {value: null}
                },
                vertexShader: shader.vertexShader,
                fragmentShader: shader.fragmentShader,
                blending: AdditiveBlending,
                depthWrite: false,
                depthTest: false
            })
            then()
        })
    }

    render() {
        if (!this.ready) {
            return;
        }

        // First render the cene to the render buffer
        this.renderer.setRenderTarget(this.renderDestination)
        this.renderer.render(this.scene, this.camera)

        // Render the full-screen quad with the blending shader to the screen
        this.blendShaderMaterial.uniforms.uFrame.value = this.renderDestination.texture

        this.renderer.toneMapping = CineonToneMapping;
        this.renderer.toneMappingExposure = 1.0

        this.renderer.setRenderTarget(null)
        this.renderer.render(this.blendingScene, this.camera)
    }

}