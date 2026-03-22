/*
 * Copyright (c) 2026 Piotr Krzysztof Wyrwas [flow]
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import {ParticleMathModule} from "@/lib/WasmModuleLoader";
import ParticleSystem from "@/lib/simulation/ParticleSystem";

export default class ParticleMotion {

    // Size of a 32-bit float (in bytes)
    readonly F32_SIZE = 32 / 8;

    readonly system: ParticleSystem
    readonly math: ParticleMathModule

    positionArrayPtr!: number
    positions!: Float32Array

    velocityArrayPtr!: number
    velocities!: Float32Array

    accelerationArrayPtr!: number
    accelerations!: Float32Array

    constructor(system: ParticleSystem, mathModule: ParticleMathModule) {
        this.system = system
        this.math = mathModule

        this.allocateMotionBuffers()
    }

    private allocateMotionBuffers() {
        const count = this.system.particleCount

        // sizeof(float) * particleCount * 3 (X, Y, Z)
        const floatCount = count * 3
        const allocSize = this.F32_SIZE * floatCount;

        this.positionArrayPtr = this.math.malloc(allocSize)
        this.positions = this.math.HEAPF32.subarray(this.positionArrayPtr / this.F32_SIZE, this.positionArrayPtr / this.F32_SIZE + floatCount)

        this.velocityArrayPtr = this.math.malloc(allocSize)
        this.velocities = this.math.HEAPF32.subarray(this.velocityArrayPtr / this.F32_SIZE, this.velocityArrayPtr / this.F32_SIZE + floatCount)

        this.accelerationArrayPtr = this.math.malloc(allocSize)
        this.accelerations = this.math.HEAPF32.subarray(this.accelerationArrayPtr / this.F32_SIZE, this.accelerationArrayPtr / this.F32_SIZE + floatCount)
    }

    updateMotion(integrationSteps: number, dt: number) {
        this.math.integrateParticleMotion(this.system.particleCount, integrationSteps, dt, this.positionArrayPtr, this.velocityArrayPtr, this.accelerationArrayPtr)
    }

}