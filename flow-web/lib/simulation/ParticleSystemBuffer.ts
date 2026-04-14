/*
 * Copyright (c) 2026 Piotr Krzysztof Wyrwas [flow]
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import {ParticleMathModule, PMM} from "@/lib/WasmModuleLoader";
import ParticleSystem from "@/lib/simulation/ParticleSystem";
import Attractor, {AttractorMode} from "@/lib/simulation/Attractor";
import {randomNormalizedNumber} from "@/lib/utils";
import {F32BuffPtr, MemPtr, U8BuffPtr, Vec3Buffer} from "@/lib/MemPtr";

export default class ParticleSystemBuffer {

    // Size of a 32-bit float (in bytes)
    readonly F32_SIZE = 32 / 8;

    // Size of an uint8_t (bytes)
    readonly U8_SIZE = 1;

    readonly system: ParticleSystem
    readonly math: ParticleMathModule

    // Particle data
    particleCount: number

    particlePositions: Vec3Buffer
    particleVelocities: Vec3Buffer
    particleAccelerations: Vec3Buffer

    // Attractor data
    attractorCount: number = 0

    attractorPositions: Vec3Buffer
    attractorTypeArray: U8BuffPtr
    attractorStrengthArray: F32BuffPtr

    // This is just to keep track of the attractors without querying the memory
    attractorObjects: Attractor[]

    // Misc. stuff
    timeStep: number = 0.1
    integrationStepCount: number = 1

    constructor(system: ParticleSystem, particleCount: number, mathModule: PMM) {
        this.particleCount = particleCount

        this.system = system
        this.math = mathModule

        this.particlePositions = new Vec3Buffer(particleCount, this.math, "ParticlePos")
        this.particleVelocities = new Vec3Buffer(particleCount, this.math, "ParticleVel")
        this.particleAccelerations = new Vec3Buffer(particleCount, this.math, "ParticleAccel")

        this.attractorPositions = new Vec3Buffer(0, this.math, "AttrPos")
        this.attractorTypeArray = new MemPtr(this.math, "AttrType")
        this.attractorStrengthArray = new MemPtr(this.math, "AttrStrgth")

        this.attractorTypeArray.value()?.fill(0)
        this.attractorStrengthArray.value()?.fill(0)

        this.attractorObjects = []
    }

    private randomParticlePosition(): [number, number, number] {
        const random = () => randomNormalizedNumber() * 100 / 2
        return [random(), random(), random()]
    }

    updateMotion(): this {
        this.math.computeAccelerations(
            this.particleCount,
            this.attractorCount,
            this.attractorTypeArray.memoryAddress(),
            this.attractorPositions.xArrayAddr(),           // \
            this.attractorPositions.yArrayAddr(),           // | Attractor Positions
            this.attractorPositions.zArrayAddr(),           // /
            this.attractorStrengthArray.memoryAddress(),    // < Attractor Strengths
            this.particlePositions.xArrayAddr(),            // \
            this.particlePositions.yArrayAddr(),            // | Particle Positions
            this.particlePositions.zArrayAddr(),            // /
            this.particleAccelerations.xArrayAddr(),        // \
            this.particleAccelerations.yArrayAddr(),        // | Particle Accelerations
            this.particleAccelerations.zArrayAddr()         // /
        )

        this.math.integrateParticleMotion(
            this.integrationStepCount,
            this.particleCount,
            this.timeStep,
            this.particlePositions.xArrayAddr(),            // \
            this.particlePositions.yArrayAddr(),            // | Particle Positions
            this.particlePositions.zArrayAddr(),            // /
            this.particleVelocities.xArrayAddr(),           // \
            this.particleVelocities.yArrayAddr(),           // | Particle Velocities
            this.particleVelocities.zArrayAddr(),            // /
            this.particleAccelerations.xArrayAddr(),        // \
            this.particleAccelerations.yArrayAddr(),        // | Particle Accelerations
            this.particleAccelerations.zArrayAddr()         // /
        )

        return this
    }

    private attractorModeOrdinal(mode: AttractorMode): number {
        switch (mode) {
            case AttractorMode.CONSTANT:
                return 0;
            case AttractorMode.LINEAR:
                return 1;
            case AttractorMode.INVERSE_SQUARE:
                return 2;
        }
    }

    addAttractor(a: Attractor) {
        const i = this.attractorObjects.length

        // Set new attractor position
        this.attractorPositions.grow()
        this.attractorPositions!.xPtr!.value()![i] = a.position.x
        this.attractorPositions!.yPtr!.value()![i] = a.position.y
        this.attractorPositions!.zPtr!.value()![i] = a.position.z

        // Assign the attractor type
        this.attractorTypeArray.grow(MemPtr.U8_SIZE, (ptr, size) =>
            this.math.HEAPU8.subarray(ptr, ptr + size))
        this.attractorTypeArray.value()![i] = this.attractorModeOrdinal(a.mode)

        // Assign the attractor strength
        this.attractorStrengthArray.grow(Vec3Buffer.F32_SIZE, (ptr, size) =>
            this.math.HEAPF32.subarray(ptr / Vec3Buffer.F32_SIZE, ptr / Vec3Buffer.F32_SIZE + size / Vec3Buffer.F32_SIZE))
        this.attractorStrengthArray.value()![i] = a.strength

        this.attractorObjects.push(a)
        this.attractorCount = this.attractorObjects.length

        console.debug(`Added new attractor at (${a.position.x}, ${a.position.y}, ${a.position.z}) with strength ${a.strength} and mode ${a.mode}`)
    }

    resetParticles(): this {
        for (let i = 0; i < this.particleCount; i++) {
            this.particleAccelerations.xPtr.value()![i] = 0
            this.particleAccelerations.yPtr.value()![i] = 0
            this.particleAccelerations.zPtr.value()![i] = 0

            this.particleVelocities.xPtr.value()![i] = 0
            this.particleVelocities.yPtr.value()![i] = 0
            this.particleVelocities.zPtr.value()![i] = 0

            const [x, y, z] = this.randomParticlePosition()

            this.particlePositions.xPtr.value()![i] = x
            this.particlePositions.yPtr.value()![i] = y
            this.particlePositions.zPtr.value()![i] = z
        }

        return this
    }

}