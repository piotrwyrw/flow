/*
 * Copyright (c) 2026 Piotr Krzysztof Wyrwas [flow]
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import {StreamLanguage, StringStream} from "@codemirror/language";

export namespace FlowLang {
    export const Keywords = new Set(["fn", "let", "if", "else", "return", "while", "for", "is"])
    export const Types = new Set(["unit", "number", "string", "boolean", "vector", "function", "array"])

    export const Language = StreamLanguage.define({
        startState: () => ({}),
        token(stream: StringStream): string | null {
            if (stream.match(/\d+/)) return "number"
            if (stream.match(/[+\-*\/=<>!()\[\];]+/)) return "operator"
            if (stream.match(/".*"/)) return "string"
            if (stream.match(/true/)) return "bool"
            if (stream.match(/false/)) return "bool"
            if (stream.match(/[a-zA-Z_]+/)) return Keywords.has(stream.current()) ?
                "keyword" : Types.has(stream.current()) ?
                    "typeName" : "variableName";

            stream.next()
            return null
        }
    })
}