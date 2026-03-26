/*
 * Copyright (c) 2026 Piotr Krzysztof Wyrwas [flow]
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import ParticleSystem from "@/lib/simulation/ParticleSystem";
import {showDetailedToast} from "@/lib/utils";
import Attractor, {AttractorMode} from "@/lib/simulation/Attractor";
import {Vector3} from "three";

type Handler = {
    paramCount: number,
    fn: (cmd: string[]) => void
}

export default class CommandProcessor {
    system: ParticleSystem
    handlers = new Map<string, Handler>([
        ['reset', {
            paramCount: 0,
            fn: () => {
                this.system.buffer.resetParticles()
                showDetailedToast("Reset", "Particle System Reset")
            }
        }],
        ["attractor", {
            paramCount: 3,
            fn: (cmd) => {
                const x = parseInt(cmd[1])
                const y = parseInt(cmd[2])
                const z = parseInt(cmd[3])
                this.system.addAttractor(new Attractor(
                    new Vector3(x, y, z),
                    300,
                    AttractorMode.CONSTANT
                ))
            }
        }]
    ])

    constructor(system: ParticleSystem) {
        this.system = system
    }

    handle(command: string) {
        const cmd = command.split(new RegExp("\\s+"))

        if (cmd.length == 0) {
            showDetailedToast("Invalid Command", "This command is invalid")
            return
        }

        const handler = this.handlers.get(cmd[0])
        if (!handler) {
            showDetailedToast("Invalid Command", "This command does not exist")
            return
        }

        const paramCount = cmd.length - 1
        if (handler.paramCount != paramCount) {
            showDetailedToast("Invalid Form", `Expected ${handler.paramCount} params, got ${paramCount}`)
            return
        }

        handler.fn(cmd)
    }

}