import { Controller, Get } from '@nestjs/common';
import { CountriesService } from '../countries/countries.service';

@Controller()
export class StatusController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get('status')
  async getStatus() {
    return this.countriesService.status();
  }
}
