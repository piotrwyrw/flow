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
    HEAPF64: Float64Array
}

export type ParticleMathModule = BaseWasmModule<typeof WasmModuleSpecs.PARTICLE_MATH_MODULE> & {
    integrateParticleMotion: (particleCount: number, integrationSteps: number, dt: number, posPtr: number, velPtr: number, accelPtr: number) => void
}

export type AnyWasmModule = ParticleMathModule

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
            const functionIdentifier = "integrate_motions_n"

            const integrateFn = module.cwrap(functionIdentifier, null, ['number', 'number', 'number', 'number', 'number', 'number'])

            if (!integrateFn) {
                throw new Error(`Could not retrieve function "${functionIdentifier}" while loading module ${spec.jsModule} from ${spec.url}`)
            }

            return {
                type: WasmModuleSpecs.PARTICLE_MATH_MODULE.jsModule,
                scriptElement: script,
                integrateParticleMotion: (particleCount, integrationSteps, dt, posPtr, velPtr, accelPtr) => {
                    integrateFn(particleCount, integrationSteps, dt, posPtr, velPtr, accelPtr)
                }
            } as ParticleMathModule
        }
    }

    private modules: Partial<Record<WasmModuleSpec['jsModule'], AnyWasmModule>> = {}

    private hasLoadedAllModules: boolean = false

    $<T extends WasmModuleSpec>(spec: T): ModuleTypeFor<T> {
        const module = this.modules[spec.jsModule]
        if (!module) {
            throw new Error(`Attempting to retrieve module that has not been loaded yet: ${spec.jsModule}`)
        }
        return module as ModuleTypeFor<T>
    }

    private async load<T extends WasmModuleSpec>(spec: T): Promise<ModuleTypeFor<T>> {
        if (this.modules[spec.jsModule]) return this.modules[spec.jsModule]! as ModuleTypeFor<T>

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

        let wasmModule: AnyWasmModule = factory(spec, module, scriptElement)

        wasmModule.malloc = module._malloc
        wasmModule.free = module._free

        wasmModule.HEAP8 = module.HEAP8
        wasmModule.HEAP16 = module.HEAP16
        wasmModule.HEAP32 = module.HEAP32

        wasmModule.HEAPU8 = module.HEAPU8
        wasmModule.HEAPU16 = module.HEAPU16
        wasmModule.HEAPU32 = module.HEAPU32

        wasmModule.HEAPF32 = module.HEAPF32
        wasmModule.HEAPF64 = module.HEAPF64

        this.modules[spec.jsModule] = wasmModule
        return wasmModule as ModuleTypeFor<T>
    }

    async loadMissingModules() {
        this.hasLoadedAllModules = false
        for (const specKey of Object.keys(WasmModuleSpecs) as Array<keyof typeof WasmModuleSpecs>) {
            const spec = WasmModuleSpecs[specKey]
            if (!this.modules[spec.jsModule]) {
                await this.load(spec)
            }
        }
        this.hasLoadedAllModules = true
        return Promise.resolve()
    }

    getLoadedModules(): AnyWasmModule[] {
        return Object.values(this.modules)
    }

    areModulesLoaded(): boolean {
        return this.hasLoadedAllModules
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