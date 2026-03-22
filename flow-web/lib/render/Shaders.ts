/*
 * Copyright (c) 2026 Piotr Krzysztof Wyrwas [flow]
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export type ShaderSource = {
    vertexShader: string,
    fragmentShader: string
}

export async function loadShader(name: string): Promise<ShaderSource> {
    const vertSource = await fetch(`/glsl/${name}/${name}.vert.glsl`).then(result => result.text())
    const fragSource = await fetch(`/glsl/${name}/${name}.frag.glsl`).then(result => result.text())
    return {
        vertexShader: vertSource,
        fragmentShader: fragSource
    }
}