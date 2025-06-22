import { registerDecorator, ValidationOptions } from 'class-validator';
import { isISBN } from 'validator';

export function IsISBN10(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'isISBN10',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: string) {
                    if (!value || typeof value !== 'string') return false;
                    return isISBN(value.replace(/[-\s]/g, ''), 10);
                },
                defaultMessage() {
                    return 'O valor fornecido não é um ISBN-10 válido';
                }
            }
        });
    };
}

export function IsISBN13(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'isISBN13',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: string) {
                    if (!value || typeof value !== 'string') return false;
                    return isISBN(value.replace(/[-\s]/g, ''), 13);
                },
                defaultMessage() {
                    return 'O valor fornecido não é um ISBN-13 válido';
                }
            }
        });
    };
}