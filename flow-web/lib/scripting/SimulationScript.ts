/*
 * Copyright (c) 2026 Piotr Krzysztof Wyrwas [flow]
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import {AST, Parser, Runtime, TokenStream} from "@/deps/flow-script/src";
import {assert} from "@/deps/flow-script/src/utils";
import {showDetailedToast} from "@/lib/utils";

export default class SimulationScript {
    private program?: AST.Program
    private readonly runtime: Runtime

    private source: string

    readonly name: string
    private active: boolean

    constructor(runtime: Runtime, source: string, name: string, active: boolean) {
        this.runtime = runtime
        this.source = source
        this.name = name
        this.active = active
    }

    getSource(): string {
        return this.source
    }

    parseWithNewSource(source: string) {
        this.source = source.trim()
        this.parse()
    }

    parse(onError?: () => void, onSuccess?: () => void) {
        TokenStream.fromResolvedSource({kind: "string", sourceString: this.source})
            .then(stream => {
                assert(!!stream)

                const parser = new Parser(stream)
                const program = parser.parse()
                if (!parser.ok()) {
                    this.disable()
                    if (onError) {
                        onError()
                    } else showDetailedToast("Parsing Error", `Could not parse script ${this.name}`);
                    return
                }

                this.program = program
                console.log(program)

                if (onSuccess) {
                    onSuccess()
                } else showDetailedToast("Script Parsed", `Script ${this.name} parsed successfully`);
            })
    }

    isActive(): boolean {
        return this.active
    }

    enable() {
        this.active = true
    }

    disable() {
        this.active = false
    }

    run() {
        if (!this.isActive())
            return

        if (!this.program) {
            this.disable()
            return
        }

        this.runtime.interpret(this.program)
    }

}