import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '@kafka2/prisma';
import { NotificationRepository } from './repositories/notification.repository';
import { NotificationService } from './services/notification.service';

@Module({
  imports: [PrismaModule],
  controllers: [AppController],
  providers: [AppService, NotificationRepository, NotificationService],
})
export class AppModule {}
