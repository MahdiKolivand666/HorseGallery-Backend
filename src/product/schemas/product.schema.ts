import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { ProductCategory } from './product-category.schema';

@Schema({ timestamps: true })
export class Product extends Document {
  // فیلدهای اصلی
  @Prop({ required: true })
  name: string; // قبلاً title بود

  @Prop({ required: true })
  slug: string; // قبلاً url بود

  @Prop({ required: true })
  code: string; // کد محصول مثل GN-001-18K

  @Prop({ required: true, min: [0, 'قیمت نمی‌تواند منفی باشد'] })
  price: number;

  @Prop({
    type: Number,
    min: [0, 'قیمت تخفیف نمی‌تواند منفی باشد'],
    default: null,
    required: false,
    validate: {
      validator: function (value: number | null | undefined) {
        // اگر discountPrice وجود دارد، باید کمتر از price باشد
        if (value !== null && value !== undefined && this.price) {
          return value < this.price;
        }
        return true;
      },
      message: 'قیمت تخفیف باید کمتر از قیمت اصلی باشد',
    },
  })
  discountPrice?: number | null; // قبلاً discount بود

  @Prop({ default: 0, min: [0, 'درصد تخفیف نمی‌تواند منفی باشد'], max: [100, 'درصد تخفیف نمی‌تواند بیشتر از 100 باشد'] })
  discount?: number; // درصد تخفیف (0-100)

  @Prop({ default: false })
  onSale?: boolean; // آیا محصول در حال حاضر تخفیف دارد؟

  @Prop({ default: 0 })
  stock: number;

  @Prop({ default: 1 })
  version: number; // برای optimistic locking

  @Prop({ required: true })
  description: string;

  @Prop()
  images: string[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ProductCategory' })
  category: ProductCategory;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'ProductCategory' })
  subcategory?: Types.ObjectId;

  // Gold/Jewelry specific fields - تغییر نوع به string
  @Prop()
  weight?: string; // مثال: "12.5 گرم"

  @Prop()
  karat?: string; // مثال: "18 عیار"

  @Prop()
  material?: string; // قبلاً enum بود

  @Prop()
  dimensions?: string;

  @Prop()
  brand?: string; // جدید

  @Prop()
  coverage?: string; // نوع پوشش - جدید

  @Prop()
  wage?: string; // اجرت (کم، متوسط، زیاد)

  @Prop()
  commission?: number; // درصد اجرت

  @Prop({ default: false })
  lowCommission?: boolean; // آیا محصول اجرت کم دارد؟

  // Product Type - جدید برای تمایز بین جواهر، سکه و شمش
  @Prop({ 
    type: String, 
    enum: ['jewelry', 'coin', 'melted_gold'], 
    default: 'jewelry',
    index: true 
  })
  productType: string;

  // Gold Info - اطلاعات اختصاصی سکه و شمش
  @Prop({
    type: {
      weight: Number,        // وزن به گرم
      purity: String,        // خلوص (مثلاً "24K" یا "999.9")
      certificate: String,   // شماره گواهی
      mintYear: Number,      // سال ضرب (برای سکه)
      manufacturer: String   // تولید کننده (برای شمش)
    },
    required: false,
    _id: false
  })
  goldInfo?: {
    weight?: number;
    purity?: string;
    certificate?: string;
    mintYear?: number;
    manufacturer?: string;
  };

  // Flags
  @Prop({ default: true })
  isAvailable: boolean;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: false })
  isBestSelling: boolean;

  @Prop({ default: false })
  isNewArrival: boolean;

  @Prop({ default: false })
  isGift: boolean;

  // Stats
  @Prop({ default: 0 })
  rating?: number;

  @Prop({ default: 0 })
  reviewsCount?: number;

  @Prop({ default: 0 })
  views: number;

  @Prop({ default: 0 })
  viewsCount: number; // تعداد بازدید (alias برای views)

  @Prop({ default: 0 })
  sales: number;

  @Prop({ default: 0 })
  salesCount: number; // تعداد فروش (alias برای sales)

  @Prop({ default: 0 })
  popularityScore: number; // امتیاز محبوبیت (محاسبه شده)
}

export const productSchema = SchemaFactory.createForClass(Product);

