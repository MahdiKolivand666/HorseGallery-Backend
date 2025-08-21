import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/user/schemas/user.schema';

export enum TicketStatus {
  Pending = 'pending',
  Responded = 'responded',
  Closed = 'closed',
  Open = 'Open',
}

@Schema({ timestamps: true })
export class Ticket extends Document {
  @Prop()
  title: string;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    required: true,
  })
  user: User;

  @Prop()
  status: TicketStatus;
}

export const ticketSchema = SchemaFactory.createForClass(Ticket);
