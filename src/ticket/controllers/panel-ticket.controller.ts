import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NewTicketDto } from '../dtos/new-ticket.dto';
import { User } from 'src/shared/decorators/user.decorator';
import { TicketService } from '../services/ticket.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtGuard } from 'src/shared/guards/jwt.guard';
import { TicketMessagePipe } from 'src/shared/pipes/ticket-message.pipe';
import { TicketQueryDto } from '../dtos/ticket-query.dto';
import { BodyIdPipe } from 'src/shared/pipes/body-id.pipe';
import { TicketMessageDto } from '../dtos/ticket-message.dto';
import { TicketStatus } from '../schemas/ticket.schema';

@ApiTags('Panel Ticket')
@ApiBearerAuth()
@UseGuards(JwtGuard)
@Controller('panel-ticket')
export class PanelTicketController {
  constructor(private readonly ticketService: TicketService) {}
  @Post()
  async createNewTicket(
    @Body(TicketMessagePipe) body: NewTicketDto,
    @User() user: string,
  ) {
    const ticket = await this.ticketService.createNewTicket(body.title, user);
    await this.ticketService.createTicketMessage(
      {
        content: body.content,
        ticket: (ticket._id as any).toString(),
        image: body.image,
      },
      user,
    );

    return this.ticketService.findOneTicket(ticket._id as any);
  }
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
      TicketStatus.Pending,
    );
  }
}
