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
} from '@nestjs/common';
import { CountriesService } from './countries.service';
import type { Response } from 'express';
import { CreateCountryDto } from './dto/create-country.dto';

@Controller('countries')
export class CountriesController {
  constructor(private readonly svc: CountriesService) {}

  @Post()
  async create(@Body() createCountryDto: CreateCountryDto) {
    return this.svc.create(createCountryDto);
  }

  @Post('refresh')
  public async refresh() {
    // This endpoint returns 200 on success; 503 handled in service
    const result = await this.svc.refreshAll();
    return { success: true, last_refreshed_at: result.last_refreshed_at };
  }

  @Get()
  async getAll(
    @Query('region') region: string,
    @Query('currency') currency: string,
    @Query('sort') sort: string,
  ) {
    const rows = await this.svc.getAll({ region, currency, sort });
    return rows;
  }

  @Get('/status')
  async status() {
    return this.svc.status();
  }

  @Get('image')
  async image(@Res() res: Response) {
    const p = await this.svc.getSummaryImagePath();
    if (!p) {
      res
        .status(HttpStatus.NOT_FOUND)
        .json({ error: 'Summary image not found' });
      return;
    }
    res.sendFile(p);
  }

  @Get(':name')
  async getOne(@Param('name') name: string) {
    const c = await this.svc.getByName(name);
    if (!c) {
      return { statusCode: 404, error: 'Country not found' };
    }
    return c;
  }

  @Delete(':name')
  async delete(@Param('name') name: string) {
    const ok = await this.svc.deleteByName(name);
    if (!ok) {
      return { statusCode: HttpStatus.NOT_FOUND, error: 'Country not found' };
    }
    return { success: true };
  }
}
