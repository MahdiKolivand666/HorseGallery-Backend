import { ApiProperty } from '@nestjs/swagger';

export class DashboardResponseDto {
  @ApiProperty({
    description: 'مبلغ کیف پول به تومان',
    example: 5000000,
  })
  walletBalance: number;

  @ApiProperty({
    description: 'تعداد سفارش‌های کاربر',
    example: 12,
  })
  ordersCount: number;

  @ApiProperty({
    description: 'تعداد آدرس‌های ثبت شده',
    example: 3,
  })
  addressesCount: number;

  @ApiProperty({
    description: 'شماره موبایل کاربر',
    example: '09123456789',
  })
  phoneNumber: string;
}
