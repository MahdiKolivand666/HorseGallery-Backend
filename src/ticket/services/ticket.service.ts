import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Ticket, TicketStatus } from '../schemas/ticket.schema';
import { Model } from 'mongoose';
import { TicketMessage } from '../schemas/ticket-message.schema';
import { TicketMessageDto } from '../dtos/ticket-message.dto';
import { TicketQueryDto } from '../dtos/ticket-query.dto';
import { sortFunction } from 'src/shared/utils/sort-utils';

@Injectable()
export class TicketService {
  constructor(
    @InjectModel(Ticket.name) private readonly ticketModel: Model<Ticket>,
    @InjectModel(TicketMessage.name)
    private readonly ticketMessageModel: Model<TicketMessage>,
  ) {}

  async findAll(queryParams: TicketQueryDto, selectObject: any = { __v: 0 }) {
    const { limit = 10, page = 1, title, status, user } = queryParams;

    const query: any = {};
    if (title) query.title = { $regex: title, $options: 'i' };
    if (status) query.status = status;
    if (user) query.user = user;

    const sortObject = sortFunction(queryParams?.sort);
    const tickets = await this.ticketModel
      .find(query)
      .skip(page - 1)
      .limit(limit)
      .populate('user', { firstName: 1, lastName: 1 })
      .sort(sortObject.select(selectObject))
      .exec();

    const count = await this.ticketModel.countDocuments(query);
    return {
      tickets,
      count,
    };
  }
  async createNewTicket(title: string, user: string) {
    const newTicket = new this.ticketModel({
      title: title,
      user: user,
      status: TicketStatus.Pending,
    });
    await newTicket.save();
    return newTicket;
  }

  async createTicketMessage(
    body: TicketMessageDto,
    user: string,
    status?: TicketStatus,
  ) {
    const newTicketMessage = new this.ticketMessageModel({
      ...body,
      user: user,
    });
    await newTicketMessage.save();
    if (status) {
      await this.changeTicketStatus(body.ticket, status);
    }
    return newTicketMessage;
  }

  async findOneTicket(id: string) {
    const ticket = await this.ticketModel
      .findOne({ _id: id })
      .populate('user', { firstName: 1, lastName: 1 })
      .exec();
    if (ticket) {
      const messages = await this.ticketMessageModel
        .find({ ticket: ticket._id })
        .populate('user', { firstName: 1, lastName: 1 })
        .sort({ createdAt: -1 })
        .exec();
      return { ticket, messages };
    } else {
      throw new NotFoundException('Ticket not found');
    }
  }
  async changeTicketStatus(id: string, status: TicketStatus) {
    const ticket = await this.ticketModel.findOne({ _id: id }).exec();
    if (ticket) {
      ticket.status = status;
      await ticket.save();
    } else {
      throw new NotFoundException();
    }
  }
}
