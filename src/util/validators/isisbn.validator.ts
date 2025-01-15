import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { isISBN } from 'validator';

@ValidatorConstraint({ async: false })
export class IsISBNConstraint implements ValidatorConstraintInterface {
    validate(value: any) {
        return typeof value === 'string' && (isISBN(value, 10) || isISBN(value, 13));
    }

    defaultMessage() {
        return 'O valor fornecido não é um ISBN válido (deve ser ISBN-10 ou ISBN-13)';
    }
}

export function IsISBN(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsISBNConstraint,
        });
    };
}
