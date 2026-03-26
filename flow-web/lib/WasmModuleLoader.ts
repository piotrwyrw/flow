/*
 * Copyright (c) 2026 Piotr Krzysztof Wyrwas [flow]
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export type WasmModuleSpecification = {
    url: string,
    jsModule: string
}

export const WasmModuleSpecs = {
    PARTICLE_MATH_MODULE: {url: '/wasm/particle_math.js', jsModule: 'ParticleMathModule'} as const
} as const


export type WasmModuleSpec = typeof WasmModuleSpecs[keyof typeof WasmModuleSpecs]

export type BaseWasmModule<T extends WasmModuleSpec = WasmModuleSpec> = {
    type: T['jsModule'],
    scriptElement: HTMLScriptElement,

    // MM functions available in all modules
    malloc: (size: number) => number,
    free: (ptr: number) => void,
    realloc: (ptr: number, size: number) => number,

    // Integer Heap Views
    HEAP8: Int8Array,
    HEAP16: Int16Array,
    HEAP32: Int32Array,

    // Unsigned Integer Heap Views
    HEAPU8: Uint8Array,
    HEAPU16: Uint16Array,
    HEAPU32: Uint32Array,

    // Float Heap Views
    HEAPF32: Float32Array,
    HEAPF64: Float64Array,
}

export type ParticleMathModule = BaseWasmModule<typeof WasmModuleSpecs.PARTICLE_MATH_MODULE> & {
    integrateParticleMotion: (integrationSteps: number,
                              particleCount: number,
                              dt: number,
                              //
                              // Particle Positions (SoA for SIMD perf)
                              //
                              particleXPositionArrayPtr: number,
                              particleYPositionArrayPtr: number,
                              particleZPositionArrayPtr: number,
                              //
                              // Particle Velocities (SoA for SIMD perf)
                              //
                              particleXVelocityArrayPtr: number,
                              particleYVelocityArrayPtr: number,
                              particleZVelocityArrayPtr: number,
                              //
                              // Particle Accelerations (SoA for SIMD perf)
                              //
                              particleXAccelerationArrayPtr: number,
                              particleYAccelerationArrayPtr: number,
                              particleZAccelerationArrayPtr: number) => void,

    computeAccelerations: (particleCount: number,
                           attractorCount: number,
                           attractorTypesPtr: number,
                           //
                           // Attractor Positions (SoA for SIMD perf)
                           //
                           attractorXPositionArrayPtr: number,
                           attractorYPositionArrayPtr: number,
                           attractorZPositionArrayPtr: number,
                           // ---
                           attractorStrengthsPtr: number,
                           //
                           // Particle Positions (SoA for SIMD perf)
                           //
                           particleXPositionArrayPtr: number,
                           particleYPositionArrayPtr: number,
                           particleZPositionArrayPtr: number,
                           //
                           // Particle Accelerations (SoA for SIMD perf)
                           //
                           particleXAccelerationArrayPtr: number,
                           particleYAccelerationArrayPtr: number,
                           particleZAccelerationArrayPtr: number) => void
}

export type AnyWasmModule = ParticleMathModule

export type PMM = ParticleMathModule

export type ModuleTypeFor<T extends WasmModuleSpec> =
    T extends typeof WasmModuleSpecs.PARTICLE_MATH_MODULE ? ParticleMathModule :
        BaseWasmModule<T>

export type ModuleFactoryMap = {
    [K in WasmModuleSpec['jsModule']]: (
        spec: Extract<WasmModuleSpec, { jsModule: K }>,
        module: any,
        script: HTMLScriptElement
    ) => ModuleTypeFor<Extract<WasmModuleSpec, { jsModule: K }>>
}

export class WasmModuleLoader {
    readonly factories: ModuleFactoryMap = {
        ParticleMathModule: (spec, module, script) => {
            const integrateFnIdentifier = "integrate_motions_n"
            const integrateFn = module.cwrap(integrateFnIdentifier, null, ['number', 'number', 'number', 'number', 'number', 'number'])
            if (!integrateFn) {
                throw new Error(`Could not retrieve function "${integrateFnIdentifier}" while loading module ${spec.jsModule} from ${spec.url}`)
            }

            const computeAccelerationsFnIdentifier = "compute_accelerations"
            const computeAccelerationsFn = module.cwrap(computeAccelerationsFnIdentifier, null, ['number', 'number', 'number', 'number', 'number', 'number', 'number'])
            if (!computeAccelerationsFn) {
                throw new Error(`Could not retrieve function "${computeAccelerationsFnIdentifier}" while loading module ${spec.jsModule} from ${spec.url}`)
            }

            return {
                type: WasmModuleSpecs.PARTICLE_MATH_MODULE.jsModule,
                scriptElement: script,
                integrateParticleMotion: (integrationSteps,
                                          particleCount,
                                          dt,
                                          particleXPositionArrayPtr,
                                          particleYPositionArrayPtr,
                                          particleZPositionArrayPtr,
                                          particleXVelocityArrayPtr,
                                          particleYVelocityArrayPtr,
                                          particleZVelocityArrayPtr,
                                          particleXAccelerationArrayPtr,
                                          particleYAccelerationArrayPtr,
                                          particleZAccelerationArrayPtr) => {
                    integrateFn(
                        integrationSteps,
                        particleCount,
                        dt,
                        particleXPositionArrayPtr,
                        particleYPositionArrayPtr,
                        particleZPositionArrayPtr,
                        particleXVelocityArrayPtr,
                        particleYVelocityArrayPtr,
                        particleZVelocityArrayPtr,
                        particleXAccelerationArrayPtr,
                        particleYAccelerationArrayPtr,
                        particleZAccelerationArrayPtr
                    )
                },
                computeAccelerations: (particleCount,
                                       attractorCount,
                                       attractorTypesPtr,
                                       attractorXPositionArrayPtr,
                                       attractorYPositionArrayPtr,
                                       attractorZPositionArrayPtr,
                                       attractorStrengthsPtr,
                                       particleXPositionArrayPtr,
                                       particleYPositionArrayPtr,
                                       particleZPositionArrayPtr,
                                       particleXAccelerationArrayPtr,
                                       particleYAccelerationArrayPtr,
                                       particleZAccelerationArrayPtr) => {
                    computeAccelerationsFn(
                        particleCount,
                        attractorCount,
                        attractorTypesPtr,
                        attractorXPositionArrayPtr,
                        attractorYPositionArrayPtr,
                        attractorZPositionArrayPtr,
                        attractorStrengthsPtr,
                        particleXPositionArrayPtr,
                        particleYPositionArrayPtr,
                        particleZPositionArrayPtr,
                        particleXAccelerationArrayPtr,
                        particleYAccelerationArrayPtr,
                        particleZAccelerationArrayPtr
                    )
                }
            } as ParticleMathModule
        }
    }

    private modules: Partial<Record<WasmModuleSpec['jsModule'], AnyWasmModule>> = {}

    $<T extends WasmModuleSpec>(spec: T): ModuleTypeFor<T> {
        const module = this.modules[spec.jsModule]
        if (!module) {
            throw new Error(`Attempting to retrieve module that has not been loaded yet: ${spec.jsModule}`)
        }
        return module as ModuleTypeFor<T>
    }

    private async load<T extends WasmModuleSpec>(spec: T): Promise<void> {
        if (this.modules[spec.jsModule]) return

        let scriptElement: HTMLScriptElement | null = null

        await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script')
            script.src = spec.url
            script.onload = () => resolve()
            script.onerror = reject
            scriptElement = script
            document.body.appendChild(script)
        })

        if (!scriptElement) {
            return Promise.reject(new Error(`Could not create a script element while loading module ${spec.jsModule} from ${spec.url}`))
        }

        const module = await ((window as any)[spec.jsModule])() as any

        const factory = this.factories[spec.jsModule]

        if (!factory) {
            return Promise.reject(new Error(`Could not find matching factory for module ${spec.jsModule}`))
        }

        let specializedModule: AnyWasmModule = factory(spec, module, scriptElement)

        // Use getters to avoid stale views on malloc
        const moduleBase = {
            get HEAP8() {
                return module.HEAP8
            },
            get HEAP16() {
                return module.HEAP16
            },
            get HEAP32() {
                return module.HEAP32
            },

            get HEAPU8() {
                return module.HEAPU8
            },
            get HEAPU16() {
                return module.HEAPU16
            },
            get HEAPU32() {
                return module.HEAPU32
            },

            get HEAPF32() {
                return module.HEAPF32
            },
            get HEAPF64() {
                return module.HEAPF64
            },

            malloc: module._malloc,
            free: module._free,
            realloc: module._realloc
        } as BaseWasmModule

        this.modules[spec.jsModule] = { ...moduleBase, ...specializedModule } as ModuleTypeFor<T>
    }

    async loadMissingModules(): Promise<void> {
        for (const specKey of Object.keys(WasmModuleSpecs) as Array<keyof typeof WasmModuleSpecs>) {
            const spec = WasmModuleSpecs[specKey]
            if (!this.modules[spec.jsModule]) {
                await this.load(spec)
            }
        }
        return Promise.resolve()
    }
}

let moduleLoader: WasmModuleLoader | null = null

export function getWasmLoaderInstance(): WasmModuleLoader {
    if (typeof window === "undefined") {
        throw new Error("The WASM module loader can only run in the browser")
    }

    if (!moduleLoader) {
        moduleLoader = new WasmModuleLoader()
    }

    return moduleLoader
}