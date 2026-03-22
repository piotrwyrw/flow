/*
 * Copyright (c) 2026 Piotr Krzysztof Wyrwas [flow]
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

export type FieldValidatorCallback = (value: number | string) => boolean

export namespace Validators {
    export const AlwaysValid: FieldValidatorCallback = () => true

    export const StringNotEmpty: FieldValidatorCallback = (value) => {
        if (typeof value !== 'string') {
            return false
        }
        return !!value.trim();
    }

    export function StringIn(options: string[]): FieldValidatorCallback {
        return (value) => {
            if (typeof value !== "string") {
                return false
            }
            return options.includes(value)
        }
    }

    export const NumberNotNaN: FieldValidatorCallback = (value) => {
        if (typeof value !== "number") {
            return false
        }
        return !Number.isNaN(value)
    }

    export function NumberInRange(min: number, max: number): FieldValidatorCallback {
        return (value) => {
            if (typeof value !== "number") {
                return false
            }
            return (value >= min && value <= max);
        }
    }

    export function SatisfiesAll(...validators: FieldValidatorCallback[]): FieldValidatorCallback {
        return (value) => {
            validators.forEach(validator => {
                if (!validator(value)) {
                    return false
                }
            })
            return true
        }
    }

    export function SatisfiesSome(...validators: FieldValidatorCallback[]): FieldValidatorCallback {
        return (value) => {
            validators.forEach(validator => {
                if (validator(value)) {
                    return true
                }
            })
            return false
        }
    }

    export const StringDefault = StringNotEmpty
    export const NumberDefault = NumberNotNaN
}

//
// --- Form Field Types ---
//
export enum FieldType {
    TEXT,
    BOUNDED_NUMBER,
    UNBOUNDED_NUMBER,
    SELECT
}

export type BaseFormField = {
    identifier: string,
    label: string,
    type: FieldType,
    isValid: FieldValidatorCallback
}

export type BoundedNumberField = BaseFormField & {
    type: typeof FieldType.BOUNDED_NUMBER
    minimum: number,
    maximum: number,
    stepSize: number
}

export type UnboundedNumberField = BaseFormField & {
    type: typeof FieldType.UNBOUNDED_NUMBER
}

export type TextField = BaseFormField & {
    type: typeof FieldType.TEXT
}

export type SelectField<T extends string = string> = BaseFormField & {
    type: typeof FieldType.SELECT,
    placeholder: string,
    label: string,
    options: T[]
}

/**
 * Create a new bounded number input field (Slider)
 * @param label The label text of the field
 * @param min Minimum selectable value
 * @param max Maximum selectable value
 * @param step Value increment size
 * @param isValid Validator instance for this field. Defaults to {@link Validators.NumberInRange} with the given `min`, `max` values
 * @param identifier Unique value used to identify this field in the model.
 */
export function schemaBoundedNumberField(label: string,
                                         min: number,
                                         max: number,
                                         step: number,
                                         identifier: string,
                                         isValid: FieldValidatorCallback = Validators.NumberInRange(min, max)): [string, BoundedNumberField] {
    return [
        identifier,
        {
            type: FieldType.BOUNDED_NUMBER,
            identifier: identifier,
            label: label,
            minimum: min,
            maximum: max,
            stepSize: step,
            isValid
        }
    ]
}

/**
 * Create a new unbounded number input field
 * @param label The label text of the field
 * @param identifier Unique value used to identify this field in the model.
 * @param isValid Validator instance for this field. Defaults to {@link Validators.NumberNotNaN}
 */
export function schemaUnboundedNumberField(label: string,
                                           identifier: string,
                                           isValid: FieldValidatorCallback = Validators.NumberNotNaN): [string, UnboundedNumberField] {
    return [
        identifier,
        {
            type: FieldType.UNBOUNDED_NUMBER,
            identifier: identifier,
            label: label,
            isValid
        }
    ]
}

/**
 * Create a new text input field
 * @param label The label text of the field
 * @param identifier Unique value used to identify this field in the model.
 * @param isValid Validator instance for this field. Defaults to {@link Validators.StringNotEmpty}
 */
export function schemaTextField(label: string,
                                identifier: string,
                                isValid: FieldValidatorCallback = Validators.StringNotEmpty): [string, TextField] {
    return [
        identifier,
        {
            type: FieldType.TEXT,
            identifier: identifier,
            label: label,
            isValid
        }
    ]
}

/**
 * Create a new dropdown/select field
 * @param label The label text of the field
 * @param placeholder Placeholder text displayed in the selection box before any selection was made
 * @param options The selectable options for this field
 * @param identifier Unique value used to identify this field in the model
 * @param isValid Validator instance for this field. Defaults to {@link Validators.StringIn} with the given options
 */
