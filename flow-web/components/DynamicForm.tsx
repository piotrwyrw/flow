/*
 * Copyright (c) 2026 Piotr Krzysztof Wyrwas [flow]
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

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
import {Children, cloneElement, isValidElement, ReactElement, ReactNode, useEffect, useState} from "react";
import {FieldType, FieldValue, FormSchema, MutableFormModel} from "@/lib/DynamicForms";

type DynamicFormProps = {
    schema: FormSchema,
    model: MutableFormModel,
    children?: ReactNode,
    valid?: (newValue: boolean) => void,
    onFormFieldChanged?: (affectedField: string, fieldValue: FieldValue) => void
    onSubmit?: (model: MutableFormModel) => void
}

export default function DynamicForm({
                                        schema,
                                        model,
                                        children,
                                        valid,
                                        onFormFieldChanged,
                                        onSubmit
                                    }: DynamicFormProps) {
    const [formReady, setFormReady] = useState<boolean>(false)

    // Used exclusively for triggering re-renders
    const [, setDummy] = useState<number>(0)

    useEffect(() => {
        createModelFromSchema()
    }, []);

    const createModelFromSchema = () => {
        setFormReady(false)

        schema.forEach(field => {
            if (field.type === FieldType.BOUNDED_NUMBER || field.type === FieldType.UNBOUNDED_NUMBER) {
                console.debug(`Creating dynamic form number field: ${field.identifier}`)
                model.setNumber(field.identifier, 0, field.isValid)
            } else {
                console.debug(`Creating dynamic form string field: ${field.identifier}`)
                model.setText(field.identifier, "", field.isValid)
            }
        })

        setFormReady(true)
    }

    const triggerRender = () => {
        setDummy(prev => prev + 1)
    }

    const validateForm = () => {
        if (valid) {
            valid(model.validate())
        }
    }

    const invalidate = () => {
        if (valid) {
            valid(false)
        }
    }

    const handleChange = (name: string, value: string | number) => {
        model.update(name, value)
        validateForm()
        triggerRender()
        if (onFormFieldChanged) {
            onFormFieldChanged(name, model.getField(name))
        }
    }

    const submit = () => {
        if (!onSubmit) {
            return
        }

        onSubmit(model)

        model.clear()
        createModelFromSchema()
        triggerRender()
        invalidate()
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
                                    <Input id={field.label}
                                           type="text"
                                           value={model.getText(field.identifier)}
                                           onChange={e => handleChange(field.identifier, e.target.value)}
                                           className="w-full col-span-2 h-8">
                                    </Input>
                                </div>
                            )}

                            {field.type === FieldType.BOUNDED_NUMBER && (
                                <div key={index} className="grid grid-cols-1 w-full">
                                    <div className="flex items-center justify-between -mb-1">
                                        <Label htmlFor={field.identifier}>{field.label}</Label>
                                        <span
                                            className="text-muted-foreground">{model.getNumber(field.identifier)}</span>
                                    </div>
                                    <Slider id={field.identifier}
                                            min={field.minimum}
                                            max={field.maximum}
                                            step={field.stepSize}
                                            value={[model.getNumber(field.identifier)]}
                                            onValueChange={v => handleChange(field.identifier, v[0])}
                                            className="w-full col-span-2 h-8">
                                    </Slider>
                                </div>
                            )}

                            {field.type === FieldType.UNBOUNDED_NUMBER && (
                                <div key={index} className="grid grid-cols-3 items-center">
                                    <Label htmlFor={field.label}>{field.label}</Label>
                                    <Input id={field.identifier}
                                           type="number"
                                           value={model.getNumber(field.identifier)}
                                           onChange={e => handleChange(field.identifier, e.target.value)}
                                           className="w-full col-span-2 h-8">
                                    </Input>
                                </div>
                            )}

                            {field.type === FieldType.SELECT && (
                                <div key={index} className="grid grid-cols-3 items-center">
                                    <Label htmlFor={field.identifier}>{field.label}</Label>
                                    <Select value={model.getText(field.identifier)}
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
                {children &&
                    <div className="w-full flex flex-row">
                        {Children.map(children, (child, i) => (
                            isValidElement(child) ? cloneElement(child as ReactElement<any>, {className: "flex-1 " + ((child.props as any).className || "")}) : child
                        ))}
                    </div>}
            </div>
        </form>
    )
}