import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { InfrastructureModule } from '../../infrastructure/infrastructure.module';

@Module({
  imports: [
    DatabaseModule,
    InfrastructureModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET', '');
        if (Buffer.byteLength(secret) < 32) throw new Error('JWT_SECRET debe contener al menos 32 bytes y generarse aleatoriamente');
        return { secret, signOptions: { algorithm: 'HS256' as const,
          expiresIn: configService.get<string>('JWT_EXPIRATION', '24h') } };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
