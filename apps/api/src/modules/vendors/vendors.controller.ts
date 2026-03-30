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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { VendorsService } from './vendors.service';
import { CreateVendorDto, UpdateVendorDto } from './dto/vendor.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@telnub/shared';

@ApiTags('Vendors')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  async findAll(@Query() query: PaginationDto) {
    return this.vendorsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.vendorsService.findById(id);
    return { data };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR)
  async create(@Body() dto: CreateVendorDto) {
    const data = await this.vendorsService.create(dto);
    return { data };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVendorDto,
  ) {
    const data = await this.vendorsService.update(id, dto);
    return { data };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.vendorsService.softDelete(id);
    return { data };
  }
}
