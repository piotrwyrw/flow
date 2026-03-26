// Copyright (c) 2026 Piotr Krzysztof Wyrwas [flow]
// SPDX-License-Identifier: GPL-3.0-or-later

//
// Created by Piotr Krzysztof Wyrwas on 22.03.26.
//

#ifndef FLOW_VECMAT_H
#define FLOW_VECMAT_H

struct vec3f {
    float x, y, z;
};

struct vec3f vec(float x, float y, float z);

struct vec3f vec3(float f);

void vec3f_init(struct vec3f *vec);

void vec3f_set(struct vec3f *vec, float x, float y, float z);

void vec3f_normalize(struct vec3f *vec);

void vec3f_div(struct vec3f *vec, float f);

void vec3f_mul(struct vec3f *vec, float f);

void vec3f_resize(struct vec3f *vec, float length);

float vec3f_length_sq(const struct vec3f *vec);

float vec3f_length(const struct vec3f *vec);

void vec3f_copy(const struct vec3f *src, struct vec3f *dst);

void vec3f_add(struct vec3f *vec, const struct vec3f *other);

void vec3f_sub(struct vec3f *vec, const struct vec3f *other);

float vec3f_distance(struct vec3f *a, struct vec3f *b);

float vec3f_distance_sq(struct vec3f *a, struct vec3f *b);

#endif //FLOW_VECMAT_H