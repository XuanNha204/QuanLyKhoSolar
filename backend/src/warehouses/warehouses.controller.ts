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
  CreateWarehouseDto,
  QueryWarehousesDto,
  UpdateWarehouseDto,
} from './dto/warehouse.dto.js';
import { WarehousesService } from './warehouses.service.js';
@ApiTags('Warehouses')
@ApiBearerAuth()
@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly s: WarehousesService) {}
  @Get() list(@Query() q: QueryWarehousesDto) {
    return this.s.list(q);
  }
  @Get(':id') one(@Param('id') id: string) {
    return this.s.findOne(id);
  }
  @Roles(Role.ADMIN, Role.WAREHOUSE_MANAGER) @Post() create(
    @Body() d: CreateWarehouseDto,
  ) {
    return this.s.create(d);
  }
  @Roles(Role.ADMIN, Role.WAREHOUSE_MANAGER) @Patch(':id') update(
    @Param('id') id: string,
    @Body() d: UpdateWarehouseDto,
  ) {
    return this.s.update(id, d);
  }
  @Roles(Role.ADMIN, Role.WAREHOUSE_MANAGER) @Delete(':id') del(
    @Param('id') id: string,
  ) {
    return this.s.deactivate(id);
  }
}
