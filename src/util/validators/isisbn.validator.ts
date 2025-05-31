import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { isISBN } from 'validator';

@ValidatorConstraint({ async: false })
export class IsISBNConstraint implements ValidatorConstraintInterface {
    validate(value: string) {
        // Verificar se o valor existe e é uma string
        if (!value || typeof value !== 'string') {
            return false;
        }

        // Remover hífens e espaços para validação
        const cleanValue = value.replace(/[-\s]/g, '');
        
        // Verificar se é ISBN-10 ou ISBN-13 válido
        return isISBN(cleanValue, 10) || isISBN(cleanValue, 13);
    }

    defaultMessage() {
        return 'O valor fornecido não é um ISBN válido (deve ser ISBN-10 ou ISBN-13)';
    }
}

export function IsISBN(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsISBNConstraint,
        });
    };
}