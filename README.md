# @codehivetx/barrelcactus-watermeter

What is this?

This monitors two things for a rainwater system:

- supply (volume of water available, based on height of water level in the tank)
- consumption (volume used - such as from a normal residential water meter).

For this specific implementation, we use:
- a 4-20ma pressure transducer measuring water column (in inches). Multiply this by water surface area to get volume.
- a click-per-gallon water meter- a normal water meter, but a contact that closes once per gallon.
- an rPi 5

## How to wire, setup, configure?

TODO, TODO, TODO!!!!

- edit `local-config.json` and see the `TankConfig` object for details.
- opengpio has some special setup instructions (TODO!) for v2.1 lib

## How i made it

This application is generated using [LoopBack 4 CLI](https://loopback.io/doc/en/lb4/Command-line-interface.html) with the
[initial project layout](https://loopback.io/doc/en/lb4/Loopback-application-layout.html).

## Install dependencies

By default, dependencies were installed when this application was generated.
Whenever dependencies in `package.json` are changed, run the following command:

```sh
npm install
```

To only install resolved dependencies in `package-lock.json`:

```sh
npm ci
```

## Run the application

```sh
npm start
```

You can also run `node .` to skip the build step.

Open http://127.0.0.1:3000 in your browser.

## Rebuild the project

To incrementally build the project:

```sh
npm run build
```

To force a full build by cleaning up cached artifacts:

```sh
npm run rebuild
```

## Fix code style and formatting issues

```sh
npm run lint
```

To automatically fix such issues:

```sh
npm run lint:fix
```

## Other useful commands

- `npm run migrate`: Migrate database schemas for models
- `npm run openapi-spec`: Generate OpenAPI spec into a file
- `npm run docker:build`: Build a Docker image for this application
- `npm run docker:run`: Run this application inside a Docker container

## Tests

```sh
npm test
```

## What's next

Please check out [LoopBack 4 documentation](https://loopback.io/doc/en/lb4/) to
understand how you can continue to add features to this application.

[![LoopBack](https://github.com/loopbackio/loopback-next/raw/master/docs/site/imgs/branding/Powered-by-LoopBack-Badge-(blue)-@2x.png)](http://loopback.io/)
