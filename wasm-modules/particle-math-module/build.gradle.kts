/*
 * Copyright (c) 2026 Piotr Krzysztof Wyrwas [flow]
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

object BuildProperties {
    const val CC = "/Users/piotrwyrw/emscripten/emsdk/upstream/emscripten/emcc"
    const val INCLUDE_DIR = "include"
    const val SRC_DIR = "src"
    const val OUTPUT_FILE = "../flow-web/public/wasm/particle_math.js"
    const val C_EXTENSION = "c"
    const val MODULE_NAME = "ParticleMathModule"

    // Debug mode disables optimizations and enables runtime heap checks
    const val DEBUG_MODE = false

    val exportedFunctions = arrayOf(
        "integrate_motions_n", "compute_accelerations", "malloc",
        "free", "realloc", "memalign", "memcpy"
    )

    val exportedRuntimeFunctions = arrayOf(
        "ccall", "cwrap", "HEAP8", "HEAP16", "HEAP32",
        "HEAPU8", "HEAPU16", "HEAPU32", "HEAPF32", "HEAPF64"
    )

    fun Array<String>.symbolJsArray() = "[${map { "_$it" }.joinToString(separator = ", ")}]"
    fun Array<String>.jsArray() = "[${joinToString(separator = ", ")}]"

    val compilerFlags = arrayOf(
        if (DEBUG_MODE) "-O0" else "-O3",
        "-I$INCLUDE_DIR",
        "-msimd128",
        "-sWASM=1",
        "-sMODULARIZE=1",
        "-sEXPORT_NAME=\"$MODULE_NAME\"",
        if (DEBUG_MODE) "-sSAFE_HEAP=1" else "-sSAFE_HEAP=0",
        "-sEXPORTED_FUNCTIONS=${exportedFunctions.symbolJsArray()}",
        "-sEXPORTED_RUNTIME_METHODS=${exportedRuntimeFunctions.jsArray()}",
        if (DEBUG_MODE) "-DDEBUG_MODE" else "-UDEBUG_MODE"
    )
}

plugins {
    base
}

tasks.register<Exec>("buildModule") {
    description = "Build Particle Math WASM Module"
    group = "WASM"

    workingDir(project.projectDir)

    val srcDirFile = File(project.projectDir, BuildProperties.SRC_DIR)

    if (!srcDirFile.exists())
        error("Source directory does not exist: ${srcDirFile.absolutePath}")

    if (!srcDirFile.isDirectory)
        error("Source directory is not a directory: ${srcDirFile.absolutePath}")

    val sourceFiles = srcDirFile.listFiles()
        .filter { it.extension == BuildProperties.C_EXTENSION }
        .map { it.absolutePath }
        .toTypedArray()

    val outputFile = rootProject.file(BuildProperties.OUTPUT_FILE)
    val outputPath = outputFile.absolutePath

    if (outputFile.exists())
        outputFile.delete()
    else
        outputFile.parentFile.mkdirs()

    val buildCommand = arrayOf<String>(
        BuildProperties.CC,
        *sourceFiles,
        *(BuildProperties.compilerFlags),
        "-o", outputPath
    )

    logger.lifecycle("Build command: ${buildCommand.joinToString(separator = " ")}")

    if (BuildProperties.DEBUG_MODE) logger.lifecycle("WARNING: Debug mode is enabled! This will impact performance. Make sure to disable this option for prod.")

    val task = commandLine(*buildCommand)
    task.standardOutput = System.out
    task.errorOutput = System.err

    doLast {
        logger.lifecycle("Emitting outputs to: ${outputFile.absolutePath}")
        logger.lifecycle("==== Done building ${BuildProperties.MODULE_NAME} ====")
    }
}