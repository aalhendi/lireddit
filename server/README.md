# Lireddit

## Frameworks Used

- Express
- GraphQL
- Apollo
- GiraphQL
- Prisma

## Getting Started

Copy the `.env.example` file to create a local file with enviroment variables `.env`. To do so, run the following command at the project root.

```bash
cp .env.example .env
```

Don't forget to update the data in `.env`.

## Available Scripts

### `yarn watch`

Compiles the Typescript code and watches for changes.

### `yarn dev`

Runs the Javascript app in development mode via nodemon.\
Access via [http://localhost:8000](http://localhost:8000), or `http://localhost:PORT` where PORT is the port specified in `.env`.

The app will reload if you make edits.
