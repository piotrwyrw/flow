/*
 * Copyright (c) 2026 Piotr Krzysztof Wyrwas [flow]
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import {useRef, useState} from "react";
import ParticleSystem from "@/lib/simulation/ParticleSystem";
import {Item, ItemContent, ItemTitle} from "@/components/ui/item";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import ReactCodeMirror from "@uiw/react-codemirror";
import {krzysztofeanInstructions} from "@/codemirror/krzysztofean-instructions";
import SimulationScript from "@/lib/scripting/SimulationScript";
import {ChevronRightIcon, SaveIcon} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {IconCode, IconCodeOff} from "@tabler/icons-react";
import {FlowLang} from "@/codemirror/lang-flow";

type ScriptEditorProps = {
    system: ParticleSystem,
    scripts: readonly SimulationScript[]
}

export function ScriptListing({system, scripts}: ScriptEditorProps) {
    const [editorOpen, setEditorOpen] = useState<boolean>(true)

    const [currentScript, setCurrentScript] = useState<SimulationScript | undefined>(undefined)

    const [code, setCode] = useState<string>("")

    function saveScript() {
        if (!currentScript)
            return;

        console.log(code)

        currentScript.parseWithNewSource(code)
        setEditorOpen(false)
    }

    return (
        <>
            {scripts.map(script => (
                <Item key={script.name} variant="outline" className="w-full">
                    <ItemContent className="w-full">
                        <div className="w-full flex flex-row items-center justify-between">
                            <ItemTitle>{script.name}</ItemTitle>
                            <Button variant="ghost" size="sm" onClick={() => {
                                setCurrentScript(script)
                                setCode(script.getSource())
                                setEditorOpen(true)
                            }}><ChevronRightIcon/></Button>
                        </div>
                        {script.isActive() && <Badge variant="default"><IconCode/>Active</Badge>}
                        {!script.isActive() && <Badge variant="destructive"><IconCodeOff/>Disabled</Badge>}
                    </ItemContent>
                </Item>
            ))}
            {currentScript && <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
                <DialogContent className="w-[90vw] h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>Script Editor</DialogTitle>
                        <DialogDescription>{currentScript.name}</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col w-full h-full gap-4">
                        <div className="flex-1 flex flex-col w-full h-full overflow-y-scroll">
                            <ReactCodeMirror value={code} onChange={(v) => setCode(v)} extensions={[FlowLang.Language]} theme={krzysztofeanInstructions}
                                             className="h-full w-full" minHeight="100%">
                            </ReactCodeMirror>
                        </div>
                        <div className="flex flex-row items-center justify-end">
                            <Button onClick={saveScript}><SaveIcon/>Save</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>}
        </>
    )
}