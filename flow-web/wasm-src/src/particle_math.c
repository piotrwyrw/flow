// Copyright (c) 2026 Piotr Krzysztof Wyrwas [flow]
// SPDX-License-Identifier: GPL-3.0-or-later

#include <wasm_simd128.h>
#include <particle_math.h>

void integrate_motions(const unsigned int particle_count,
                       const float dt,
                       float *const pos,
                       float *const vel,
                       const float *const acc) {
    uint32_t i = 0;

    for (; i < particle_count - 4; i += 4) {
        v128_t p = wasm_v128_load(&pos[i]);
        v128_t v = wasm_v128_load(&vel[i]);
        const v128_t a = wasm_v128_load(&acc[i]);
        const v128_t dt_vec = wasm_f32x4_splat(dt);

        // v = v + a * dt
        v = wasm_f32x4_add(v, wasm_f32x4_mul(a, dt_vec));

        // p = p + v * dt
        p = wasm_f32x4_add(p, wasm_f32x4_mul(v, dt_vec));

        wasm_v128_store(&vel[i], v);
        wasm_v128_store(&pos[i], p);
    }

    for (; i < particle_count; i++) {
        vel[i] += acc[i] * dt;
        pos[i] += vel[i] * dt;
    }
}

void integrate_motions_n(const unsigned int particle_count, const unsigned int int_steps, const float dt,
                         float *const pos, float *const vel, const float *const acc) {
    for (uint32_t i = 0; i < 1; i++) {
        integrate_motions(particle_count, dt, pos, vel, acc);
    }
}