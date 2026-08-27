import { Module } from '@nestjs/common';
import { EmailService } from './email/email.service';
import { WompiGateway } from './payment/wompi.gateway';

const services = [EmailService, WompiGateway];

@Module({
  providers: services,
  exports: services,
})
export class InfrastructureModule {}
