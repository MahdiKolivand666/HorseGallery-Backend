import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Ticket, ticketSchema } from './schemas/ticket.schema';
import {
  TicketMessage,
  ticketMessageSchema,
} from './schemas/ticket-message.schema';
import { PanelTicketController } from './controllers/panel-ticket.controller';
import { TicketService } from './services/ticket.service';
import { TicketController } from './controllers/ticket.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ticket.name, schema: ticketSchema },
      { name: TicketMessage.name, schema: ticketMessageSchema },
    ]),
  ],
  controllers: [PanelTicketController, TicketController],
  providers: [TicketService],
})
export class TicketModule {}
