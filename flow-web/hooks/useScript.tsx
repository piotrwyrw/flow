/*
 * Copyright (c) 2026 Piotr Krzysztof Wyrwas [flow]
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import {useEffect} from "react";

export default function useScript(url: string, then: (script: HTMLScriptElement) => void) {
    return useEffect(() => {
        const script = document.createElement('script')
        script.src = url
        script.async = true
        then(script)

        document.body.appendChild(script)
        return () => {
            document.body.removeChild(script)
        }
    }, []);
}