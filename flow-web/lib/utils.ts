/*
 * Copyright (c) 2026 Piotr Krzysztof Wyrwas [flow]
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import {type ClassValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"
import {toast} from "sonner";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function showToast(message: string) {
    toast(message, {
        position: 'top-right'
    })
}

export function showDetailedToast(title: string, message: string) {
    toast(title, {
        position: 'top-right',
        description: message
    })
}

export function randomNormalizedNumber(): number {
    return (Math.random() - 0.5) * 2
}