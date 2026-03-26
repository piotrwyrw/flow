// Copyright (c) 2026 Piotr Krzysztof Wyrwas [flow]
// SPDX-License-Identifier: GPL-3.0-or-later

// ReSharper disable CppDoxygenUndocumentedParameter

#ifndef FLOW_MATH_H
#define FLOW_MATH_H

#include <inttypes.h>
#include <vec.h>

enum attractor_type : uint8_t {
    ATTRACTOR_CONSTANT       = 0,
    ATTRACTOR_LINEAR         = 1,
    ATTRACTOR_INVERSE_SQUARE = 2
};

/**
 * Compute the acceleration at a given position
 * @param acc_dst Destination vector for the computed acceleration
 * @param eval_pos Position where to compute the acceleration at (Usually a particle position)
 * @param attr_count Number of attractors in the system
 * @param attr_types Attractor type array - one for each attractor
 * @param attr_x_pos Attractor position array (X component)
 * @param attr_y_pos Attractor position array (Y component)
 * @param attr_z_pos Attractor position array (Z component)
 * @param attr_strength Attractor strength array - one for each attractor
 */
void compute_acceleration(struct vec3f *acc_dst,
                          const struct vec3f *eval_pos,
                          uint32_t attr_count,
                          const enum attractor_type *attr_types,
                          const float *attr_x_pos,
                          const float *attr_y_pos,
                          const float *attr_z_pos,
                          const float *attr_strength);

/**
 * Update the accelerations of the particles with the attractors
 * @param particle_count Number of particles in the system
 * @param attr_count Number of attractors in the system
 * @param attr_types Attractor type array - one for each attractor
 * @param attr_x_pos Attractor position array (X Component)
 * @param attr_y_pos Attractor position array (Y Component)
 * @param attr_z_pos Attractor position array (Z Component)
 * @param attr_strength Attractor strength array - [X, Y, Z] for each attractor
 * @param p_x_pos Particle position array (X component)
 * @param p_y_pos Particle position array (Y component)
 * @param p_z_pos Particle position array (Z component)
 * @param p_x_accel Particle acceleration array (X component)
 * @param p_y_accel Particle acceleration array (Y component)
 * @param p_z_accel Particle acceleration array (Z component)
 */
void compute_accelerations(uint32_t particle_count,
                           uint32_t attr_count,
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
                           float *p_z_accel);

/**
 * Integrate the motions of all particles, such that
 * vel = ∫ acc dt
 * pos = ∫ vel dt
 * @param particle_count The number of particles present in the particle system
 * @param dt Motion integration timestep
 * @param p_x_pos Particle position array (X component)
 * @param p_y_pos Particle position array (Y component)
 * @param p_z_pos Particle position array (Z component)
 * @param p_x_vel Particle velocity array (X component)
 * @param p_y_vel Particle velocity array (Y component)
 * @param p_z_vel Particle velocity array (Z component)
 * @param p_x_accel Particle acceleration array (X component)
 * @param p_y_accel Particle acceleration array (Y component)
 * @param p_z_accel Particle acceleration array (Z component)
 */
void integrate_motions(uint32_t particle_count,
                       float dt,
                       float *p_x_pos,
                       float *p_y_pos,
                       float *p_z_pos,
                       float *p_x_vel,
                       float *p_y_vel,
                       float *p_z_vel,
                       const float *p_x_accel,
                       const float *p_y_accel,
                       const float *p_z_accel);

/**
 * Run `n` motion integration steps
 * @param int_steps Number of integration steps to compute
 * @see integrate_motions
 */
void integrate_motions_n(uint32_t int_steps,
                         uint32_t particle_count,
                         float dt,
                         float *p_x_pos,
                         float *p_y_pos,
                         float *p_z_pos,
                         float *p_x_vel,
                         float *p_y_vel,
                         float *p_z_vel,
                         const float *p_x_accel,
                         const float *p_y_accel,
                         const float *p_z_accel);

#endif