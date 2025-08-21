import { PartialType } from '@nestjs/mapped-types';
import { SeoDto } from './seo.dto';

export class UpdateSeoDto extends PartialType(SeoDto) {}
