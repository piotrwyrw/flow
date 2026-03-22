/*
 * Copyright (c) 2026 Piotr Krzysztof Wyrwas [flow]
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import Attractor, {attractorModeDisplayName} from "@/lib/simulation/Attractor";
import {Item, ItemActions, ItemContent, ItemTitle} from "@/components/ui/item";
import {Button} from "@/components/ui/button";
import {IconTrash} from "@tabler/icons-react";
import React from "react";

export type AttractorListingProps = {
    attractors: Attractor[],
    onRemoveAttractor: (attractorIndex: number) => void
}

export default function AttractorListing({attractors, onRemoveAttractor}: AttractorListingProps) {
    return (
        <div className="flex flex-col gap-2">
            {attractors.map(((attr, index) => (
                <Item variant="outline" key={index}>
                    <ItemContent className="gap-1">
                        <ItemTitle>Attractor {index + 1}</ItemTitle>
                        <div className="grid grid-cols-3">
                            <span className="col-span-2">Mode</span>
                            <span
                                className="col-span-1 text-muted-foreground">{attractorModeDisplayName(attr.mode)}</span>
                        </div>
                        <div className="grid grid-cols-3">
                            <span className="col-span-2">Strength</span>
                            <span
                                className="col-span-1 text-muted-foreground">{attr.strength}</span>
                        </div>
                        <div className="grid grid-cols-3 whitespace-nowrap gap-2">
                            <div className="overflow-hidden text-ellipsis">
                                <span>X</span>
                                <span className="text-muted-foreground">{attr.position.x}</span>
                            </div>
                            <div className="overflow-hidden text-ellipsis">
                                <span>Y</span>
                                <span className="text-muted-foreground">{attr.position.y}</span>
                            </div>
                            <div className="overflow-hidden text-ellipsis">
                                <span>Z</span>
                                <span className="text-muted-foreground">{attr.position.z}</span>
                            </div>
                        </div>
                    </ItemContent>
                    <ItemActions>
                        <Button variant="destructive" size="icon"
                                onClick={() => {
                                    onRemoveAttractor(index)
                                }}>
                            <IconTrash/>
                        </Button>
                    </ItemActions>
                </Item>
            )))}
        </div>
    )
}