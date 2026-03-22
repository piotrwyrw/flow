/*
 * Copyright (c) 2026 Piotr Krzysztof Wyrwas [flow]
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

plugins {
    base
}

tasks.register("allModules") {
    group = "WASM"
    description = "Build all WASM modules"

    val buildTasks = subprojects.map { it.tasks.named("buildModule") }
    dependsOn(buildTasks)

    doLast {
        logger.lifecycle("==== Done building ${buildTasks.size} module(s) ====")
    }
}