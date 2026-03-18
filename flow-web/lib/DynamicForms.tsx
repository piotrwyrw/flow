import {useId} from "react";

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
    NUMBER,
    SELECT
}

export type BaseFormField = {
    identifier: string,
    label: string,
    type: FieldType,
    isValid: FieldValidatorCallback
}

export type NumberField = BaseFormField & {
    type: typeof FieldType.NUMBER
    minimum: number,
    maximum: number,
    stepSize: number
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
 * Create a new number input field
 * @param label The label text of the field
 * @param min Minimum selectable value
 * @param max Maximum selectable value
 * @param step Value increment size
 * @param isValid Validator instance for this field. Defaults to {@link Validators.NumberInRange} with the given `min`, `max` values
 * @param identifier Unique value used to identify this field in the model. Defaults to {@link useId}
 */
export function schemaNumberField(label: string,
                                  min: number,
                                  max: number,
                                  step: number,
                                  isValid: FieldValidatorCallback = Validators.NumberInRange(min, max),
                                  identifier: string = useId()): [string, NumberField] {
    return [
        identifier,
        {
            type: FieldType.NUMBER,
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
 * Create a new text input field
 * @param label The label text of the field
 * @param isValid Validator instance for this field. Defaults to {@link Validators.StringNotEmpty}
 * @param identifier Unique value used to identify this field in the model. Defaults to {@link useId}
 */
export function schemaTextField(label: string,
                                isValid: FieldValidatorCallback = Validators.StringNotEmpty,
                                identifier: string = useId()): [string, TextField] {
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
 * @param isValid Validator instance for this field. Defaults to {@link Validators.StringIn} with the given options
 * @param identifier Unique value used to identify this field in the model. Defaults to {@link useId}
 */
export function schemaSelectField<T extends string = string>(label: string,
                                                             placeholder: string,
                                                             options: string[],
                                                             isValid: FieldValidatorCallback = Validators.StringIn(options),
                                                             identifier: string = useId()): [string, SelectField] {
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

export type FormField<T extends string = string> = NumberField | TextField | SelectField<T>

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

export function emptyFormModel(): FormModel {
    return {}
}

export type MutableFormModel = {
    setNumber: (key: string, value: number, isValid: FieldValidatorCallback) => void,
    setText: (key: string, value: string, isValid: FieldValidatorCallback) => void,
    update: (key: string, value: string | number) => void,
    getNumber: (key: string) => number,
    getText: (key: string) => string,
    getField: (key: string) => FieldValue,
    validate: () => boolean
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
            console.debug(`Setting string field '${key}': ${value}`)
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

            // Make sure the type of the existing value matches the new value
            if (typeof model[key].value !== typeof value) {
                console.error(`Attempted to update a ${typeof model[key]} field with a value of type ${typeof value}`)
                return
            }

            model[key].value = value
        },

        getNumber(key: string): number {
            if (!(key in model)) {
                console.error(`Attempted to read non-existent number field '${key}'`)
                return 0
            }

            const value = model[key]

            if (value.type !== FieldValueDataType.NUMBER) {
                console.error(`Attempted to read string model field '${key}' as number.`)
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
        }
    }
}