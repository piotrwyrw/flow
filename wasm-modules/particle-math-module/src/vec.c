// Copyright (c) 2026 Piotr Krzysztof Wyrwas [flow]
// SPDX-License-Identifier: GPL-3.0-or-later

#include <math.h>
#include <vec.h>
#include <__stddef_null.h>

inline struct vec3f vec(const float x, const float y, const float z)
{
    return (struct vec3f){.x = x, .y = y, .z = z};
}

inline struct vec3f vec3(const float f)
{
    return vec(f, f, f);
}

inline void vec3f_init(struct vec3f *vec)
{
    vec->x = 0.0f;
    vec->y = 0.0f;
    vec->z = 0.0f;
}

inline void vec3f_set(struct vec3f *vec, const float x, const float y, const float z)
{
    vec->x = x;
    vec->y = y;
    vec->z = z;
}

inline void vec3f_normalize(struct vec3f *vec)
{
    const float length_sq = vec3f_length_sq(vec);
    if (length_sq == 0.0f) {
        return;
    }
    vec3f_div(vec, sqrtf(length_sq));
}

inline void vec3f_div(struct vec3f *vec, const float f)
{
    vec->x /= f;
    vec->y /= f;
    vec->z /= f;
}

inline void vec3f_mul(struct vec3f *vec, const float f)
{
    vec->x *= f;
    vec->y *= f;
    vec->z *= f;
}

inline void vec3f_resize(struct vec3f *vec, const float length)
{
    vec3f_normalize(vec);
    vec3f_mul(vec, length);
}

inline float vec3f_length_sq(const struct vec3f *vec)
{
    return vec->x * vec->x + vec->y * vec->y + vec->z * vec->z;
}

inline float vec3f_length(const struct vec3f *vec)
{
    return sqrtf(vec3f_length_sq(vec));
}

inline void vec3f_copy(const struct vec3f *src, struct vec3f *dst)
{
    dst->x = src->x;
    dst->y = src->y;
    dst->z = src->z;
}

inline void vec3f_add(struct vec3f *vec, const struct vec3f *other)
{
    vec->x += other->x;
    vec->y += other->y;
    vec->z += other->z;
}

inline void vec3f_sub(struct vec3f *vec, const struct vec3f *other)
{
    vec->x -= other->x;
    vec->y -= other->y;
    vec->z -= other->z;
}

inline float vec3f_distance(struct vec3f *a, struct vec3f *b)
{
    struct vec3f v;
    vec3f_copy(a, &v);
    vec3f_sub(&v, b);
    return vec3f_length(&v);
}

inline float vec3f_distance_sq(struct vec3f *a, struct vec3f *b)
{
    struct vec3f v;
    vec3f_copy(&v, a);
    vec3f_sub(&v, b);
    return vec3f_length_sq(&v);
}