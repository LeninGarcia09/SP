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
import { ContactsService } from './contacts.service';
import { CreateContactDto, UpdateContactDto } from './dto/contact.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@telnub/shared';

@ApiTags('Contacts')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  async findAll(@Query() query: PaginationDto) {
    return this.contactsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.contactsService.findById(id);
    return { data };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.SALES_EXECUTIVE)
  async create(
    @Body() dto: CreateContactDto,
    @Request() req: { user: { sub: string } },
  ) {
    const data = await this.contactsService.create(dto, req.user.sub);
    return { data };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.SALES_EXECUTIVE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContactDto,
  ) {
    const data = await this.contactsService.update(id, dto);
    return { data };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.contactsService.softDelete(id);
    return { data };
  }
}
