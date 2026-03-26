import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { CategoryListItemResponse } from '../contracts/api-responses';
import { CategoriesService } from './categories.service';

@ApiTags('categories')
@ApiBearerAuth('JWT-auth')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List user categories', description: 'For transaction category overrides and budgets.' })
  @ApiResponse({ status: 200, description: 'Categories' })
  list(@CurrentUser() user: AuthUser): Promise<CategoryListItemResponse[]> {
    return this.categories.list(user);
  }
}
