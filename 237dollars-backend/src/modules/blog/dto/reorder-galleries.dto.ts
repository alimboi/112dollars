import { IsArray, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class GalleryOrderItem {
  @IsInt()
  id: number;

  @IsInt()
  order: number;
}

export class ReorderGalleriesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GalleryOrderItem)
  galleries: GalleryOrderItem[];
}
