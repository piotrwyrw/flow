// Copyright (c) 2026 Piotr Krzysztof Wyrwas [flow]
// SPDX-License-Identifier: GPL-3.0-or-later

#ifndef FLOW_MATH_H
#define FLOW_MATH_H

enum AttractorType {
    ATTRACTOR_CONSTANT = 0,
    ATTRACTOR_LINEAR = 1,
    ATTRACTOR_INVERSE_SQUARE = 2
};

void integrate_motions(unsigned int particle_count, float dt, float *pos, float *vel, const float *acc);

void integrate_motions_n(unsigned int particle_count, unsigned int int_steps, float dt,
                         float *pos, float *vel, const float *acc);

#endif