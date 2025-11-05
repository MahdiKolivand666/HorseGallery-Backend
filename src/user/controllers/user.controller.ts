import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserDto } from '../dtos/user.dto';
import { UserService } from '../services/user.service';
import { UserQueryDto } from '../dtos/user-query.dto';
import { FarsiPipe } from 'src/shared/pipes/farsi.pipe';
import { MobilePipe } from 'src/shared/pipes/mobile.pipe';
import { PasswordPipe } from 'src/shared/pipes/password.pipe';
import { PasswordInterceptor } from 'src/shared/interceptors/password.interceptor';
import { UpdateUserDto } from '../dtos/update-user.dto';
import { JwtGuard } from 'src/shared/guards/jwt.guard';
import { CsrfGuard } from 'src/shared/guards/csrf.guard';
import { RoleGuard } from 'src/shared/guards/role.guard';
import { Role } from '../schemas/user.schema';

@ApiTags('User')
@Controller('user')
@UseGuards(JwtGuard, new RoleGuard([Role.Admin]), CsrfGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Get()
  findAll(@Query() queryParams: UserQueryDto) {
    return this.userService.findAll(queryParams);
  }

  @Post()
  @UseInterceptors(PasswordInterceptor)
  create(@Body(FarsiPipe, MobilePipe, new PasswordPipe(true)) body: UserDto) {
    return this.userService.create(body);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @UseInterceptors(PasswordInterceptor)
  update(
    @Param('id') id: string,
    @Body(FarsiPipe, MobilePipe, PasswordPipe, new PasswordPipe(true))
    body: UpdateUserDto,
  ) {
    return this.userService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.userService.delete(id);
  }
}
