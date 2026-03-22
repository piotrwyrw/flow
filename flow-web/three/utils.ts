/*
 * Copyright (c) 2026 Piotr Krzysztof Wyrwas [flow]
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import * as Three from "three";

export function setupThree(viewportWidth: number, viewportHeight: number): [Three.PerspectiveCamera, Three.Scene, Three.WebGLRenderer] {
    const camera = new Three.PerspectiveCamera(50, viewportWidth / viewportHeight, 0.0001, 1e20)
    camera.position.z = 10

    const scene = new Three.Scene()
    scene.background = null

    const renderer = new Three.WebGLRenderer({
        antialias: true,
        alpha: true,
        stencil: false,
        depth: false
    })
    renderer.setClearColor(0x000000, 0)
    renderer.setSize(viewportWidth, viewportHeight)

    return [camera, scene, renderer]
}