import * as Three from "three";

export type CameraBounds = {
    viewportWidth: number,
    viewportHeight: number,
    worldWidth: number,
    worldHeight: number,
    left: number,
    right: number,
    top: number,
    bottom: number
}

export function randomNormalizedNumber(): number {
    return (Math.random() - 0.5) * 2
}

export function setupThree(viewportWidth: number, viewportHeight: number): [Three.PerspectiveCamera, Three.Scene, Three.WebGLRenderer] {
    const camera = new Three.PerspectiveCamera(50, viewportWidth / viewportHeight, 0.0001, 1e20)
    camera.position.z = 10

    const scene = new Three.Scene()
    scene.background = null

    const renderer = new Three.WebGLRenderer({
        antialias: true,
        alpha: true,
        stencil: false,
        depth: false,
        outputBufferType: Three.FloatType
    })
    renderer.setClearColor(0x000000, 0)
    renderer.setSize(viewportWidth, viewportHeight)

    return [camera, scene, renderer]
}