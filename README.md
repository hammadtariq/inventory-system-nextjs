# Inventory System

Need to install following for this repository:

- Node.js version 14 or above
- NPM or YARN
- Docker and Docker-Compose
- Sequelize cli

##### Instructions for development server

Clone this repository:

```sh
git clone https://github.com/hammadtariq/inventory-system-nextjs.git
```

Install sequelize-cli globally

```sh
sudo yarn global add sequelize-cli
# or
sudo npm i sequelize-cli -g
```

Install `Docker` and `Docker-Compose` for Potsgres Database\
[Get Docker](https://docs.docker.com/get-docker/)

Create `.env` file in root directory for environment variables

```sh
.env
```

Write environment variables in .env file

```sh
POSTGRES_DB=databasename
POSTGRES_USER=username
POSTGRES_PASSWORD=password
TOKEN_SECRET=minimum-32-characters-long-token-secret
```

Setup postgres locally

```sh
brew install postgres
psql postgres # enter in psql terminal for first time
create database "databasename";
create user myuser with encrypted password 'postgres';
grant all privileges on database "databasename" to myuser;
```

OR

Run the following command to create postgres container

```sh
docker-compose up -d
```

It will create docker container for postgres and docker volume to persist the data locally

Now install project dependencies

```sh
yarn install
# or
npm install
```

Run migrations for first time

```sh
sequelize db:migrate:undo:all
sequelize db:migrate
sequelize db:seed:all
```

Finally, start the development server:

```sh
yarn dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## create Models from sequelize cli

sequelize model:generate --name Sale --attributes customerId:integer,totalAmount:float,soldProducts:string
