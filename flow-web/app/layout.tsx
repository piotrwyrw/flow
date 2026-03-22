/*
 * Copyright (c) 2026 Piotr Krzysztof Wyrwas [flow]
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import {Figtree, Geist_Mono} from "next/font/google"

import "./globals.css"
import {ThemeProvider} from "@/components/theme-provider"
import {cn} from "@/lib/utils";
import {Toaster} from "@/components/ui/sonner";

const figtree = Figtree({subsets: ['latin'], variable: '--font-sans'})

const fontMono = Geist_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
})

export default function RootLayout({children}: Readonly<{ children: React.ReactNode }>) {
    return (<html lang="en" suppressHydrationWarning
                  className={cn("antialiased", fontMono.variable, "font-sans", figtree.variable)}>
    <body>
    <ThemeProvider>
        {children}
        <Toaster/>
    </ThemeProvider>
    </body>
    </html>)
}