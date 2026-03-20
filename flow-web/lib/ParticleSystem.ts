import * as Three from 'three'
import {AdditiveBlending, CustomBlending, SphereGeometry, Vector3} from 'three'
import {randomNormalizedNumber} from "@/three/utils";
import Attractor, {AttractorMode} from "@/lib/Attractor";
import {showDetailedToast} from "@/lib/utils";

import * as Shaders from '@/lib/Shaders'
import {ShaderSource} from '@/lib/Shaders'
import {fallbackModeToFallbackField} from "next/dist/lib/fallback";

type AttractorListener = (attractors: Attractor[]) => void

export default class ParticleSystem {
    readonly maxVelocity: number = 50
    readonly maxAcceleration: number = 10

    attractorListeners: AttractorListener[] = []

    particleCount: number

    // Particle Data
    positions: Float32Array
    velocities: Float32Array
    accelerations: Float32Array

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

    constructor(scene: Three.Scene, count: number) {
        this.particleCount = count

        this.positions = new Float32Array(count * 3)
        this.velocities = new Float32Array(count * 3)
        this.accelerations = new Float32Array(count * 3)

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

        const createMaterialAndGeometry = (shader: ShaderSource) => {
            const material = new Three.ShaderMaterial({
                uniforms: {
                    uFastColor: {value: new Three.Color().setHex(0xff8f1f)},
                    uSlowColor: {value: new Three.Color().setHex(0x69beff)}
                },
                vertexShader: shader.vertexShader,
                fragmentShader: shader.fragmentShader,

                blending: Three.AdditiveBlending,
                // premultipliedAlpha: true,

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

            this.accelerations[ix] = 0
            this.accelerations[iy] = 0
            this.accelerations[iz] = 0

            this.velocities[ix] = 0
            this.velocities[iy] = 0
            this.velocities[iz] = 0

            const [x, y, z] = this.randomParticlePosition()

            this.positions[ix] = x
            this.positions[iy] = y
            this.positions[iz] = z
        }
    }

    update() {
        if (this.lastFrameTime == null) {
            this.lastFrameTime = performance.now()
            return
        }

        this.attractors.forEach(a => a.update())

        const forceVec = new Vector3(0, 0, 0)

        for (let i = 0; i < this.particleCount; i++) {
            for (let j = 0; j < this.integrationSubsteps; j++) {
                forceVec.set(0, 0, 0)
                this.integrate(i, this.timeStep, forceVec)
            }
        }

        this.syncGeometryAttributes()
    }

    private integrate(particleIndex: number, dt: number, tmpForceVec: Vector3) {
        const pos = this.positions
        const vel = this.velocities
        const acc = this.accelerations
        const i = particleIndex

        const ix = i * 3
        const iy = i * 3 + 1
        const iz = i * 3 + 2

        const currentPosX = pos[ix]
        const currentPosY = pos[iy]
        const currentPosZ = pos[iz]

        // Reset acceleration
        acc[ix] = 0
        acc[iy] = 0
        acc[iz] = 0

        // Sum attractor forces
        const cumulativeForce = tmpForceVec

        this.attractors.forEach(attractor => {
            cumulativeForce.add(attractor.forceAt(currentPosX, currentPosY, currentPosZ))
        })

        const acceleration = this.limitVec([cumulativeForce.x, cumulativeForce.y, cumulativeForce.z], this.maxAcceleration)

        acc[ix] = acceleration[0]
        acc[iy] = acceleration[1]
        acc[iz] = acceleration[2]

        const newVX = vel[ix] + acc[ix] * dt
        const newVY = vel[iy] + acc[iy] * dt
        const newVZ = vel[iz] + acc[iz] * dt

        const velocity = this.limitVec([newVX, newVY, newVZ], this.maxVelocity)

        vel[ix] = velocity[0]
        vel[iy] = velocity[1]
        vel[iz] = velocity[2]

        const damping = this.velocityDamping
        vel[ix] *= damping
        vel[iy] *= damping
        vel[iz] *= damping

        pos[ix] += vel[ix] * dt
        pos[iy] += vel[iy] * dt
        pos[iz] += vel[iz] * dt
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
            geometryPosition[i * 3] = this.positions[i * 3]
            geometryPosition[i * 3 + 1] = this.positions[i * 3 + 1]
            geometryPosition[i * 3 + 2] = this.positions[i * 3 + 2]

            const vx = this.velocities[i * 3]
            const vy = this.velocities[i * 3 + 1]
            const vz = this.velocities[i * 3 + 2]

            geometryVelocity[i] = Math.sqrt(vx * vx + vy * vy + vz * vz) / this.maxVelocity
        }

        this.geometry.attributes.position.needsUpdate = true
        this.geometry.attributes.speed.needsUpdate = true
    }

    private limitVec(vec: [number, number, number], maxLength: number): [number, number, number] {
        const [x, y, z] = vec
        const length = Math.sqrt(x * x + y * y + z * z)

        if (length === 0 || length <= maxLength) {
            return vec
        }

        const scale = maxLength / length
        return [x * scale, y * scale, z * scale]
    }
}