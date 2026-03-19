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

export function configureThree(viewport: { width: number, height: number }): {
    camera: Three.PerspectiveCamera,
    scene: Three.Scene,
    renderer: Three.WebGLRenderer
} {
    const camera = new Three.PerspectiveCamera(50, viewport.width / viewport.height, 10e-4, 10e6)
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
    renderer.setSize(viewport.width, viewport.height)

    return {camera, scene, renderer}
}