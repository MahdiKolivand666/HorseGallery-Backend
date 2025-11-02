import { BadRequestException } from '@nestjs/common';

/**
 * Constants for price calculations
 */
export const PRICE_CONSTANTS = {
  MIN_PRICE: 0,
  MIN_QUANTITY: 1,
  MIN_DISCOUNT: 0,
  MAX_DISCOUNT: 100,
  DISCOUNT_FACTOR: 100,
} as const;

/**
 * Interface for price calculation result
 */
export interface PriceCalculationResult {
  priceWithDiscount: number;
  priceWithoutDiscount: number;
  savings: number;
  savingsPercentage: number;
}

/**
 * Validates price input
 */
export function validatePrice(price: number): void {
  if (!price || price <= PRICE_CONSTANTS.MIN_PRICE) {
    throw new BadRequestException('قیمت محصول نامعتبر است');
  }
}

/**
 * Validates quantity input
 */
export function validateQuantity(quantity: number): void {
  if (!quantity || quantity < PRICE_CONSTANTS.MIN_QUANTITY) {
    throw new BadRequestException('تعداد باید حداقل 1 باشد');
  }
}

/**
 * Validates discount percentage
 */
export function validateDiscount(discount: number): void {
  if (
    discount < PRICE_CONSTANTS.MIN_DISCOUNT ||
    discount > PRICE_CONSTANTS.MAX_DISCOUNT
  ) {
    throw new BadRequestException(
      `درصد تخفیف باید بین ${PRICE_CONSTANTS.MIN_DISCOUNT} تا ${PRICE_CONSTANTS.MAX_DISCOUNT} باشد`,
    );
  }
}

/**
 * Calculates discounted price for a single item
 * @param price - Original price
 * @param discount - Discount percentage (0-100)
 * @returns Discounted price (rounded)
 */
export function calculateSingleItemPrice(
  price: number,
  discount: number,
): number {
  validatePrice(price);
  validateDiscount(discount);

  // Calculate discounted price using (1 - discount/100) formula
  const discountMultiplier = 1 - discount / PRICE_CONSTANTS.DISCOUNT_FACTOR;
  return Math.round(price * discountMultiplier);
}

/**
 * Calculates total price with discount for multiple items
 * @param price - Original price per item
 * @param discount - Discount percentage (0-100)
 * @param quantity - Number of items
 * @returns Price calculation result
 */
export function calculateItemTotal(
  price: number,
  discount: number,
  quantity: number,
): PriceCalculationResult {
  // Validate inputs
  validatePrice(price);
  validateDiscount(discount);
  validateQuantity(quantity);

  // Calculate prices
  const discountedPrice = calculateSingleItemPrice(price, discount);
  const priceWithDiscount = discountedPrice * quantity;
  const priceWithoutDiscount = price * quantity;
  const savings = priceWithoutDiscount - priceWithDiscount;
  const savingsPercentage =
    priceWithoutDiscount > 0
      ? Math.round((savings / priceWithoutDiscount) * 100)
      : 0;

  return {
    priceWithDiscount,
    priceWithoutDiscount,
    savings,
    savingsPercentage,
  };
}

/**
 * Calculates cart totals from multiple items
 * @param items - Array of cart items with price, discount, and quantity
 * @returns Total calculation result
 */
export function calculateCartTotal(
  items: Array<{
    price: number;
    discount: number;
    quantity: number;
  }>,
): PriceCalculationResult {
  let totalWithDiscount = 0;
  let totalWithoutDiscount = 0;

  for (const item of items) {
    const itemResult = calculateItemTotal(
      item.price,
      item.discount,
      item.quantity,
    );
    totalWithDiscount += itemResult.priceWithDiscount;
    totalWithoutDiscount += itemResult.priceWithoutDiscount;
  }

  const savings = totalWithoutDiscount - totalWithDiscount;
  const savingsPercentage =
    totalWithoutDiscount > 0
      ? Math.round((savings / totalWithoutDiscount) * 100)
      : 0;

  return {
    priceWithDiscount: totalWithDiscount,
    priceWithoutDiscount: totalWithoutDiscount,
    savings,
    savingsPercentage,
  };
}
