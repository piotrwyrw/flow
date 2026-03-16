import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import React from "react";
import CommandProcessor from "@/simulation/CommandProcessor";

type CommandPromptProps = {
    processor: CommandProcessor
}

export default function CommandPrompt({processor}: CommandPromptProps) {
    const commandSubmit = (e: React.KeyboardEvent) => {
        if (e.key == 'Enter') {
            const inputElement = (e.target as HTMLInputElement)
            processor.handle(inputElement.value)
            inputElement.value = ''
        }
    }

    return (
        <div
            className="absolute bottom-0 left-0 w-full h-svh flex flex-col items-center justify-end z-0 pointer-events-none">
            <div className="flex flex-row items-center justify-center w-full h-9 mb-5 gap-1">
                <Input className="w-1/2 h-full font-mono pointer-events-auto" placeholder="Enter Command"
                       onKeyDown={commandSubmit}></Input>
                <Button className="h-full pointer-events-auto" variant="outline">Palette</Button>
            </div>
        </div>
    )
}