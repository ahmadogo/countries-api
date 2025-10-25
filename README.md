## Description
A RESTful API's that fetches country data from an external API, stores it in a database, and execute CRUD operations.


## Features
- Fetch countries from restcountries.com and exchange rates from open.er-api.com
- Cache data into Postgres; compute `estimated_gdp`
- Endpoints: refresh, list/filter/sort, get-by-name, delete, status, summary image
- Image generated at `cache/summary.png` after refresh


## Requirements
- Node 18+
- Postgres
- npm/yarn
- (for node-canvas) system libs: cairo, pango, libpng, jpeg (see node-canvas docs)


## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment


```bash
$ npm install -g @nestjs/mau
$ mau deploy
```



## Resources



## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
