/*
 * Copyright (c) 2026 Piotr Krzysztof Wyrwas [flow]
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import * as Three from 'three'

import * as Shaders from '@/lib/render/Shaders'
import {WasmModuleLoader, WasmModuleSpecs} from "@/lib/WasmModuleLoader";
import ParticleSystemBuffer from "@/lib/simulation/ParticleSystemBuffer";
import Attractor from "@/lib/simulation/Attractor";
import SimulationScriptManager, {
    SimulationScriptError,
    SimulationScriptManagerErrorCallback
} from "@/lib/scripting/ScriptManager";
import {showDetailedToast} from "@/lib/utils";

export type AttractorListener = (attractors: Attractor[]) => void

export default class ParticleSystem {
    readonly maxVelocity: number = 50

    readonly wasmLoader: WasmModuleLoader

    // Particle motion data
    readonly buffer: ParticleSystemBuffer

    points: Three.Points
    geometry: Three.BufferGeometry

    attractorListeners: AttractorListener[]

    scriptManager: SimulationScriptManager

    #scriptError(message: string) {
        showDetailedToast("Script Error", message)
    }

    #getAttractorLocation(index: number): [number, number, number] {
        if (index >= this.buffer.attractorCount)
            throw new SimulationScriptError(`Index ${index} is out of bounds for array of size ${this.buffer.attractorCount} in "getAttractorLocation"`)

        const x = this.buffer.attractorPositions.xPtr.value()![index] ?? 0
        const y = this.buffer.attractorPositions.yPtr.value()![index] ?? 0
        const z = this.buffer.attractorPositions.zPtr.value()![index] ?? 0

        return [x, y, z]
    }

    #getAttractorStrength(index: number): number {
        if (index >= this.buffer.attractorCount)
            throw new SimulationScriptError(`Index ${index} is out of bounds for array of size ${this.buffer.attractorCount} in "getAttractorStrength"`)

        return this.buffer.attractorStrengthArray.value()?.at(index) ?? 0
    }

    #setAttractorStrength(index: number, strength: number) {
        if (index >= this.buffer.attractorCount)
            throw new SimulationScriptError(`Index ${index} is out of bounds for array of size ${this.buffer.attractorCount} in "setAttractorStrength"`)

        this.buffer.attractorStrengthArray.value()![index] = strength
    }

    #setAttractorLocation(index: number, x: number, y: number, z: number) {
        if (index >= this.buffer.attractorCount)
            throw new SimulationScriptError(`Index ${index} is out of bounds for array of size ${this.buffer.attractorCount} in "setAttractorLocation"`)

        this.buffer.attractorPositions.xPtr.value()![index] = x
        this.buffer.attractorPositions.yPtr.value()![index] = y
        this.buffer.attractorPositions.zPtr.value()![index] = z
    }

    constructor(wasmLoader: WasmModuleLoader, scene: Three.Scene, count: number, camera: Three.PerspectiveCamera) {
        this.wasmLoader = wasmLoader

        this.geometry = new Three.BufferGeometry()
        this.geometry.setAttribute('position', new Three.BufferAttribute(new Float32Array(count * 3), 3))
        this.geometry.setAttribute('speed', new Three.BufferAttribute(new Float32Array(count), 1))

        this.buffer = new ParticleSystemBuffer(
            this,
            count,
            wasmLoader.$(WasmModuleSpecs.PARTICLE_MATH_MODULE)
        )
        this.buffer.resetParticles()
        this.syncGeometryAttributes()

        this.points = new Three.Points(this.geometry)
        this.points.frustumCulled = false

        this.attractorListeners = []

        this.scriptManager = new SimulationScriptManager({
            error: this.#scriptError,
            getAttractorLocation: this.#getAttractorLocation,
            getAttractorStrength: this.#getAttractorStrength,
            setAttractorLocation: this.#setAttractorLocation,
            setAttractorStrength: this.#setAttractorStrength
        })

        Shaders.loadShader("particle").then(shader => {
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
        })
    }

    addScript(source: string, name: string) {
        this.scriptManager.addScript(name, source, () => {
            showDetailedToast("Script Compilation", "Script compiled successfully.")
        }, () => {
            showDetailedToast("Compilation Error", "Could not compile the script.")
        })
    }

    registerAttractorListener(listener: AttractorListener) {
        this.attractorListeners.push(listener)
    }

    particleCount(): number {
        return this.buffer.particleCount
    }

    timeStep(): number {
        return this.buffer.timeStep
    }

    setTimeStep(timeStep: number) {
        this.buffer.timeStep = timeStep
    }

    integrationStepCount(): number {
        return this.buffer.integrationStepCount
    }

    setIntegrationStepCount(steps: number) {
        this.buffer.integrationStepCount = steps
    }

    attractors(): Attractor[] {
        return this.buffer.attractorObjects
    }

    addAttractor(attractor: Attractor) {
        this.buffer.addAttractor(attractor)
    }

    update() {
        // Run all scripts first
        this.scriptManager.runAllScripts()

        // Don't bother running any math if there are no attractors or the time step is 0
        if (this.attractors().length === 0 || this.timeStep() === 0.0)
            return;

        this.buffer.updateMotion()
        this.syncGeometryAttributes()
    }

    private syncGeometryAttributes() {
        const positionAttribute = this.geometry.attributes.position.array as Float32Array
        const speedAttribute = this.geometry.attributes.speed.array as Float32Array

        for (let i = 0; i < this.buffer.particleCount; i++) {
            positionAttribute[i * 3] = this.buffer.particlePositions.xPtr.value()![i]
            positionAttribute[i * 3 + 1] = this.buffer.particlePositions.yPtr.value()![i]
            positionAttribute[i * 3 + 2] = this.buffer.particlePositions.zPtr.value()![i]

            const vx = this.buffer.particleVelocities.xPtr.value()![i]
            const vy = this.buffer.particleVelocities.yPtr.value()![i]
            const vz = this.buffer.particleVelocities.zPtr.value()![i]

            speedAttribute[i] = Math.sqrt(vx * vx + vy * vy + vz * vz) / this.maxVelocity
        }

        this.geometry.attributes.position.needsUpdate = true
        this.geometry.attributes.speed.needsUpdate = true
    }
}