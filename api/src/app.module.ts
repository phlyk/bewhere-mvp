import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AreasModule } from './areas';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import { CrimesModule } from './crimes';
import { EtlModule } from './etl';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig],
      envFilePath: ['.env', '../.env'],
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Never auto-sync in production; use migrations
        logging: configService.get<string>('app.nodeEnv') === 'development',
      }),
      inject: [ConfigService],
    }),

    // Feature modules
    AreasModule,
    CrimesModule,
    EtlModule,
    HealthModule,
  ],
})
export class AppModule {}