// Indexes for better query performance
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ code: 1 }, { unique: true });
productSchema.index({ category: 1 });
productSchema.index({ subcategory: 1 });
productSchema.index({ isAvailable: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ isBestSelling: 1 });
productSchema.index({ isNewArrival: 1 });
productSchema.index({ stock: 1 });
productSchema.index({ views: -1 });
productSchema.index({ sales: -1 });
productSchema.index({ viewsCount: -1 });
productSchema.index({ salesCount: -1 });
productSchema.index({ popularityScore: -1 });
productSchema.index({ onSale: 1 });
productSchema.index({ lowCommission: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ category: 1, isAvailable: 1 }); // Compound index for common queries
productSchema.index({ slug: 1, isAvailable: 1 }); // Compound index for product detail
productSchema.index({ onSale: 1, createdAt: -1 }); // Compound index for sale products
productSchema.index({ lowCommission: 1, createdAt: -1 }); // Compound index for low commission products
productSchema.index({ category: 1, onSale: 1 }); // Compound index for category + sale
productSchema.index({ discount: -1 }); // Index for sorting by discount
productSchema.index({ onSale: 1, discount: -1 }); // Compound index for sale products sorted by discount
productSchema.index({ subcategory: 1, onSale: 1 }); // Compound index for subcategory + sale
productSchema.index({ productType: 1 }); // Index for product type filtering
productSchema.index({ productType: 1, isAvailable: 1 }); // Compound index for product type + availability
// Indexes for search
productSchema.index({ name: 1 }); // Index for name search
productSchema.index({ code: 1 }); // Index for code search
productSchema.index({ description: 'text' }); // Text index for description search (optional)
productSchema.index({ isAvailable: 1, stock: 1 }); // Compound index for available products with stock

// Middleware: محاسبه خودکار discount و onSale قبل از ذخیره
productSchema.pre('save', function (next) {
  // محاسبه درصد تخفیف
  if (this.discountPrice !== null && this.discountPrice !== undefined && this.price) {
    if (this.discountPrice < this.price) {
      this.discount = Math.round(
        ((this.price - this.discountPrice) / this.price) * 100,
      );
      this.onSale = true;
    } else {
      // اگر discountPrice بزرگتر یا مساوی price باشد، آن را null کن
      this.discountPrice = null;
      this.discount = 0;
      this.onSale = false;
    }
  } else {
    this.discount = 0;
    this.onSale = false;
    this.discountPrice = null;
  }

  // Optimistic locking
  if (this.isModified('stock')) {
    this.increment();
  }
  next();
});

// Middleware: محاسبه خودکار برای findOneAndUpdate
productSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as any;
  
  // اگر price یا discountPrice تغییر کرده، discount را محاسبه کن
  if (update.price !== undefined || update.discountPrice !== undefined || update.$set?.price !== undefined || update.$set?.discountPrice !== undefined) {
    // برای findOneAndUpdate باید از $set استفاده کنیم
    if (!update.$set) {
      update.$set = {};
    }
    
    // اگر price در update وجود دارد، از آن استفاده کن، وگرنه از document موجود
    let price = update.$set.price !== undefined ? update.$set.price : update.price;
    let discountPrice = update.$set.discountPrice !== undefined ? update.$set.discountPrice : update.discountPrice;
    
    // اگر price در update نیست، باید از document موجود بگیریم
    if (price === undefined) {
      const doc = await this.model.findOne(this.getQuery()).lean() as any;
      price = doc?.price;
    }
    
    // اگر discountPrice در update نیست، از document موجود بگیریم
    if (discountPrice === undefined && update.$set.discountPrice === undefined) {
      const doc = await this.model.findOne(this.getQuery()).lean() as any;
      discountPrice = doc?.discountPrice;
    }
    
    if (discountPrice !== null && discountPrice !== undefined && price) {
      if (discountPrice < price) {
        update.$set.discount = Math.round(
          ((price - discountPrice) / price) * 100,
        );
        update.$set.onSale = true;
        update.$set.discountPrice = discountPrice;
      } else {
        // اگر discountPrice بزرگتر یا مساوی price باشد، آن را null کن
        update.$set.discountPrice = null;
        update.$set.discount = 0;
        update.$set.onSale = false;
      }
    } else {
      update.$set.discount = 0;
      update.$set.onSale = false;
      update.$set.discountPrice = null;
    }
    
    // حذف فیلدهای مستقیم از update و انتقال به $set
    if (update.price !== undefined) {
      update.$set.price = update.price;
      delete update.price;
    }
    if (update.discountPrice !== undefined) {
      delete update.discountPrice;
    }
  }
  
  next();
});
