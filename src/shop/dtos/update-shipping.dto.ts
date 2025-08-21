import { PartialType } from '@nestjs/mapped-types';
import { ShippingDto } from './shipping.dto';

export class UpdateShippingDto extends PartialType(ShippingDto) {}
