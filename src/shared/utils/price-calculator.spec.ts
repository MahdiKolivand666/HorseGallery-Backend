import { BadRequestException } from '@nestjs/common';
import {
  calculateSingleItemPrice,
  calculateItemTotal,
  calculateCartTotal,
  validatePrice,
  validateQuantity,
  validateDiscount,
  PRICE_CONSTANTS,
} from './price-calculator';

describe('PriceCalculator', () => {
  describe('validatePrice', () => {
    it('should throw error for zero price', () => {
      expect(() => validatePrice(0)).toThrow(BadRequestException);
    });

    it('should throw error for negative price', () => {
      expect(() => validatePrice(-100)).toThrow(BadRequestException);
    });

    it('should not throw error for valid price', () => {
      expect(() => validatePrice(100)).not.toThrow();
    });
  });

  describe('validateQuantity', () => {
    it('should throw error for zero quantity', () => {
      expect(() => validateQuantity(0)).toThrow(BadRequestException);
    });

    it('should throw error for negative quantity', () => {
      expect(() => validateQuantity(-1)).toThrow(BadRequestException);
    });

    it('should not throw error for valid quantity', () => {
      expect(() => validateQuantity(1)).not.toThrow();
      expect(() => validateQuantity(10)).not.toThrow();
    });
  });

  describe('validateDiscount', () => {
    it('should throw error for negative discount', () => {
      expect(() => validateDiscount(-1)).toThrow(BadRequestException);
    });

    it('should throw error for discount > 100', () => {
      expect(() => validateDiscount(101)).toThrow(BadRequestException);
    });

    it('should not throw error for valid discount', () => {
      expect(() => validateDiscount(0)).not.toThrow();
      expect(() => validateDiscount(50)).not.toThrow();
      expect(() => validateDiscount(100)).not.toThrow();
    });
  });

  describe('calculateSingleItemPrice', () => {
    it('should calculate price with 0% discount correctly', () => {
      const result = calculateSingleItemPrice(10000, 0);
      expect(result).toBe(10000);
    });

    it('should calculate price with 10% discount correctly', () => {
      const result = calculateSingleItemPrice(10000, 10);
      expect(result).toBe(9000);
    });

    it('should calculate price with 50% discount correctly', () => {
      const result = calculateSingleItemPrice(10000, 50);
      expect(result).toBe(5000);
    });

    it('should calculate price with 100% discount correctly', () => {
      const result = calculateSingleItemPrice(10000, 100);
      expect(result).toBe(0);
    });

    it('should round the result', () => {
      const result = calculateSingleItemPrice(10000, 33);
      // 10000 * (1 - 0.33) = 6700
      expect(result).toBe(6700);
    });

    it('should throw error for invalid price', () => {
      expect(() => calculateSingleItemPrice(-100, 10)).toThrow(
        BadRequestException,
      );
    });

    it('should throw error for invalid discount', () => {
      expect(() => calculateSingleItemPrice(10000, 101)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('calculateItemTotal', () => {
    it('should calculate total with quantity correctly', () => {
      const result = calculateItemTotal(10000, 10, 2);
      expect(result.priceWithDiscount).toBe(18000); // 9000 × 2
      expect(result.priceWithoutDiscount).toBe(20000); // 10000 × 2
      expect(result.savings).toBe(2000);
      expect(result.savingsPercentage).toBe(10);
    });

    it('should calculate total with no discount', () => {
      const result = calculateItemTotal(10000, 0, 1);
      expect(result.priceWithDiscount).toBe(10000);
      expect(result.priceWithoutDiscount).toBe(10000);
      expect(result.savings).toBe(0);
      expect(result.savingsPercentage).toBe(0);
    });

    it('should calculate total with 100% discount', () => {
      const result = calculateItemTotal(10000, 100, 1);
      expect(result.priceWithDiscount).toBe(0);
      expect(result.priceWithoutDiscount).toBe(10000);
      expect(result.savings).toBe(10000);
      expect(result.savingsPercentage).toBe(100);
    });

    it('should handle multiple quantities', () => {
      const result = calculateItemTotal(5000, 20, 5);
      // 5000 * 0.8 = 4000
      // 4000 * 5 = 20000
      expect(result.priceWithDiscount).toBe(20000);
      expect(result.priceWithoutDiscount).toBe(25000);
      expect(result.savings).toBe(5000);
      expect(result.savingsPercentage).toBe(20);
    });

    it('should throw error for invalid inputs', () => {
      expect(() => calculateItemTotal(-100, 10, 1)).toThrow();
      expect(() => calculateItemTotal(100, -10, 1)).toThrow();
      expect(() => calculateItemTotal(100, 10, 0)).toThrow();
    });
  });

  describe('calculateCartTotal', () => {
    it('should calculate total for multiple items', () => {
      const items = [
        { price: 10000, discount: 10, quantity: 2 }, // 18000
        { price: 5000, discount: 0, quantity: 1 }, // 5000
        { price: 8000, discount: 25, quantity: 3 }, // 18000
      ];

      const result = calculateCartTotal(items);

      expect(result.priceWithDiscount).toBe(41000);
      expect(result.priceWithoutDiscount).toBe(49000);
      expect(result.savings).toBe(8000);
      expect(result.savingsPercentage).toBe(16);
    });

    it('should handle empty cart', () => {
      const result = calculateCartTotal([]);

      expect(result.priceWithDiscount).toBe(0);
      expect(result.priceWithoutDiscount).toBe(0);
      expect(result.savings).toBe(0);
      expect(result.savingsPercentage).toBe(0);
    });

    it('should handle single item', () => {
      const items = [{ price: 10000, discount: 15, quantity: 1 }];

      const result = calculateCartTotal(items);

      expect(result.priceWithDiscount).toBe(8500);
      expect(result.priceWithoutDiscount).toBe(10000);
      expect(result.savings).toBe(1500);
      expect(result.savingsPercentage).toBe(15);
    });

    it('should throw error for invalid item in cart', () => {
      const items = [{ price: -100, discount: 10, quantity: 1 }];

      expect(() => calculateCartTotal(items)).toThrow(BadRequestException);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle gold ring purchase', () => {
      // انگشتر طلا 12,500,000 تومان، تخفیف 10٪، تعداد 2
      const result = calculateItemTotal(12500000, 10, 2);

      expect(result.priceWithDiscount).toBe(22500000);
      expect(result.priceWithoutDiscount).toBe(25000000);
      expect(result.savings).toBe(2500000);
      expect(result.savingsPercentage).toBe(10);
    });

    it('should handle multiple products cart', () => {
      const items = [
        { price: 12500000, discount: 10, quantity: 2 }, // Ring
        { price: 15000000, discount: 15, quantity: 1 }, // Necklace
        { price: 7200000, discount: 0, quantity: 1 }, // Coin
      ];

      const result = calculateCartTotal(items);

      expect(result.priceWithDiscount).toBe(42450000);
      expect(result.priceWithoutDiscount).toBe(47200000);
      expect(result.savings).toBe(4750000);
    });

    it('should handle fractional discount precisely', () => {
      // قیمت 1,234,567 تومان با تخفیف 13.5%
      const result = calculateSingleItemPrice(1234567, 13.5);

      // 1234567 * (1 - 0.135) = 1067900.495
      // Math.round() should give us 1067900
      expect(result).toBe(1067900);
    });
  });
});
