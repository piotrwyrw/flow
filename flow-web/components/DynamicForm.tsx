"use client";

import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Slider} from "@/components/ui/slider";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {ReactNode, useEffect, useState} from "react";
import {
    createMutableFormModel,
    FieldType,
    FieldValue,
    FormModel,
    FormSchema,
    MutableFormModel
} from "@/lib/DynamicForms";

type DynamicFormProps = {
    schema: FormSchema,
    model: FormModel,
    actionsChildren?: ReactNode,
    valid?: (newValue: boolean) => void,
    onFormFieldChanged?: (affectedField: string, fieldValue: FieldValue) => void
    onSubmit?: (model: MutableFormModel) => void
}

export default function DynamicForm({schema, model, actionsChildren, valid, onFormFieldChanged, onSubmit}: DynamicFormProps) {
    const [mutableModel] = useState<MutableFormModel>(createMutableFormModel(model))
    const [formReady, setFormReady] = useState<boolean>(false)

    // Used exclusively for triggering re-renders
    const [, setDummy] = useState<number>(0)

    useEffect(() => {
        schema.forEach(field => {
            if (field.type === FieldType.NUMBER) {
                mutableModel.setNumber(field.identifier, 0, field.isValid)
            } else {
                mutableModel.setText(field.identifier, "", field.isValid)
            }
        })

        setFormReady(true)
    }, []);

    function validateForm() {
        if (valid) {
            valid(mutableModel.validate())
        }
    }

    function handleChange(name: string, value: string | number) {
        mutableModel.update(name, value)
        validateForm()
        setDummy(prev => prev + 1)
        if (onFormFieldChanged) {
            onFormFieldChanged(name, mutableModel.getField(name))
        }
    }

    function submit() {
        if (!onSubmit) {
            return
        }

        onSubmit(mutableModel)
    }

    return formReady && (
        <form onSubmit={e => {
            e.preventDefault()
            submit()
        }}>
            <div className="grid grid-cols-1 gap-2">
                {
                    schema.map((field, index) => (
                        <div key={index}>
                            {field.type === FieldType.TEXT && (
                                <div key={index} className="grid grid-cols-3 items-center">
                                    <Label htmlFor={field.label}>{field.label}</Label>
                                    <Input id={field.identifier}
                                           type="text"
                                           value={mutableModel.getText(field.identifier)}
                                           onChange={e => handleChange(field.identifier, e.target.value)}
                                           className="w-full col-span-2 h-8">
                                    </Input>
                                </div>
                            )}

                            {field.type === FieldType.NUMBER && (
                                <div key={index} className="grid grid-cols-1 w-full">
                                    <div className="flex items-center justify-between -mb-1">
                                        <Label htmlFor={field.identifier}>{field.label}</Label>
                                        <span
                                            className="text-muted-foreground">{mutableModel.getNumber(field.identifier)}</span>
                                    </div>
                                    <Slider id={field.identifier}
                                            min={field.minimum}
                                            max={field.maximum}
                                            step={field.stepSize}
                                            value={[mutableModel.getNumber(field.identifier)]}
                                            onValueChange={v => handleChange(field.identifier, v[0])}
                                            className="w-full col-span-2 h-8">
                                    </Slider>
                                </div>
                            )}

                            {field.type === FieldType.SELECT && (
                                <div key={index} className="grid grid-cols-3 items-center">
                                    <Label htmlFor={field.identifier}>{field.label}</Label>
                                    <Select value={mutableModel.getText(field.identifier)}
                                            onValueChange={v => handleChange(field.identifier, v)}>
                                        <SelectTrigger className="w-full col-span-2 h-8">
                                            <SelectValue id={field.identifier} placeholder={field.placeholder}/>
                                        </SelectTrigger>
                                        <SelectContent position="item-aligned">
                                            <SelectGroup>
                                                <SelectLabel>{field.label}</SelectLabel>
                                                {
                                                    field.options.map((option, index) => (
                                                        <SelectItem key={index} value={option}>{option}</SelectItem>
                                                    ))
                                                }
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    ))
                }

            </div>
        </form>
    )
}