import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'src/shared/guards/jwt.guard';
import { CsrfGuard } from 'src/shared/guards/csrf.guard';
import { TicketService } from '../services/ticket.service';
import { RoleGuard } from 'src/shared/guards/role.guard';
import { Role } from 'src/user/schemas/user.schema';
import { TicketQueryDto } from '../dtos/ticket-query.dto';
import { TicketMessageDto } from '../dtos/ticket-message.dto';
import { User } from 'src/shared/decorators/user.decorator';
import { TicketMessagePipe } from 'src/shared/pipes/ticket-message.pipe';
import { BodyIdPipe } from 'src/shared/pipes/body-id.pipe';
import { TicketStatusDto } from '../dtos/ticket-status.dto';
import { TicketStatus } from '../schemas/ticket.schema';

@ApiTags('Ticket')
@ApiBearerAuth()
@UseGuards(JwtGuard, new RoleGuard([Role.Admin]), CsrfGuard)
@Controller('ticket')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Get()
  findAll(@Query() queryParams: TicketQueryDto) {
    return this.ticketService.findAll(queryParams);
  }

  @Get(':id')
  findOneTicket(@Param('id') id: string) {
    return this.ticketService.findOneTicket(id);
  }

  @Post('message')
  createTicketMessage(
    @Body(TicketMessagePipe, new BodyIdPipe(['ticket'])) body: TicketMessageDto,
    @User() user: string,
  ) {
    return this.ticketService.createTicketMessage(
      body,
      user,
      TicketStatus.Responded,
    );
  }

  @Patch(':id')
  changeTicketStatus(@Param('id') id: string, @Body() body: TicketStatusDto) {
    return this.ticketService.changeTicketStatus(id, body.status);
  }
}
