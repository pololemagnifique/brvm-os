import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertsEngineService } from './alerts-engine.service';
import { AlertsEngineController } from './alerts-engine.controller';
import { DiscordNotifierService } from './discord-notifier.service';
import { Alert } from '../alerts/alert.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Alert])],
  controllers: [AlertsEngineController],
  providers: [AlertsEngineService, DiscordNotifierService],
  exports: [AlertsEngineService, DiscordNotifierService],
})
export class AlertsEngineModule {}
