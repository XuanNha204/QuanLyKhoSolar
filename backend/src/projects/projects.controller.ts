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
  CreateProjectDto,
  QueryProjectsDto,
  UpdateProjectDto,
} from './dto/project.dto.js';
import { ProjectsService } from './projects.service.js';
@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly s: ProjectsService) {}
  @Get() list(@Query() q: QueryProjectsDto) {
    return this.s.list(q);
  }
  @Get(':id') one(@Param('id') id: string) {
    return this.s.findOne(id);
  }
  @Roles(Role.ADMIN, Role.WAREHOUSE_MANAGER) @Post() create(
    @Body() d: CreateProjectDto,
  ) {
    return this.s.create(d);
  }
  @Roles(Role.ADMIN, Role.WAREHOUSE_MANAGER) @Patch(':id') update(
    @Param('id') id: string,
    @Body() d: UpdateProjectDto,
  ) {
    return this.s.update(id, d);
  }
  @Roles(Role.ADMIN, Role.WAREHOUSE_MANAGER) @Delete(':id') del(
    @Param('id') id: string,
  ) {
    return this.s.deactivate(id);
  }
}
