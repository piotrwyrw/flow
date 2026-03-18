"use client";

import {
    emptyFormModel,
    FieldValue,
    FormModel,
    FormSchema,
    schemaNumberField,
    schemaSelectField,
    schemaTextField, Validators
} from "@/lib/DynamicForms";
import DynamicForm from "@/components/DynamicForm";
import {useEffect, useRef, useState} from "react";
import {Button} from "@/components/ui/button";
import useRenderer from "@/hooks/useRenderer";
import CommandProcessor from "@/lib/CommandProcessor";
import ParticleSystem from "@/lib/ParticleSystem";
import ControlOverlay from "@/components/ControlOverlay";
import CommandPrompt from "@/components/CommandPrompt";

export default function Page() {
    const rendererRef = useRef<HTMLDivElement>(null)
    const particleSystemRef = useRenderer(rendererRef)

    const [commandProcessor, setCommandProcessor] = useState<CommandProcessor | null>(null)
    const [particleSystem, setParticleSystem] = useState<ParticleSystem | null>(null)

    useEffect(() => {
        particleSystemRef.current && setCommandProcessor(new CommandProcessor(particleSystemRef.current))
        particleSystemRef.current && setParticleSystem(particleSystemRef.current)
    }, [particleSystemRef]);

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