/*
 * Copyright (c) 2026 Piotr Krzysztof Wyrwas [flow]
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export type LogCol = [string, number] | [string]

const pad = (s: string, width: number): string => s.padEnd(width)

export const debug = (...cols: LogCol[]) =>
    console.debug(cols.map(col => pad(col[0], col[1] || 0)).join(' '))