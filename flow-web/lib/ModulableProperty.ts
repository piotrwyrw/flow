/*
 * Copyright (c) 2026 Piotr Krzysztof Wyrwas [flow]
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export type ModulatorFunction<T> = (newValue: T) => void

export default class ModulableProperty<T> {
    private readonly onChange: ModulatorFunction<T>
    private current: T

    constructor(onChange: ModulatorFunction<T>, defaultValue: T) {
        this.onChange = onChange
        this.current = defaultValue
    }

    currentValue(): T {
        return this.current
    }

    set(newValue: T) {
        this.current = newValue
        this.onChange(this.current)
    }
}