import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator برای گرفتن sessionId از Cookie
 * اگر sessionId در Cookie وجود نداشت، null برمی‌گرداند
 */
export const SessionId = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    // sessionId می‌تواند از Cookie یا Header بیاید
    return (
      request?.cookies?.sessionId || request?.headers?.['x-session-id'] || null
    );
  },
);
