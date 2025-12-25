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
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [
    SharedModule, // ✅ برای استفاده از TokenBlacklistService در JwtGuard
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: Ticket.name, schema: ticketSchema },
      { name: TicketMessage.name, schema: ticketMessageSchema },
    ]),
  ],
  controllers: [PanelTicketController, TicketController],
  providers: [TicketService],
})
export class TicketModule {}
