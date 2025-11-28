import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProductMigrationService } from './product-migration.service';
import { JwtGuard } from 'src/shared/guards/jwt.guard';
import { RoleGuard } from 'src/shared/guards/role.guard';
import { Role } from 'src/user/schemas/user.schema';
import { CsrfGuard } from 'src/shared/guards/csrf.guard';

@ApiTags('Migrations')
@Controller('migrations')
@UseGuards(JwtGuard, new RoleGuard([Role.Admin]), CsrfGuard)
@ApiBearerAuth()
export class MigrationController {
  constructor(private readonly migrationService: ProductMigrationService) {}

  @Post('run')
  async runMigrations() {
    return await this.migrationService.runAllMigrations();
  }
}

