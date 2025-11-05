import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { BodyIdPipe } from 'src/shared/pipes/body-id.pipe';
import { ChangePasswordPipe } from 'src/shared/pipes/change-password.pipe';
import { PostalCodePipe } from 'src/shared/pipes/postal-code.pipe';
import { ReceiverMobilePipe } from 'src/shared/pipes/receiver-mobile.pipe';
import { JwtGuard } from 'src/shared/guards/jwt.guard';
import { CsrfGuard } from 'src/shared/guards/csrf.guard';
import { AddressService } from '../services/address.service';
import { AddressQueryDto } from '../dtos/address-query.dto';
import { AddressDto } from '../dtos/address.dto';
import { UpdateAddressDto } from '../dtos/update-address.dto';
import { User } from 'src/shared/decorators/user.decorator';

@ApiTags('Panel')
@UseGuards(JwtGuard, CsrfGuard)
@ApiBearerAuth()
@Controller('panel')
export class PanelController {
  constructor(
    private readonly userService: UserService,
    private readonly addressService: AddressService,
  ) {}

  @Get('address')
  findAllAddresses(@Query() queryParams: AddressQueryDto) {
    return this.addressService.findAll(queryParams);
  }

  @Post('address')
  createAddress(
    @Body(new PostalCodePipe(), new ReceiverMobilePipe()) body: AddressDto,
    @User() user: string,
  ) {
    return this.addressService.create(body, user);
  }

  @Get('address/:id')
  findOneAddress(@Param('id') id: string) {
    return this.addressService.findOne(id);
  }

  @Patch('address/:id')
  editAddress(
    @Param('id') id: string,
    @Body(new PostalCodePipe(), new ReceiverMobilePipe())
    body: UpdateAddressDto,
  ) {
    return this.addressService.update(id, body);
  }

  @Delete('address/:id')
  deleteAddress(@Param('id') id: string) {
    return this.addressService.delete(id);
  }

  @Get('user/:id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch('change-password')
  changePassword(
    @Body(new BodyIdPipe(['id']), ChangePasswordPipe) body: ChangePasswordDto,
  ) {
    const { id, newPassword } = body;
    return this.userService.update(id, { password: newPassword });
  }
}
