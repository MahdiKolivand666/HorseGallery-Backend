import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FAQ } from '../schemas/faq.schema';
import { CreateFAQDto } from '../dtos/faq.dto';
import { UpdateFAQDto } from '../dtos/faq.dto';

@Injectable()
export class FAQService {
  constructor(@InjectModel(FAQ.name) private readonly faqModel: Model<FAQ>) {}

  async findAll(isActive?: boolean) {
    const query: any = {};
    if (isActive !== undefined) {
      query.isActive = isActive;
    }
    return this.faqModel.find(query).sort({ order: 1 }).exec();
  }

  async findOne(id: string) {
    const faq = await this.faqModel.findById(id).exec();
    if (!faq) {
      throw new NotFoundException('FAQ not found');
    }
    return faq;
  }

  async create(createFAQDto: CreateFAQDto) {
    const faq = new this.faqModel(createFAQDto);
    return faq.save();
  }

  async update(id: string, updateFAQDto: UpdateFAQDto) {
    const faq = await this.faqModel
      .findByIdAndUpdate(id, updateFAQDto, { new: true })
      .exec();
    if (!faq) {
      throw new NotFoundException('FAQ not found');
    }
    return faq;
  }

  async delete(id: string) {
    const faq = await this.faqModel.findByIdAndDelete(id).exec();
    if (!faq) {
      throw new NotFoundException('FAQ not found');
    }
    return faq;
  }

  async incrementViews(id: string) {
    return this.faqModel.findByIdAndUpdate(id, { $inc: { views: 1 } }).exec();
  }

  async incrementHelpful(id: string) {
    return this.faqModel.findByIdAndUpdate(id, { $inc: { helpful: 1 } }).exec();
  }
}

