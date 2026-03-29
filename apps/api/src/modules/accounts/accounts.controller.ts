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
import { AccountsService } from './accounts.service';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@telnub/shared';

@ApiTags('Accounts')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  async findAll(@Query() query: PaginationDto) {
    return this.accountsService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.accountsService.findById(id);
    return { data };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.SALES_EXECUTIVE)
  async create(
    @Body() dto: CreateAccountDto,
    @Request() req: { user: { sub: string } },
  ) {
    const data = await this.accountsService.create(dto, req.user.sub);
    return { data };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR, UserRole.SALES_EXECUTIVE)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAccountDto,
  ) {
    const data = await this.accountsService.update(id, dto);
    return { data };
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.OPERATIONS_DIRECTOR)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.accountsService.softDelete(id);
    return { data };
  }
}
