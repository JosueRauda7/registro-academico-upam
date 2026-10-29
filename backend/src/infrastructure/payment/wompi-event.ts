import { createHash, timingSafeEqual } from 'crypto';
import { BadRequestException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';

/** Wompi.co event checksum contract. No fallback to unauthenticated events. */
export function verifyWompiEvent(payload: any, secret: string): { id: string } {
  if (!secret) throw new ServiceUnavailableException('Webhook de pagos no configurado');
  const signature = payload?.signature;
  const properties = signature?.properties;
  if (!Array.isArray(properties) || properties.length === 0 || properties.length > 32 ||
      !Number.isSafeInteger(payload.timestamp) ||
      typeof signature.checksum !== 'string' || !/^[a-f0-9]{64}$/i.test(signature.checksum)) {
    throw new UnauthorizedException('Firma de evento inválida');
  }
  const values = properties.map((path: unknown) => {
    if (typeof path !== 'string' || !/^[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*$/.test(path)) {
      throw new UnauthorizedException('Propiedad de firma inválida');
    }
    let value: any = payload.data;
    for (const key of path.split('.')) {
      if (!value || !Object.prototype.hasOwnProperty.call(value, key)) {
        throw new UnauthorizedException('Propiedad de firma inexistente');
      }
      value = value[key];
    }
    if (!['string', 'number', 'boolean'].includes(typeof value)) {
      throw new UnauthorizedException('Propiedad de firma inválida');
    }
    return String(value);
  });
  // The transaction identity used for lookup must itself be authenticated.
  if (!properties.includes('transaction.id')) throw new UnauthorizedException('Transacción no firmada');
  const expected = createHash('sha256').update(values.join('') + payload.timestamp + secret).digest();
  if (!timingSafeEqual(expected, Buffer.from(signature.checksum, 'hex'))) {
    throw new UnauthorizedException('Firma de evento inválida');
  }
  if (payload.event !== 'transaction.updated' ||
      typeof payload.data?.transaction?.id !== 'string' ||
      !/^[a-zA-Z0-9-]{1,128}$/.test(payload.data.transaction.id)) {
    throw new BadRequestException('Evento de pago inválido');
  }
  return { id: payload.data.transaction.id };
}
