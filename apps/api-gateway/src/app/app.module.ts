import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PrismaModule } from '@kafka2/prisma';

@Module({
  imports: [
    PrismaModule,
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'api-gateway-producer',
            brokers: ['localhost:9092'],
          },
          consumer: {
            groupId: 'api-gateway-consumer-group',
            allowAutoTopicCreation: true,
            sessionTimeout: 30000,
            heartbeatInterval: 3000,
          },
          producer: {
            allowAutoTopicCreation: true,
          },
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
