import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateCountryDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  capital?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsNotEmpty()
  @IsNumber()
  population: number;

  @IsNotEmpty()
  @IsString()
  currency_code: string;
}
