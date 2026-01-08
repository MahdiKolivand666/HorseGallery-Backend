import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Announcement } from '../schemas/announcement.schema';
import { CreateAnnouncementDto } from '../dtos/announcement.dto';
import { UpdateAnnouncementDto } from '../dtos/announcement.dto';

@Injectable()
export class AnnouncementService {
  constructor(
    @InjectModel(Announcement.name)
    private readonly announcementModel: Model<Announcement>,
  ) {}

  async findAll(isActive?: boolean) {
    const query: any = {};
    if (isActive !== undefined) {
      query.isActive = isActive;
      const now = new Date();
      query.startDate = { $lte: now };
      query.$or = [{ endDate: null }, { endDate: { $gte: now } }];
    }
    return this.announcementModel.find(query).sort({ order: 1 }).exec();
  }

  async findOne(id: string) {
    const announcement = await this.announcementModel.findById(id).exec();
    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }
    return announcement;
  }

  async create(createAnnouncementDto: CreateAnnouncementDto) {
    const announcement = new this.announcementModel(createAnnouncementDto);
    return announcement.save();
  }

  async update(id: string, updateAnnouncementDto: UpdateAnnouncementDto) {
    const announcement = await this.announcementModel
      .findByIdAndUpdate(id, updateAnnouncementDto, { new: true })
      .exec();
    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }
    return announcement;
  }

  async delete(id: string) {
    const announcement = await this.announcementModel
      .findByIdAndDelete(id)
      .exec();
    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }
    return announcement;
  }
}
