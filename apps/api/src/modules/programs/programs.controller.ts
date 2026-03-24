import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProgramsService } from './programs.service';
import { CreateProgramDto, UpdateProgramDto } from './dto/program.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@telnub/shared';

@ApiTags('Programs')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Get()
  async findAll(@Query() query: PaginationDto) {
    return this.programsService.findAll(query);
  }

  @Get('deleted')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR)
  async findDeleted() {
    const data = await this.programsService.findDeleted();
    return { data };
  }

  @Patch('deleted/:id/restore')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR)
  async restore(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.programsService.restore(id);
    return { data };
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.programsService.findById(id);
    return { data };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.PROGRAM_MANAGER)
  async create(
    @Body() dto: CreateProgramDto,
    @Request() req: { user: { sub: string } },
  ) {
    const data = await this.programsService.create(dto, req.user.sub);
    return { data };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.PROGRAM_MANAGER)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProgramDto,
  ) {
    const data = await this.programsService.update(id, dto);
    return { data };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.programsService.softDelete(id);
    return { data };
  }
}
