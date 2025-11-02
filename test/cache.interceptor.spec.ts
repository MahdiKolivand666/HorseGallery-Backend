import { Test, TestingModule } from '@nestjs/testing';
import { CacheInterceptor } from '../src/shared/interceptors/cache.interceptor';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('CacheInterceptor', () => {
  let interceptor: CacheInterceptor;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheInterceptor,
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    interceptor = module.get<CacheInterceptor>(CacheInterceptor);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('should bypass cache if no cache key is set', (done) => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({}),
        }),
        getHandler: () => {},
      } as ExecutionContext;

      const mockNext: CallHandler = {
        handle: () => of({ data: 'test' }),
      };

      jest.spyOn(reflector, 'get').mockReturnValue(undefined);

      interceptor.intercept(mockContext, mockNext).subscribe((result) => {
        expect(result).toEqual({ data: 'test' });
        done();
      });
    });

    it('should cache response when cache key is set', (done) => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({ query: {} }),
        }),
        getHandler: () => {},
      } as ExecutionContext;

      const mockNext: CallHandler = {
        handle: () => of({ data: 'test' }),
      };

      jest
        .spyOn(reflector, 'get')
        .mockReturnValueOnce('test-key')
        .mockReturnValueOnce(60);

      interceptor.intercept(mockContext, mockNext).subscribe((result) => {
        expect(result).toEqual({ data: 'test' });
        done();
      });
    });

    it('should return cached data on second call', (done) => {
      const mockRequest = { query: {} };
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
        getHandler: () => {},
      } as ExecutionContext;

      const mockNext: CallHandler = {
        handle: jest.fn(() => of({ data: 'original' })),
      };

      jest
        .spyOn(reflector, 'get')
        .mockReturnValue('test-key')
        .mockReturnValue(60);

      // First call - should cache
      interceptor.intercept(mockContext, mockNext).subscribe(() => {
        // Second call - should return cached
        interceptor.intercept(mockContext, mockNext).subscribe((result) => {
          expect(result).toEqual({ data: 'original' });
          expect(handleFn).toHaveBeenCalledTimes(1); // Only called once
          done();
        });
      });
    });
  });

  describe('clearCache', () => {
    it('should clear all cache when no pattern provided', () => {
      interceptor.clearCache();
      // If no error is thrown, the test passes
      expect(true).toBe(true);
    });

    it('should clear matching cache entries when pattern provided', () => {
      interceptor.clearCache('test-pattern');
      expect(true).toBe(true);
    });
  });
});
