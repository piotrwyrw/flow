// Copyright (c) 2026 Piotr Krzysztof Wyrwas [flow]
// SPDX-License-Identifier: GPL-3.0-or-later

#include <math.h>
#include <wasm_simd128.h>
#include <part.h>
#include <vec.h>
#include <stdlib.h>
#include <stdio.h>

#define EPSILON 0.1f

void compute_acceleration(struct vec3f *acc_dst,
                          const struct vec3f *eval_pos,
                          const uint32_t attr_count,
                          const enum attractor_type *attr_types,
                          const float *attr_x_pos,
                          const float *attr_y_pos,
                          const float *attr_z_pos,
                          const float *attr_strength)
{
#ifdef DEBUG_MODE
    static int iteration_number = 0;
#endif

    struct vec3f accumulator = {.0f, .0f, .0f};
    struct vec3f tmp;

    for (uint32_t i = 0; i < attr_count; i++) {
        const float x = attr_x_pos[i];
        const float y = attr_y_pos[i];
        const float z = attr_z_pos[i];
        const float strength = attr_strength[i];
        const enum attractor_type type = attr_types[i];

#ifdef DEBUG_MODE
        if (iteration_number % 50000 == 0) {
            printf("Attractor %u: Strength: %f, Type: %d, Strength ptr: %p\n", i, strength, type, attr_strength);
        }
#endif

        vec3f_set(&tmp, x, y, z);
        vec3f_sub(&tmp, eval_pos);

        const float distance = vec3f_length_sq(&tmp) + EPSILON;

        float attractorStrength = 0.0f;

        switch (type) {
            case ATTRACTOR_CONSTANT:
                attractorStrength = strength;
                break;
            case ATTRACTOR_LINEAR:
                attractorStrength = strength / sqrtf(distance);
                break;
            case ATTRACTOR_INVERSE_SQUARE:
                attractorStrength = strength / distance;
                break;
        }

        vec3f_resize(&tmp, attractorStrength);
        vec3f_add(&accumulator, &tmp);
    }

#ifdef DEBUG_MODE
    iteration_number++;
#endif

    vec3f_copy(&accumulator, acc_dst);
}

void compute_accelerations(const uint32_t particle_count,
                           const uint32_t attr_count,
                           const enum attractor_type *attr_types,
                           const float *attr_x_pos,
                           const float *attr_y_pos,
                           const float *attr_z_pos,
                           const float *attr_strength,
                           const float *p_x_pos,
                           const float *p_y_pos,
                           const float *p_z_pos,
                           float *p_x_accel,
                           float *p_y_accel,
                           float *p_z_accel)
{
    // Calculate acceleration for each particle
    for (uint32_t i = 0; i < particle_count; i++) {
        const float x = p_x_pos[i];
        const float y = p_y_pos[i];
        const float z = p_z_pos[i];

        struct vec3f acceleration;
        struct vec3f position;

        vec3f_set(&position, x, y, z);
        compute_acceleration(&acceleration,
                             &position,
                             attr_count,
                             attr_types,
                             attr_x_pos,
                             attr_y_pos,
                             attr_z_pos,
                             attr_strength);

        p_x_accel[i] = acceleration.x;
        p_y_accel[i] = acceleration.y;
        p_z_accel[i] = acceleration.z;
    }
}


void integrate_motions(const uint32_t particle_count,
                       const float dt,
                       float *p_x_pos,
                       float *p_y_pos,
                       float *p_z_pos,
                       float *p_x_vel,
                       float *p_y_vel,
                       float *p_z_vel,
                       const float *p_x_accel,
                       const float *p_y_accel,
                       const float *p_z_accel)
{
    // Put dt on all 4 SIMD lanes
    const v128_t dt_vec = wasm_f32x4_splat(dt);

    uint32_t i = 0;

    for (; i < particle_count; i += 4) {
        // Particle positions
        v128_t px = wasm_v128_load(&p_x_pos[i]);
        v128_t py = wasm_v128_load(&p_y_pos[i]);
        v128_t pz = wasm_v128_load(&p_z_pos[i]);

        // Particle velocities
        v128_t vx = wasm_v128_load(&p_x_vel[i]);
        v128_t vy = wasm_v128_load(&p_y_vel[i]);
        v128_t vz = wasm_v128_load(&p_z_vel[i]);

        // Particle accelerations
        const v128_t ax = wasm_v128_load(&p_x_accel[i]);
        const v128_t ay = wasm_v128_load(&p_y_accel[i]);
        const v128_t az = wasm_v128_load(&p_z_accel[i]);

        // v = v + a * dt
        vx = wasm_f32x4_add(vx, wasm_f32x4_mul(ax, dt_vec));
        vy = wasm_f32x4_add(vy, wasm_f32x4_mul(ay, dt_vec));
        vz = wasm_f32x4_add(vz, wasm_f32x4_mul(az, dt_vec));

        // p = p + v * dt
        px = wasm_f32x4_add(px, wasm_f32x4_mul(vx, dt_vec));
        py = wasm_f32x4_add(py, wasm_f32x4_mul(vy, dt_vec));
        pz = wasm_f32x4_add(pz, wasm_f32x4_mul(vz, dt_vec));

        wasm_v128_store(&p_x_vel[i], vx);
        wasm_v128_store(&p_y_vel[i], vy);
        wasm_v128_store(&p_z_vel[i], vz);

        wasm_v128_store(&p_x_pos[i], px);
        wasm_v128_store(&p_y_pos[i], py);
        wasm_v128_store(&p_z_pos[i], pz);
    }

    // Handle remaining values that did not fit into the SIMD lanes
    for (; i < particle_count; i++) {
        p_x_vel[i] += p_x_accel[i] * dt;
        p_y_vel[i] += p_y_accel[i] * dt;
        p_z_vel[i] += p_z_accel[i] * dt;

        p_x_pos[i] += p_x_vel[i] * dt;
        p_y_pos[i] += p_y_vel[i] * dt;
        p_z_pos[i] += p_z_vel[i] * dt;
    }
}

void integrate_motions_n(const uint32_t int_steps,
                         const uint32_t particle_count,
                         const float dt,
                         float *p_x_pos,
                         float *p_y_pos,
                         float *p_z_pos,
                         float *p_x_vel,
                         float *p_y_vel,
                         float *p_z_vel,
                         const float *p_x_accel,
                         const float *p_y_accel,
                         const float *p_z_accel)
{
    for (uint32_t i = 0; i < int_steps; i++) {
        integrate_motions(particle_count, dt, p_x_pos, p_y_pos, p_z_pos, p_x_vel, p_y_vel, p_z_vel, p_x_accel,
                          p_y_accel, p_z_accel);
    }
}