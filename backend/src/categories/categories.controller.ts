import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../common/enums/domain.enum.js';
import { CategoriesService } from './categories.service.js';
import {
  CreateCategoryDto,
  QueryCategoriesDto,
  UpdateCategoryDto,
} from './dto/category.dto.js';

@ApiTags('Categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}
  @Get() list(@Query() query: QueryCategoriesDto) {
    return this.service.list(query);
  }
  @Get(':id') findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
  @Roles(Role.ADMIN, Role.WAREHOUSE_MANAGER)
  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.service.create(dto);
  }
  @Roles(Role.ADMIN, Role.WAREHOUSE_MANAGER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.service.update(id, dto);
  }
  @Roles(Role.ADMIN, Role.WAREHOUSE_MANAGER)
  @Delete(':id')
  deactivate(@Param('id') id: string) {
    return this.service.deactivate(id);
  }
}
