/*
 * Copyright (c) 2026 Piotr Krzysztof Wyrwas [flow]
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import * as Three from 'three'
import {SphereGeometry, Vector3} from 'three'
import Attractor, {AttractorMode} from "@/lib/simulation/Attractor";
import {randomNormalizedNumber, showDetailedToast} from "@/lib/utils";

import * as Shaders from '@/lib/render/Shaders'
import {ShaderSource} from '@/lib/render/Shaders'
import {getWasmLoaderInstance, WasmModuleLoader, WasmModuleSpecs} from "@/lib/WasmModuleLoader";
import ParticleMotion from "@/lib/simulation/ParticleMotion";

type AttractorListener = (attractors: Attractor[]) => void

export default class ParticleSystem {
    readonly maxVelocity: number = 50
    readonly maxAcceleration: number = 10

    readonly wasmLoader: WasmModuleLoader

    attractorListeners: AttractorListener[] = []

    particleCount: number

    // Particle motion data
    particleMotion: ParticleMotion

    points: Three.Points
    geometry: Three.BufferGeometry

    // Attractor Display
    attractorPositions: Float32Array
    attractorGeometries: SphereGeometry[]

    // Simulation Parameters
    timeStep: number = 0.01
    velocityDamping: number = 1
    integrationSubsteps: number = 1

    angle = 0.0
    yAngle = 0.0

    attractors: Attractor[] = [
        new Attractor(new Three.Vector3(-20, 0, 10), 200, AttractorMode.CONSTANT, (a) => {
            a.position.set(Math.cos(this.angle) * 20, Math.cos(this.yAngle) * 30, Math.sin(this.angle) * 20)
            this.angle += this.timeStep
            this.yAngle += this.timeStep
        }),
    ]

    lastFrameTime: number | null = null

    constructor(wasmLoader: WasmModuleLoader, scene: Three.Scene, count: number, camera: Three.PerspectiveCamera) {
        this.wasmLoader = wasmLoader

        this.particleCount = count

        this.particleMotion = new ParticleMotion(this, wasmLoader.$(WasmModuleSpecs.PARTICLE_MATH_MODULE))

        this.geometry = new Three.BufferGeometry()
        this.geometry.setAttribute('position', new Three.BufferAttribute(
            new Float32Array(count * 3),
            3
        ))
        this.geometry.setAttribute('speed', new Three.BufferAttribute(
            new Float32Array(count),
            1
        ))

        this.attractorPositions = new Float32Array(this.attractors.length)
        this.attractorGeometries = []

        this.reset()
        this.syncGeometryAttributes()

        Shaders.loadShader("particle").then(shader => {
            createMaterialAndGeometry(shader)
        })

        this.points = new Three.Points(this.geometry)
        this.points.frustumCulled = false

        const createMaterialAndGeometry = (shader: ShaderSource) => {
            const material = new Three.ShaderMaterial({
                uniforms: {
                    uFastColor: {value: new Three.Color().setHex(0xFF5800)},
                    uSlowColor: {value: new Three.Color().setHex(0x00D1FF)},
                    uNear: {value: camera.near},
                    uFar: {value: camera.far}
                },
                vertexShader: shader.vertexShader,
                fragmentShader: shader.fragmentShader,

                blending: Three.AdditiveBlending,
                transparent: true,
                depthWrite: false,
                depthTest: false,
            })

            this.points.geometry = this.geometry
            this.points.material = material

            scene.add(this.points)
        }
    }

    addAttractor(a: Attractor) {
        this.attractors.push(a)
        this.emitAttractorEvent()
        showDetailedToast("Attractor Created", `Created a ${a.mode} attractor at (${a.position.x}, ${a.position.y}, ${a.position.z}) with strength ${a.strength}`)
    }

    removeAttractor(index: number) {
        const a = this.attractors[index]
        this.attractors.splice(index, 1)
        this.emitAttractorEvent()
        showDetailedToast("Attractor Removed", `Removed attractor at (${a.position.x}, ${a.position.y}, ${a.position.z})`)
    }

    private randomParticlePosition(): [number, number, number] {
        const random = () => randomNormalizedNumber() * 100 / 2
        return [random(), random(), random()]
    }

    reset() {
        for (let i = 0; i < this.particleCount; i++) {
            const ix = i * 3
            const iy = i * 3 + 1
            const iz = i * 3 + 2

            this.particleMotion.accelerations[ix] = 0
            this.particleMotion.accelerations[iy] = 0
            this.particleMotion.accelerations[iz] = 0

            this.particleMotion.velocities[ix] = 0
            this.particleMotion.velocities[iy] = 0
            this.particleMotion.velocities[iz] = 0

            const [x, y, z] = this.randomParticlePosition()

            this.particleMotion.positions[ix] = x
            this.particleMotion.positions[iy] = y
            this.particleMotion.positions[iz] = z
        }
    }

    update() {
        if (this.lastFrameTime == null) {
            this.lastFrameTime = performance.now()
            return
        }

        this.attractors.forEach(a => a.update())

        this.particleMotion.updateMotion(this.integrationSubsteps, 0.1)

        this.syncGeometryAttributes()
    }

    registerAttractorListener(listener: AttractorListener) {
        this.attractorListeners.push(listener)
    }

    private emitAttractorEvent() {
        this.attractorListeners.forEach(listener => {
            listener(this.attractors)
        })
    }

    private syncGeometryAttributes() {
        const geometryPosition = this.geometry.attributes.position.array as Float32Array
        const geometryVelocity = this.geometry.attributes.speed.array as Float32Array

        for (let i = 0; i < this.particleCount; i++) {
            geometryPosition[i * 3] = this.particleMotion.positions[i * 3]
            geometryPosition[i * 3 + 1] = this.particleMotion.positions[i * 3 + 1]
            geometryPosition[i * 3 + 2] = this.particleMotion.positions[i * 3 + 2]

            const vx = this.particleMotion.velocities[i * 3]
            const vy = this.particleMotion.velocities[i * 3 + 1]
            const vz = this.particleMotion.velocities[i * 3 + 2]

            geometryVelocity[i] = Math.sqrt(vx * vx + vy * vy + vz * vz) / this.maxVelocity
        }

        this.geometry.attributes.position.needsUpdate = true
        this.geometry.attributes.speed.needsUpdate = true
    }
}