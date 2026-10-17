import { ValidationPipe } from '@nestjs/common';

/** Shared by bootstrap and auth contract regression coverage. */
export function createRequestValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  });
}
