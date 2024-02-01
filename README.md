# Sortable Buckets

## Summary

Sortable buckets is a **headless** input library that allows developers to have full control of the user interface experience. This means the library does not include components and styles. You can implement how you envision it to look and feel, while using this library to accelerate the backend logic for you.

This input allows you to create buckets which contain items that can be rearrange within the bucket it is nested in or even be moved to another bucket.

## Design Principles

This library implements the following design principles.

- **Headless** UI: Unstyled and unopinionated functional library giving full control to the developer on user interface design.
- **Framework Agnostic**: The core functional code is developed using Vanilla JavaScript meaning anyone could implement the library in their JavaScript code.
- **Framework Adapters**: Adapter libraries are implement to allow easy integration into popular frameworks, such as React.
- **Monorepo**: The core library and adapter libraries are under one code repository allowing for new features to be implemented and easily tested across all the different packages at once. New features could be push simultaneously.

## Development

Packages in the repository are managed by [pnpm](https://pnpm.io/) and [nx](https://nx.dev/). TypeScript is utilized as the programming language which is transpiled to JavaScript, bundled and minified for final deployment.

### Development Prerequisites

- [Node.js](https://nodejs.org/en/) (version 18)
  - [NVM](https://github.com/nvm-sh/nvm) is recommended for managing node versions
- [Pnpm](https://pnpm.io/)
  - Used as the package manager as oppose to NPM for performance and efficiency.

### Installation

To perform a install of dependencies using the locked versions in `package-lock.json`, run the following command from the root of the repository:

```
pnpm i
```

Note that all dependencies are set to allow only minor version updates. Running this command will also update the `pnpm-lock.yaml` to set the new version where an update may have been found.

### Build

Builds utilize the [rollup.js](https://rollupjs.org/) utility which is an extremely fast JavaScript bundler that handles all responsibilities such as transpilation and minification. The final build is outputted to the `build` directory for each package. To perform a build, run the following command:

```
pnpm run build
```

### Todos

- [ ] Add tests
- [ ] Add demo for Tailwind
- [ ] Support additional framework

<!---
### Test

#### Running Tests

To run all test suites, execute the following command:

```
pnpm run test
```

To run an individual test, use the following command structure:

```
pnpm run test -- test/src/index.test.ts
```
--->

### Quality

This library implements controls ensure code quality in this repository. These controls include lint, type and formatting checks.

#### Lint

[eslint](https://eslint.org/) is the library used to manage lint; the configuration is located in `.eslintrc.yaml` in the root of this repository. Lint can be checked with the following command:

```
pnpm run lint
```

In many cases, lint errors can be fixed automatically. To do so, run the following command:

```
pnpm run lint:fix
```

#### Code Formatting

[Prettier](https://prettier.io/) is utilized for code formatting to ensure a consistent style and eliminate the need to discuss code style in reviews; the configuration can be found in the `.prettierrc.yaml` file in the root of the repository. To format the code, run the following command:

```
pnpm run prettier-write
```

### Inspiration

This project was inspired by [TanStack](https://github.com/TanStack), specifically [TanStack Table](https://github.com/TanStack/table).

### References

- [How To Build Sortable Drag & Drop With Vanilla Javascript
  ](https://www.youtube.com/watch?v=jfYWwQrtzzY&t=1141s)
  by Web Dev Simplified
- [TanStack Table](https://github.com/TanStack/table) open-source repository
