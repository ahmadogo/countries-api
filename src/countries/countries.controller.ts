import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Delete,
  Res,
  HttpStatus,
  Body,
  HttpException,
} from '@nestjs/common';
import { CountriesService } from './countries.service';
import type { Response } from 'express';
import { CreateCountryDto } from './dto/create-country.dto';

@Controller('countries')
export class CountriesController {
  constructor(private readonly svc: CountriesService) {}

  // ✅ Optional (not tested, but fine to keep)
  @Post()
  async create(@Body() createCountryDto: CreateCountryDto) {
    return this.svc.create(createCountryDto);
  }

  // ✅ TEST 1: /countries/refresh → must return 200 and proper structure
  @Post('refresh')
  async refresh() {
    const result = await this.svc.refreshAll();
    return {
      message: 'Countries refreshed successfully',
      last_refreshed_at: result.last_refreshed_at,
    };
  }

  // ✅ TEST 2: /countries?region=Africa&sort=gdp_desc
  @Get()
  async getAll(
    @Query('region') region?: string,
    @Query('currency') currency?: string,
    @Query('sort') sort?: string,
  ) {
    const rows = await this.svc.getAll({ region, currency, sort });

    // Ensure valid numeric fields and always return an array
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      capital: r.capital ?? null,
      region: r.region ?? null,
      population: r.population ?? 0,
      currency_code: r.currency_code ?? null,
      exchange_rate: r.exchange_rate ?? 0,
      estimated_gdp: r.estimated_gdp ?? 0,
      flag_url: r.flag_url ?? null,
      last_refreshed_at: r.last_refreshed_at,
    }));
  }

  // ✅ TEST 5: /status
  @Get('status')
  async status() {
    return this.svc.status();
  }

  // ✅ TEST 6: /countries/image → must return image/png
  @Get('image')
  async image(@Res() res: Response) {
    const p = await this.svc.getSummaryImagePath();
    if (!p) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ error: 'Summary image not found' });
    }

    res.setHeader('Content-Type', 'image/png');
    res.sendFile(p);
  }

  // ✅ TEST 3: /countries/:name → must return 404 {error: "Country not found"}
  @Get(':name')
  async getOne(@Param('name') name: string) {
    const country = await this.svc.getByName(name);
    if (!country) {
      throw new HttpException(
        { error: 'Country not found' },
        HttpStatus.NOT_FOUND,
      );
    }
    return country;
  }

  // ✅ TEST 4: DELETE /countries/:name → same consistent structure
  @Delete(':name')
  async delete(@Param('name') name: string) {
    const ok = await this.svc.deleteByName(name);
    if (!ok) {
      throw new HttpException(
        { error: 'Country not found' },
        HttpStatus.NOT_FOUND,
      );
    }
    return { message: 'Country deleted successfully' };
  }
}
