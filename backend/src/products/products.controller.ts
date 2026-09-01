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
import {
  CreateProductDto,
  QueryProductsDto,
  UpdateProductDto,
} from './dto/product.dto.js';
import { ProductsService } from './products.service.js';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}
  @Get() list(@Query() query: QueryProductsDto) {
    return this.service.list(query);
  }
  @Get(':id') findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
  @Roles(Role.ADMIN, Role.WAREHOUSE_MANAGER) @Post() create(
    @Body() dto: CreateProductDto,
  ) {
    return this.service.create(dto);
  }
  @Roles(Role.ADMIN, Role.WAREHOUSE_MANAGER) @Patch(':id') update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.service.update(id, dto);
  }
  @Roles(Role.ADMIN, Role.WAREHOUSE_MANAGER) @Delete(':id') deactivate(
    @Param('id') id: string,
  ) {
    return this.service.deactivate(id);
  }
}
