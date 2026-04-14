/*
 * Copyright (c) 2026 Piotr Krzysztof Wyrwas [flow]
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import SimulationScript from "@/lib/scripting/SimulationScript";
import {AnyValue, NumberValue, UnitValue, VectorValue} from "@/deps/flow-script/src/runtime/values";
import {Runtime} from "@/deps/flow-script/src";
import {builtinFunction, DefaultBuiltinFunctions} from "@/deps/flow-script/src/runtime/builtin-function";
import {Log, LogLevel, LogSubscriber} from "@/deps/flow-script/src/log/logger";

export class SimulationScriptError {
    readonly message: string

    constructor(message: string) {
        this.message = message;
    }
}

export type SimulationScriptManagerErrorCallback = (message: string) => void

export type SimulationScriptSetAttractorLocationCallback = (index: number, x: number, y: number, z: number) => void
export type SimulationScriptSetAttractorStrengthCallback = (index: number, strength: number) => void
export type SimulationScriptGetAttractorLocationCallback = (index: number) => [number, number, number] | undefined
export type SimulationScriptGetAttractorStrengthCallback = (index: number) => number | undefined

export type SimulationScriptManagerCallbacks = {
    error: SimulationScriptManagerErrorCallback,
    setAttractorLocation: SimulationScriptSetAttractorLocationCallback,
    setAttractorStrength: SimulationScriptSetAttractorStrengthCallback,
    getAttractorLocation: SimulationScriptGetAttractorLocationCallback,
    getAttractorStrength: SimulationScriptGetAttractorStrengthCallback
}

export default class SimulationScriptManager {
    private readonly runtime: Runtime
    private readonly errorCallback: SimulationScriptManagerErrorCallback

    private readonly setAttractorLocationCallback: SimulationScriptSetAttractorLocationCallback
    private readonly setAttractorStrengthCallback: SimulationScriptSetAttractorStrengthCallback
    private readonly getAttractorLocationCallback: SimulationScriptGetAttractorLocationCallback
    private readonly getAttractorStrengthCallback: SimulationScriptGetAttractorStrengthCallback

    private readonly scripts: SimulationScript[]

    // TODO Make this script-scoped
    private keyValueStore: Map<string, AnyValue>

    constructor(callbacks: SimulationScriptManagerCallbacks) {
        this.errorCallback = callbacks.error
        this.setAttractorLocationCallback = callbacks.setAttractorLocation
        this.setAttractorStrengthCallback = callbacks.setAttractorStrength
        this.getAttractorLocationCallback = callbacks.getAttractorLocation
        this.getAttractorStrengthCallback = callbacks.getAttractorStrength

        this.scripts = []
        this.keyValueStore = new Map<string, AnyValue>()

        this.runtime = new Runtime([
            ...DefaultBuiltinFunctions,
            builtinFunction("persist", ["key", "value"], (key: AnyValue, value: AnyValue): AnyValue => {
                if (key.type !== "String") {
                    throw new SimulationScriptError(`Value passed to the "key" parameter of function "persist" is of type ${key.type}, but a String was expected.`)
                }

                this.keyValueStore.set(key.value, value)
                return value
            }),
            builtinFunction("retrieve", ["key"], (key: AnyValue): AnyValue => {
                if (key.type !== "String") {
                    throw new SimulationScriptError(`Value passed to the "key" parameter of function "retrieve" is of type ${key.type}, but a String was expected.`)
                }

                return this.keyValueStore.get(key.value) ?? {type: "Unit"}
            }),
            builtinFunction("setAttractorLocation", ["index", "loc"], (index: AnyValue, loc: AnyValue): AnyValue => {
                if (index.type !== "Number") {
                    throw new SimulationScriptError(`Value passed to the "index" parameter of function "setAttractorLocation" is of type ${index.type}, but a Number was expected.`)
                }

                if (loc.type !== "Vector") {
                    throw new SimulationScriptError(`Value passed to the "loc" parameter of function "setAttractorLocation" is of type ${loc.type}, but a Vector was expected.`)
                }

                this.setAttractorLocationCallback(index.value, loc.value.x, loc.value.y, loc.value.z)

                return loc
            }),
            builtinFunction("getAttractorLocation", ["index"], (index: AnyValue): AnyValue => {
                if (index.type !== "Number") {
                    throw new SimulationScriptError(`Value passed to the "index" parameter of function "getAttractorLocation" is of type ${index.type}, but a Number was expected.`)
                }

                const loc = this.getAttractorLocationCallback(index.value)
                return loc ? ({
                    type: "Vector",
                    value: {x: loc[0], y: loc[1], z: loc[2]}
                } as VectorValue) : {type: "Unit"} as UnitValue
            }),
            builtinFunction("setAttractorStrength", ["index", "strength"], (index: AnyValue, strength: AnyValue): AnyValue => {
                if (index.type !== "Number") {
                    throw new SimulationScriptError(`Value passed to the "index" parameter of function "setAttractorStrength" is of type ${index.type}, but a Number was expected.`)
                }

                if (strength.type !== "Number") {
                    throw new SimulationScriptError(`Value passed to the "strength" parameter of function "setAttractorStrength" is of type ${strength.type}, but a Number was expected.`)
                }

                this.setAttractorStrengthCallback(index.value, strength.value)

                return strength
            }),
            builtinFunction("getAttractorStrength", ["index"], (index: AnyValue): AnyValue => {
                if (index.type !== "Number") {
                    throw new SimulationScriptError(`Value passed to the "index" parameter of function "getAttractorStrength" is of type ${index.type}, but a Number was expected.`)
                }

                const strength = this.getAttractorStrengthCallback(index.value)
                return strength ?
                    ({type: "Number", value: strength} as NumberValue) :
                    {type: "Unit"} as UnitValue
            }),
        ])
    }

    getScripts(): readonly SimulationScript[] {
        return this.scripts
    }

    runAllScripts() {
        this.scripts.forEach(script => {
            try {
                script.run()
            } catch (e) {
                script.disable()
                if (e instanceof SimulationScriptError) return this.errorCallback(e.message)
                throw e
            }
        })
    }

    addScript(name: string, source: string, onSuccess: () => void, onError: () => void) {
        const src = source.trim()

        // If the source is empty, just push an empty AST
        if (src.length === 0) {
            this.scripts.push(new SimulationScript(this.runtime, src, name, false))
            return
        }

        const script = new SimulationScript(this.runtime, src, name, false)
        this.scripts.push(script)
        script.parse(onError, onSuccess)
    }

}