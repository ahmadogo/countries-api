import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Not, IsNull } from 'typeorm';
import axios from '../common/config/axios.config';
import https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { createCanvas } from 'canvas';
import { Country } from './entities/country.entity';
import { CreateCountryDto } from './dto/create-country.dto';

@Injectable()
export class CountriesService {
  private readonly logger = new Logger(CountriesService.name);
  private readonly countriesApi =
    'https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies';
  private readonly ratesApi = 'https://open.er-api.com/v6/latest/USD';

  // ✅ create a reusable HTTPS agent
  private readonly httpsAgent = new https.Agent({
    rejectUnauthorized: true, // keep SSL validation secure
  });

  constructor(
    @InjectRepository(Country)
    private readonly repo: Repository<Country>,

    private readonly dataSource: DataSource,
  ) {}

  async create(createCountryDto: CreateCountryDto) {
    const country = this.repo.create(createCountryDto);
    return this.repo.save(country);
  }

  public async fetchExternalData() {
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false, // allows corporate proxy certs
      secureProtocol: 'TLSv1_2_method', // force TLS 1.2
    });

    try {
      const [countriesResp, ratesResp] = await Promise.all([
        axios.get(this.countriesApi, { timeout: 15000, httpsAgent }),
        axios.get(this.ratesApi, { timeout: 15000, httpsAgent }),
      ]);

      return { countries: countriesResp.data, rates: ratesResp.data };
    } catch (err) {
      const source = err.config?.url ?? 'external API';
      this.logger.error('External API fetch failed', err);
      throw new HttpException(
        {
          error: 'External data source unavailable',
          details: `Could not fetch data from ${source}`,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  public async refreshAll() {
    const { countries, rates } = await this.fetchExternalData();
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const now = new Date();

      for (const c of countries) {
        const name = c.name;
        const capital = c.capital ?? null;
        const region = c.region ?? null;
        const population = c.population ?? 0;
        const flag_url = c.flag ?? null;

        let currency_code: string | null = null;
        let exchange_rate: number | null = null;
        let estimated_gdp: number | null = null;

        if (Array.isArray(c.currencies) && c.currencies.length > 0) {
          currency_code = c.currencies[0]?.code ?? null;
          if (currency_code) {
            const foundRate = this.getRateForCode(rates, currency_code);
            if (foundRate !== null && typeof foundRate === 'number') {
              exchange_rate = foundRate;
              const multiplier = this.randomMultiplier();
              estimated_gdp = (population * multiplier) / exchange_rate;
            } else {
              exchange_rate = null;
              estimated_gdp = null;
            }
          } else {
            currency_code = null;
            exchange_rate = null;
            estimated_gdp = 0;
          }
        } else {
          currency_code = null;
          exchange_rate = null;
          estimated_gdp = 0;
        }

        const existing = await queryRunner.manager.findOne(Country, {
          where: { name: name },
        });

        if (existing) {
          existing.capital = capital;
          existing.region = region;
          existing.population = population;
          existing.currency_code = currency_code;
          existing.exchange_rate = exchange_rate;
          existing.estimated_gdp = estimated_gdp;
          existing.flag_url = flag_url;
          existing.last_refreshed_at = now;
          await queryRunner.manager.save(existing);
        } else {
          const toInsert = queryRunner.manager.create(Country, {
            name,
            capital,
            region,
            population,
            currency_code,
            exchange_rate,
            estimated_gdp,
            flag_url,
            last_refreshed_at: now,
          });
          await queryRunner.manager.save(toInsert);
        }
      }

      await queryRunner.commitTransaction();
      await this.generateSummaryImage();

      return { success: true, last_refreshed_at: new Date().toISOString() };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Refresh failed, rolled back', err);
      throw new HttpException(
        {
          error: 'External data source unavailable',
          details: 'Failed during refresh',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    } finally {
      await queryRunner.release();
    }
  }

  private getRateForCode(rates: any, code: string): number | null {
    return rates?.rates?.[code] ?? null;
  }

  private randomMultiplier(): number {
    return Math.floor(Math.random() * (2000 - 1000 + 1)) + 1000;
  }

  private async generateSummaryImage() {
    const count = await this.repo.count();
    const topCountries = await this.repo.find({
      where: { estimated_gdp: Not(IsNull()) },
      order: { estimated_gdp: 'DESC' },
      take: 5,
    });

    const canvas = createCanvas(600, 400);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 600, 400);
    ctx.fillStyle = '#000';
    ctx.font = '20px Arial';
    ctx.fillText(`Total Countries: ${count}`, 50, 50);
    ctx.fillText('Top 5 Countries by Estimated GDP:', 50, 100);

    topCountries.forEach((c, i) => {
      ctx.fillText(
        `${i + 1}. ${c.name} - ${c.estimated_gdp?.toFixed(2)}`,
        50,
        140 + i * 30,
      );
    });

    const now = new Date().toISOString();
    ctx.fillText(`Last Refresh: ${now}`, 50, 340);

    const cacheDir = path.join(process.cwd(), 'cache');
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
    const imagePath = path.join(cacheDir, 'summary.png');
    fs.writeFileSync(imagePath, canvas.toBuffer('image/png'));
  }

  public async getAll(filters: {
    region?: string;
    currency?: string;
    sort?: string;
  }) {
    const qb = this.repo.createQueryBuilder('c');

    if (filters.region) {
      qb.andWhere('c.region = :region', { region: filters.region });
    }
    if (filters.currency) {
      qb.andWhere('c.currency_code = :currency', {
        currency: filters.currency,
      });
    }

    if (filters.sort === 'gdp_desc') {
      qb.orderBy('c.estimated_gdp', 'DESC').addOrderBy(
        'c.estimated_gdp IS NULL',
        'ASC',
      );
    } else {
      qb.orderBy('c.name', 'ASC');
    }

    const rows = await qb.getMany();
    return rows;
  }

  public async getByName(name: string) {
    const country = await this.repo
      .createQueryBuilder('c')
      .where('LOWER(c.name) = LOWER(:name)', { name })
      .getOne();
    return country;
  }

  public async deleteByName(name: string) {
    const res = await this.repo
      .createQueryBuilder()
      .delete()
      .from(Country)
      .where('LOWER(name) = LOWER(:name)', { name })
      .execute();
    return res.affected && res.affected > 0;
  }

  public async status() {
    const total = await this.repo.count();
    const last = await this.repo
      .createQueryBuilder('c')
      .select('MAX(c.last_refreshed_at)', 'last_refreshed_at')
      .getRawOne();

    return {
      total_countries: total,
      last_refreshed_at: last?.last_refreshed_at ?? null,
    };
  }

  public async getSummaryImagePath(): Promise<string | null> {
    const p = path.resolve(process.cwd(), 'cache', 'summary.png');
    return fs.existsSync(p) ? p : null;
  }
}
