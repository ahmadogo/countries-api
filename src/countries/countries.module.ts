import { Module } from '@nestjs/common';
import { CountriesService } from './countries.service';
import { CountriesController } from './countries.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Country } from './entities/country.entity';
import { StatusController } from 'src/status/status.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Country])],
  controllers: [CountriesController,StatusController],
  providers: [CountriesService],
  exports: [CountriesService],
})
export class CountriesModule {}
