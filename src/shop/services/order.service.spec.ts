import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { getModelToken } from '@nestjs/mongoose';
import { Order } from '../schemas/order.schema';
import { OrderItem } from '../schemas/order-item.schema';
import { CartService } from './cart.service';
import { ShippingService } from './shipping.service';
import { ProductService } from 'src/product/services/product.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';

describe('OrderService', () => {
  let service: OrderService;
  let mockOrderModel: any;
  let mockCartService: any;
  let mockShippingService: any;
  let mockProductService: any;
  let mockConfigService: any;

  beforeEach(async () => {
    // Mock implementations
    mockOrderModel = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    mockCartService = {
      getCartDetails: jest.fn(),
    };

    mockShippingService = {
      findOne: jest.fn(),
    };

    mockProductService = {
      removeStock: jest.fn(),
    };

    mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        {
          provide: getModelToken(Order.name),
          useValue: mockOrderModel,
        },
        {
          provide: getModelToken(OrderItem.name),
          useValue: {},
        },
        {
          provide: CartService,
          useValue: mockCartService,
        },
        {
          provide: ShippingService,
          useValue: mockShippingService,
        },
        {
          provide: ProductService,
          useValue: mockProductService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrder - Idempotency', () => {
    it('should return existing refId for duplicate recent order', async () => {
      const userId = 'user123';
      const cartId = 'cart123';
      const existingRefId = 'existing-ref-123';

      const existingOrder = {
        user: userId,
        cart: cartId,
        refId: existingRefId,
        lastPaymentAttemptAt: new Date(),
        paymentAttempts: 1,
      };

      mockOrderModel.findOne.mockResolvedValue(existingOrder);

      const result = await service.createOrder(
        { cartId, addressId: 'addr1', shippingId: 'ship1' },
        userId,
      );

      expect(result).toBe(existingRefId);
      expect(mockOrderModel.findOne).toHaveBeenCalledWith({
        user: userId,
        cart: cartId,
        status: 'paying',
      });
    });

    it('should throw error if payment attempts exceeded', async () => {
      const userId = 'user123';
      const cartId = 'cart123';

      const existingOrder = {
        user: userId,
        cart: cartId,
        refId: 'ref-123',
        lastPaymentAttemptAt: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
        paymentAttempts: 5,
        save: jest.fn(),
      };

      mockOrderModel.findOne.mockResolvedValue(existingOrder);

      await expect(
        service.createOrder(
          { cartId, addressId: 'addr1', shippingId: 'ship1' },
          userId,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOrderByRefId', () => {
    it('should return order when found', async () => {
      const refId = 'ref-123';
      const order = { _id: 'order1', refId };

      mockOrderModel.findOne.mockResolvedValue(order);

      const result = await service.findOrderByRefId(refId);

      expect(result).toEqual(order);
      expect(mockOrderModel.findOne).toHaveBeenCalledWith({ refId });
    });
  });
});
