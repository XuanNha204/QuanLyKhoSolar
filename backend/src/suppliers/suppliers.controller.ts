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
  CreateSupplierDto,
  QuerySuppliersDto,
  UpdateSupplierDto,
} from './dto/supplier.dto.js';
import { SuppliersService } from './suppliers.service.js';
@ApiTags('Suppliers')
@ApiBearerAuth()
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly s: SuppliersService) {}
  @Get() list(@Query() q: QuerySuppliersDto) {
    return this.s.list(q);
  }
  @Get(':id') one(@Param('id') id: string) {
    return this.s.findOne(id);
  }
  @Roles(Role.ADMIN, Role.WAREHOUSE_MANAGER) @Post() create(
    @Body() d: CreateSupplierDto,
  ) {
    return this.s.create(d);
  }
  @Roles(Role.ADMIN, Role.WAREHOUSE_MANAGER) @Patch(':id') update(
    @Param('id') id: string,
    @Body() d: UpdateSupplierDto,
  ) {
    return this.s.update(id, d);
  }
  @Roles(Role.ADMIN, Role.WAREHOUSE_MANAGER) @Delete(':id') del(
    @Param('id') id: string,
  ) {
    return this.s.deactivate(id);
  }
}
