import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'maxLines', async: false })
export class MaxLinesConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments): boolean {
    if (typeof value !== 'string') {
      return false;
    }
    const lines = value.split('\n').length;
    const [maxLines] = args.constraints;
    return lines <= maxLines;
  }

  defaultMessage(args: ValidationArguments): string {
    const [maxLines] = args.constraints;
    return `آدرس نمی‌تواند بیشتر از ${maxLines} خط باشد`;
  }
}

export function MaxLines(
  maxLines: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'maxLines',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [maxLines],
      options: validationOptions,
      validator: MaxLinesConstraint,
    });
  };
}
