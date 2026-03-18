import * as Three from 'three'
import {SphereGeometry, Vector3} from 'three'
import {randomNormalizedNumber} from "@/three/utils";
import Attractor, {AttractorMode} from "@/lib/Attractor";
import {showDetailedToast} from "@/lib/utils";

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

        const material = new Three.ShaderMaterial({
            uniforms: {
                uFastColor: {value: new Three.Color().setHex(0xff8c00)},
                uSlowColor: {value: new Three.Color().setHex(0x30e0ff)}
            },
            vertexShader: `  
               attribute float speed;
               varying float vSpeed;
                            
               void main() {
                    vSpeed = speed;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = 2.5;
               }
            `,
            fragmentShader: `
                varying float vSpeed;
                uniform vec3 uFastColor;
                uniform vec3 uSlowColor;
                
                void main() {
                    float d = length(gl_PointCoord - vec2(0.5));
                    float a = smoothstep(0.5, 0.0, d);
                
                    float fac = smoothstep(0.0, 0.2, vSpeed);
                    vec3 color = uFastColor * fac + uSlowColor * (1.0 - fac);
                    gl_FragColor = vec4(color, a * 0.15);
                }
            `,
            transparent: true,
            blending: Three.AdditiveBlending,
            depthWrite: false
        })

        const points = new Three.Points(this.geometry, material)

        scene.add(points)
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

            this.positions[ix] = randomNormalizedNumber() * 100 / 2
            this.positions[iy] = randomNormalizedNumber() * 100 / 2
            this.positions[iz] = randomNormalizedNumber() * 100 / 2
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