"use client";

import {useEffect, useRef, useState} from "react";
import CommandProcessor from "@/lib/CommandProcessor";
import ParticleSystem from "@/lib/ParticleSystem";
import ControlOverlay from "@/components/ControlOverlay";
import CommandPrompt from "@/components/CommandPrompt";
import RenderPipeline from "@/lib/RenderPipeline";

export default function Page() {
    const rendererRef = useRef<HTMLDivElement>(null)

    const [pipeline, setPipeline] = useState<RenderPipeline | null>(null)
    const [commandProcessor, setCommandProcessor] = useState<CommandProcessor | null>(null)
    const [particleSystem, setParticleSystem] = useState<ParticleSystem | null>(null)

    useEffect(() => {
        if (!rendererRef || !rendererRef.current) {
            return
        }

        const p = new RenderPipeline(rendererRef.current, 100000)

        setPipeline(p)
        setParticleSystem(p.particleSystem)
        setCommandProcessor(new CommandProcessor(p.particleSystem!))
    }, [rendererRef]);

    return (
        <>
            <div className="w-full h-svh z-10 pointer-events-auto">
                <div ref={rendererRef} className="w-full h-full"></div>
            </div>

            {
                particleSystem
                && <ControlOverlay system={particleSystem}></ControlOverlay>
            }

            {
                commandProcessor
                && <CommandPrompt processor={commandProcessor}></CommandPrompt>
            }
        </>
    )

    // const [nameId, nameField] = schemaTextField("Name", Validators.NotEmptyString, "name")
    // const [attractorTypeId, attractorTypeField] = schemaSelectField("Attractor Type", "Attractor Type", ["Constant", "Linear", "Newtonian"],
    //     Validators.NotEmptyString, "attractorType")
    // const [strengthId, strengthField] = schemaNumberField("Strength", 0, 1000, 1,
    //     Validators.NumberRange(0, 500), "strength")
    //
    // const [valid, setValid] = useState<boolean>()
    //
    // const formSchema: FormSchema = [nameField, attractorTypeField, strengthField]
    //
    // const formModel: FormModel = emptyFormModel()
    //
    // return (
    //     <div className="w-100">
    //         <DynamicForm schema={formSchema} model={formModel} valid={setValid}></DynamicForm>
    //         { valid && <Button>Submit</Button> }
    //     </div>
    // )
}