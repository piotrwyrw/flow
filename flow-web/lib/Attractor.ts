import * as Three from 'three'

export enum AttractorMode {
    CONSTANT = "Constant",
    LINEAR = "Linear",
    INVERSE_SQUARE = "Inverse Square"
}

export function attractorModeDisplayName(mode: AttractorMode): string {
    switch (mode) {
        case AttractorMode.CONSTANT:
            return "Constant"
        case AttractorMode.LINEAR:
            return "Linear"
        case AttractorMode.INVERSE_SQUARE:
            return "Inverse Square"
    }
}

export default class Attractor {
    position: Three.Vector3
    strength: number
    mode: AttractorMode
    updateCallback: (a: Attractor) => void

    constructor(position: Three.Vector3, strength: number, mode: AttractorMode = AttractorMode.CONSTANT, updateCallback: (a: Attractor) => void = ((a) => {
    })) {
        this.position = position
        this.strength = strength
        this.mode = mode
        this.updateCallback = updateCallback
    }

    update() {
        this.updateCallback(this)
    }

    forceAt(particleX: number, particleY: number, particleZ: number): Three.Vector3 {
        const particlePosition = new Three.Vector3(particleX, particleY, particleZ)

        const direction = this.position
            .clone()
            .sub(particlePosition)
            .setLength(this.strength)

        // Strength doesn't change in the field
        if (this.mode == AttractorMode.CONSTANT) return direction

        const minDistance = 0.5
        const distance = Math.max(particlePosition.distanceTo(this.position), minDistance)

        // Strength diminishes by 1/distance
        if (this.mode == AttractorMode.LINEAR) {
            return direction.divideScalar(distance)
        }

        // Strength diminishes by 1/distance^2
        else if (this.mode == AttractorMode.INVERSE_SQUARE) {
            return direction.divideScalar(distance * distance)
        }

        // This shouldn't happen, but we'll handle it gracefully
        else return new Three.Vector3(0, 0)
    }
}