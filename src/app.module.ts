import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CountriesModule } from './countries/countries.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { stat } from 'fs';
import { StatusController } from './status/status.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');
        if (databaseUrl) {
          const ssl =
            config.get('NODE_ENV') === 'production'
              ? { rejectUnauthorized: false }
              : undefined;
          return {
            type: 'postgres' as const,
            url: databaseUrl,
            autoLoadEntities: true,
            synchronize: true,
          };
        }

        return {
          type: 'postgres' as const,
          host: config.get<string>('DATABASE_HOST') ?? 'localhost',
          port: Number(config.get<number>('DATABASE_PORT') ?? 5432),
          username: config.get<string>('DATABASE_USER'),
          password: config.get<string>('DATABASE_PASSWORD'),
          database: config.get<string>('DATABASE_NAME'),
          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),
    CountriesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
