import { Injectable, NotFoundException } from '@nestjs/common';
import { SeoDto } from '../dtos/seo.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Seo } from '../schemas/seo.schema';
import { Model } from 'mongoose';
import { SeoQueryDto } from '../dtos/seo-query.dto';
import { sortFunction } from 'src/shared/utils/sort-utils';

@Injectable()
export class SeoService {
  constructor(
    @InjectModel(Seo.name)
    private readonly seoModel: Model<Seo>,
  ) {}

  async findAll(queryParams: SeoQueryDto, selectObject = {}) {
    const { limit = 10, page = 1, url } = queryParams;

    const query: any = {};

    if (url) query.url = { $regex: url, $options: 'i' };

    const sortObject = sortFunction(queryParams?.sort);

    const Seos = await this.seoModel
      .find(query)
      .skip(page - 1)
      .limit(limit)
      .sort(sortObject)
      .select(selectObject)
      .exec();

    const count = await this.seoModel.countDocuments(query);

    return { count, Seos };
  }

  async findOne(id: string, selectObject = {}) {
    const seo = await this.seoModel
      .findOne({ _id: id })
      .select(selectObject)
      .exec();

    if (seo) {
      return seo;
    } else {
      throw new NotFoundException('یافت نشد');
    }
  }

  async findOneWithUrl(url: string, selectObject = {}) {
    const seo = await this.seoModel
      .findOne({ url: url })
      .select(selectObject)
      .exec();

    if (seo) {
      return seo;
    } else {
      throw new NotFoundException('یافت نشد');
    }
  }

  async create(body: SeoDto) {
    const newSeo = new this.seoModel(body);
    await newSeo.save();
    return newSeo;
  }

  async update(id: string, body: SeoDto) {
    return await this.seoModel.findByIdAndUpdate(id, body, {
      new: true,
    });
  }

  async delete(id: string) {
    const seo = await this.findOne(id);

    await seo.deleteOne();
    return seo;
  }
}