export function schemaSelectField<T extends string = string>(label: string,
                                                             placeholder: string,
                                                             options: string[],
                                                             identifier: string,
                                                             isValid: FieldValidatorCallback = Validators.StringIn(options)): [string, SelectField] {
    return [
        identifier,
        {
            type: FieldType.SELECT,
            placeholder: placeholder,
            identifier: identifier,
            label: label,
            options: options as T[],
            isValid
        }
    ]
}

//
// --- Form Schema Types ---
//

export type FormField<T extends string = string> =
    BoundedNumberField
    | UnboundedNumberField
    | TextField
    | SelectField<T>

export type FormSchema<T extends string = string> = FormField<T>[]

export enum FieldValueDataType {
    STRING,
    NUMBER
}

export type FieldValue = {
    type: FieldValueDataType,
    value: number | string,
    isValid: FieldValidatorCallback
}

function numberFieldValue(value: number, isValid: FieldValidatorCallback): FieldValue {
    return {
        type: FieldValueDataType.NUMBER,
        value,
        isValid
    }
}

function textFieldValue(value: string, isValid: FieldValidatorCallback): FieldValue {
    return {
        type: FieldValueDataType.STRING,
        value,
        isValid
    }
}

export type FormModel = {
    [key: string]: FieldValue
}

export function emptyFormModel(): MutableFormModel {
    return createMutableFormModel({})
}

export type MutableFormModel = {
    setNumber: (key: string, value: number, isValid: FieldValidatorCallback) => void,
    setText: (key: string, value: string, isValid: FieldValidatorCallback) => void,
    update: (key: string, value: string | number) => void,
    getNumber: (key: string) => number,
    getText: (key: string) => string,
    getTextAs: <T>(key: string) => T
    getField: (key: string) => FieldValue,
    validate: () => boolean,
    clear: () => void
}

/**
 * Wrap a {@link FormModel} in an object with numerous utility functions
 * @param model The {@link FormModel} to wrap.
 */
export function createMutableFormModel(model: FormModel): MutableFormModel {
    return {
        setNumber(key: string, value: number, isValid: FieldValidatorCallback) {
            console.debug(`Setting number field '${key}': ${value}`)
            model[key] = numberFieldValue(value, isValid)
        },

        setText(key: string, value: string, isValid: FieldValidatorCallback) {
            console.debug(`Setting text field '${key}': ${value}`)
            model[key] = textFieldValue(value, isValid)
        },

        update(key: string, value: string | number) {
            // Field doesn't exist yet, so we create it now
            if (!(key in model)) {
                if (typeof value === "string") {
                    this.setText(key, value, Validators.StringDefault)
                } else {
                    this.setNumber(key, value, Validators.NumberDefault)
                }
                console.debug(`Attempted to update non-existent field '${key}'. Creating it now with the default validator for type ${typeof value}`)
                return
            }

            const modelType = typeof model[key].value
            const newValueType = typeof value

            if (modelType === "number" && newValueType === "string") {
                const newValueAsNumber = Number.parseFloat(value as string)

                if (Number.isNaN(newValueAsNumber)) {
                    console.debug(`Attempted to update number field '${key}' with a text value and number parsing failed. Rejecting the update.`)
                    return
                }

                model[key].value = newValueAsNumber
                return
            }

            if (modelType == "string" && newValueType === "number") {
                model[key].value = value.toString()
                return
            }

            if (modelType === newValueType) {
                model[key].value = value
                return
            }

            console.error(`Attempted to update a ${typeof model[key].value} field with a value of type ${typeof value}`)
        },

        getNumber(key: string): number {
            if (!(key in model)) {
                console.error(`Attempted to read non-existent number field '${key}'`)
                return 0
            }

            const value = model[key]

            if (value.type !== FieldValueDataType.NUMBER) {
                console.error(`Attempted to read text field '${key}' as number.`)
                return NaN
            }

            console.debug(`Reading number field '${key}': ${value.value}`)

            return value.value as number
        },

        getText(key: string): string {
            if (!(key in model)) {
                console.error(`Attempted to read non-existent text field '${key}'`)
                return ""
            }

            const value = model[key]

            if (value.type !== FieldValueDataType.STRING) {
                console.error(`Attempted to read number model field '${key}' as string.`)
                return ""
            }

            console.debug(`Reading string field '${key}': ${value.value}`)

            return value.value as string
        },

        getTextAs<T>(key: string): T {
            return this.getText(key) as T
        },

        getField(key: string): FieldValue {
            return model[key]
        },

        validate(): boolean {
            for (let fieldKey in model) {
                if (!model.hasOwnProperty(fieldKey)) {
                    continue
                }

                const field = model[fieldKey]
                if (!field.isValid(field.value)) {
                    return false
                }
            }
            return true
        },

        clear() {
            for (let fieldKey in model) {
                if (!model.hasOwnProperty(fieldKey)) {
                    continue
                }

                const fieldType = typeof model[fieldKey].value

                if (fieldType === "string") {
                    model[fieldKey].value = ""
                    continue
                }

                if (fieldType === "number") {
                    model[fieldKey].value = 0
                }
            }
        }
    }
}