import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { InventoryService } from './inventory.service';
import {
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  CreateInventoryTransactionDto,
} from './dto/inventory.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@telnub/shared';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  async findAllItems(@Query() query: PaginationDto) {
    return this.inventoryService.findAllItems(query);
  }

  @Get(':id')
  async findItemById(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.inventoryService.findItemById(id);
    return { data };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)
  async createItem(@Body() dto: CreateInventoryItemDto) {
    const data = await this.inventoryService.createItem(dto);
    return { data };
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)
  async updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryItemDto,
  ) {
    const data = await this.inventoryService.updateItem(id, dto);
    return { data };
  }

  @Get(':id/transactions')
  async findTransactions(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.inventoryService.findTransactionsByItem(id);
    return { data };
  }

  @Post(':id/transactions')
  @Roles(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)
  async createTransaction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateInventoryTransactionDto,
    @Request() req: { user: { sub: string } },
  ) {
    const data = await this.inventoryService.createTransaction(id, dto, req.user.sub);
    return { data };
  }

  // No PATCH/DELETE for transactions — append-only audit log

  @Post('import')
  @Roles(UserRole.ADMIN, UserRole.INVENTORY_MANAGER)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  async importExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException('File must be an Excel file (.xlsx or .xls)');
    }
    const result = await this.inventoryService.importFromExcel(file.buffer);
    return { data: result };
  }
}
