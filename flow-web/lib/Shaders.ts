export type ShaderSource = {
    vertexShader: string,
    fragmentShader: string
}

export async function loadShader(name: string): Promise<ShaderSource> {
    const vertSource = await fetch(`/glsl/${name}.vert.glsl`).then(result => result.text())
    const fragSource = await fetch(`/glsl/${name}.frag.glsl`).then(result => result.text())
    return {
        vertexShader: vertSource,
        fragmentShader: fragSource
    }
}