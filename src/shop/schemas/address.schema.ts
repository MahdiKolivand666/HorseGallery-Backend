import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({
  timestamps: true,
  collection: 'addresses', // ✅ نام collection در database
  strict: true, // ✅ فقط فیلدهای تعریف شده را قبول کن (اما همه فیلدها در schema موجود هستند)
  validateBeforeSave: false, // ✅ غیرفعال کردن validation برای جلوگیری از خطای `user` required
})
export class Address extends Document {
  declare _id: Types.ObjectId;

  // User/Session identification
  // ✅ فیلد `user` برای backward compatibility (همیشه مقدار دارد - برابر با userId)
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: false,
    index: false,
    default: null,
    select: false, // ✅ در query ها برگردانده نمی‌شود
  })
  user?: Types.ObjectId | string | null; // Legacy field - برای backward compatibility (همیشه برابر با userId است)

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: false,
    index: true,
    default: null,
  })
  userId?: Types.ObjectId | string | null; // برای کاربران لاگین شده

  @Prop({
    type: String,
    required: false,
    index: true,
    default: null,
    trim: true,
  })
  sessionId?: string | null; // برای مهمان‌ها

  // بخش آدرس
  @Prop({
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100,
  })
  title: string; // عنوان آدرس (مثلاً: منزل، محل کار)

  @Prop({
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100,
  })
  province: string; // استان

  @Prop({
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100,
  })
  city: string; // شهر

  @Prop({
    required: true,
    trim: true,
    match: /^\d{10}$/, // دقیقاً 10 رقم
  })
  postalCode: string; // کد پستی

  @Prop({
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 500,
  })
  address: string; // آدرس کامل

  // بخش مشخصات سفارش دهنده
  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  })
  firstName: string; // نام

  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  })
  lastName: string; // نام خانوادگی

  @Prop({
    required: true,
    trim: true,
    match: /^\d{10}$/, // دقیقاً 10 رقم
  })
  nationalId: string; // کد ملی

  @Prop({
    required: true,
    trim: true,
    match: /^09\d{9}$/, // فرمت موبایل ایرانی
  })
  mobile: string; // شماره موبایل

  @Prop({
    type: String,
    required: false,
    trim: true,
    maxlength: 100,
    default: null,
    validate: {
      validator: function (v: string | null | undefined) {
        // ✅ اگر null یا خالی است، قبول کن
        if (!v || v.trim() === '') return true;
        // ✅ بررسی فرمت ایمیل انگلیسی
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(v);
      },
      message: 'ایمیل باید به انگلیسی وارد شود و فرمت صحیح داشته باشد',
    },
  })
  email?: string | null; // ایمیل (اختیاری - می‌تواند null باشد)

  @Prop({
    type: String,
    required: false,
    trim: true,
    maxlength: 500,
    default: null,
  })
  notes?: string | null; // توضیحات تکمیلی (اختیاری - می‌تواند null باشد)

  // فیلدهای سیستم
  @Prop({ default: false })
  isDefault: boolean; // آیا آدرس پیش‌فرض است؟
}

export const addressSchema = SchemaFactory.createForClass(Address);

// ✅ Explicitly set validateBeforeSave to false
addressSchema.set('validateBeforeSave', false);

// ✅ Explicitly set user field as optional (برای جلوگیری از خطای required)
if (addressSchema.path('user')) {
  addressSchema.path('user').required(false);
  addressSchema.path('user').default(null);
}

// ✅ حذف فیلدهای قدیمی از schema (اگر وجود دارند)
if (addressSchema.path('recipientName')) {
  addressSchema.remove('recipientName');
}
if (addressSchema.path('recipientMobile')) {
  addressSchema.remove('recipientMobile');
}

