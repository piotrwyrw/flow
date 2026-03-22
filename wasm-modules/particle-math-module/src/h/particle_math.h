// Copyright (c) 2026 Piotr Krzysztof Wyrwas [flow]
// SPDX-License-Identifier: GPL-3.0-or-later

#ifndef FLOW_MATH_H
#define FLOW_MATH_H

enum AttractorType {
    ATTRACTOR_CONSTANT = 0,
    ATTRACTOR_LINEAR = 1,
    ATTRACTOR_INVERSE_SQUARE = 2
};

/**
 * Update the accelerations of the particles with the attractors
 * @param p_count Number of particles in the system
 * @param attr_count Number of attractors in the system
 * @param attr_pos Attractor position array - [X, Y, Z] for each attractor
 * @param attr_strength Attractor strength array - [X, Y, Z] for each attractor
 * @param p_acc Particle acceleration array to modify - [X, Y, Z] for each particle
 */
void compute_accelerations(unsigned int p_count, unsigned int attr_count, float *attr_pos, float *attr_strength,
                           float *p_acc);

/**
 * Integrate the motions of all particles, such that
 * vel = ∫ acc dt
 * pos = ∫ vel dt
 * @param particle_count The number of particles present in the particle system
 * @param dt Motion integration timestep
 * @param pos Position array - [X, Y, Z] for each particle
 * @param vel Velocity array - [X, Y, Z] for each particle
 * @param acc Acceleration array - [X, Y, Z] for each particle
 */
void integrate_motions(unsigned int particle_count, float dt, float *pos, float *vel, const float *acc);

/**
 * Run `n` motion integration steps
 * @param int_steps Number of integration steps to compute
 * @see integrate_motions
 */
void integrate_motions_n(unsigned int particle_count, unsigned int int_steps, float dt, float *pos, float *vel,
                         const float *acc);

#endif