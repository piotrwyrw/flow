/*
 * Copyright (c) 2026 Piotr Krzysztof Wyrwas [flow]
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import {PMM} from "@/lib/WasmModuleLoader";
import {debug} from "@/lib/Logging";

type MemoryPtrComputeValueFn<ValueType> = (ptr: number, size: number) => ValueType | null

export class MemPtr<ValueType> {
    public static readonly U8_SIZE = 1
    public static readonly NULL = 0x0

    public bufferSize: number = 0

    public computeValue: MemoryPtrComputeValueFn<ValueType>

    private address: number
    private module: PMM

    private readonly debugIdentifier: string

    constructor(module: PMM, identifier: string = 'Unnamed Buffer') {
        this.computeValue = () => null
        this.address = MemPtr.NULL
        this.module = module
        this.debugIdentifier = identifier
    }

    value(): ValueType | null {
        return this.computeValue(this.address, this.bufferSize)
    }

    /**
     * Either malloc() or realloc() the requested size and create the value object
     * @param size New size
     * @param create Lambda to create a {@link ValueType} object given the new memory address
     */
    alloc(size: number, create: MemoryPtrComputeValueFn<ValueType>) {
        let ptr: number
        if (this.address === MemPtr.NULL) {
            ptr = this.module.malloc(size)
            debug(["malloc()'d buffer"], [`0x${ptr.toString(16)}`, 10],
                ["Previously"], [this.bufferSize.toString(), 7],
                ["bytes, Now"], [size.toString(), 7], [`bytes (${this.debugIdentifier})`])
        } else {
            ptr = this.module.realloc(this.address, size)
            debug(["realloc()'d buffer"], [`0x${ptr.toString(16)}`, 10],
                ["Previously"], [this.bufferSize.toString(), 7],
                ["bytes, Now"], [size.toString(), 7], [`bytes (${this.debugIdentifier})`])
        }
        this.address = ptr
        this.bufferSize = size
        this.computeValue = create
    }

    grow(delta: number, create: MemoryPtrComputeValueFn<ValueType>) {
        const newSize = this.bufferSize + delta
        this.alloc(newSize, create)
    }

    free() {
        if (this.address === MemPtr.NULL)
            return;

        this.module.free(this.address)
        this.address = MemPtr.NULL
        this.computeValue = () => null
    }

    memoryAddress(): number {
        return this.address
    }
}

export type F32BuffPtr = MemPtr<Float32Array>
export type U8BuffPtr = MemPtr<Uint8Array>

export class Vec3Buffer {
    public static readonly F32_SIZE = 32 / 8

    module: PMM

    size!: number

    xPtr: F32BuffPtr
    yPtr: F32BuffPtr
    zPtr: F32BuffPtr

    debugIdentifier: string

    constructor(initialSize: number, module: PMM, identifier: string = "UnknownVec3") {
        this.module = module
        this.xPtr = new MemPtr(module, `${identifier}.X`);
        this.yPtr = new MemPtr(module, `${identifier}.Y`);
        this.zPtr = new MemPtr(module, `${identifier}.Z`);
        this.debugIdentifier = identifier
        this.resize(initialSize)
        this.initialize()
    }

    resize(newSize: number): this {
        if (newSize < 0) {
            throw new Error(`Vec3 (${this.debugIdentifier}) buffer size must be a positive integer, got ${newSize}`)
        }

        this.size = newSize

        if (newSize === 0) {
            this.free()
            return this
        }

        this.alloc()
        return this
    }

    initialize() {
        this.xPtr.value()?.fill(0)
        this.yPtr.value()?.fill(0)
        this.zPtr.value()?.fill(0)
    }

    grow(): this {
        this.resize(this.size + 1)
        return this
    }

    readonly xArrayAddr = () => this.xPtr.memoryAddress()
    readonly yArrayAddr = () => this.yPtr.memoryAddress()
    readonly zArrayAddr = () => this.zPtr.memoryAddress()

    private createFloatArray(ptr: number): Float32Array {
        return this.module.HEAPF32.subarray(ptr / Vec3Buffer.F32_SIZE, ptr / Vec3Buffer.F32_SIZE + this.size)
    }

    private free() {
        this.xPtr.free()
        this.yPtr.free()
        this.zPtr.free()
    }

    private alloc() {
        const create = this.createFloatArray.bind(this)
        this.xPtr.alloc(Vec3Buffer.F32_SIZE * this.size, create)
        this.yPtr.alloc(Vec3Buffer.F32_SIZE * this.size, create)
        this.zPtr.alloc(Vec3Buffer.F32_SIZE * this.size, create)
    }
}