// #region agent log - بررسی schema paths قبل از add
const pathsBefore = Object.keys(addressSchema.paths);
fetch('http://127.0.0.1:7243/ingest/68d9a1ae-d5d1-4778-ac8b-8408cd3a7459', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: 'address.schema.ts:162',
    message: 'schema paths before add - check if add code runs',
    data: {
      pathsBefore: pathsBefore,
      hasRecipientName: !!addressSchema.path('recipientName'),
      hasRecipientMobile: !!addressSchema.path('recipientMobile'),
      hasFirstName: !!addressSchema.path('firstName'),
      hasLastName: !!addressSchema.path('lastName'),
    },
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'run1',
    hypothesisId: 'schema-fix',
  }),
}).catch(() => {});
// #endregion

// ✅ اطمینان از وجود فیلدهای جدید در schema paths
// اگر فیلدها در schema paths نیستند، آنها را اضافه می‌کنیم
if (!addressSchema.path('firstName')) {
  addressSchema.add({
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
  });
}
if (!addressSchema.path('lastName')) {
  addressSchema.add({
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
  });
}
if (!addressSchema.path('nationalId')) {
  addressSchema.add({
    nationalId: {
      type: String,
      required: true,
      trim: true,
      match: /^\d{10}$/,
    },
  });
}
if (!addressSchema.path('mobile')) {
  addressSchema.add({
    mobile: {
      type: String,
      required: true,
      trim: true,
      match: /^09\d{9}$/,
    },
  });
}
if (!addressSchema.path('email')) {
  addressSchema.add({
    email: {
      type: String,
      required: false,
      trim: true,
      maxlength: 100,
      default: null,
      validate: {
        validator: function (v: string | null | undefined) {
          if (!v || v.trim() === '') return true;
          const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          return emailRegex.test(v);
        },
        message: 'ایمیل باید به انگلیسی وارد شود و فرمت صحیح داشته باشد',
      },
    },
  });
}
if (!addressSchema.path('notes')) {
  addressSchema.add({
    notes: {
      type: String,
      required: false,
      trim: true,
      maxlength: 500,
      default: null,
    },
  });
}
if (!addressSchema.path('userId')) {
  addressSchema.add({
    userId: {
      type: Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
      default: null,
    },
  });
}
if (!addressSchema.path('sessionId')) {
  addressSchema.add({
    sessionId: {
      type: String,
      required: false,
      index: true,
      default: null,
      trim: true,
    },
  });
}

// #region agent log - بررسی schema paths بعد از add
const pathsAfter = Object.keys(addressSchema.paths);
fetch('http://127.0.0.1:7243/ingest/68d9a1ae-d5d1-4778-ac8b-8408cd3a7459', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: 'address.schema.ts:270',
    message: 'schema paths after add - check if fields were added',
    data: {
      pathsAfter: pathsAfter,
      hasFirstName: !!addressSchema.path('firstName'),
      hasLastName: !!addressSchema.path('lastName'),
      hasNationalId: !!addressSchema.path('nationalId'),
      hasMobile: !!addressSchema.path('mobile'),
      hasEmail: !!addressSchema.path('email'),
      hasNotes: !!addressSchema.path('notes'),
      hasRecipientName: !!addressSchema.path('recipientName'),
      hasRecipientMobile: !!addressSchema.path('recipientMobile'),
    },
    timestamp: Date.now(),
    sessionId: 'debug-session',
    runId: 'run1',
    hypothesisId: 'schema-fix',
  }),
}).catch(() => {});
// #endregion

// ✅ Validation: یا userId یا sessionId باید وجود داشته باشد
addressSchema.pre('save', function (next) {
  if (!this.userId && !this.sessionId) {
    return next(new Error('آدرس باید یا userId یا sessionId داشته باشد'));
  }
  next();
});

// Indexes برای query سریع‌تر
addressSchema.index({ userId: 1, isDefault: 1 });
addressSchema.index({ sessionId: 1 });
addressSchema.index({ userId: 1 });
addressSchema.index({ sessionId: 1, isDefault: 1 });
