import { IsArray, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ReferenceOrderItem {
  @IsInt()
  id: number;

  @IsInt()
  order: number;
}

export class ReorderReferencesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReferenceOrderItem)
  references: ReferenceOrderItem[];
}
