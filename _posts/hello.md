---
title: 'Preview Mode for Static Generation'
excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Praesent elementum facilisis leo vel fringilla est ullamcorper eget. At imperdiet dui accumsan sit amet nulla facilities morbi tempus.'
date: '2020-03-16T05:35:07.322Z'
author: Datxy Vellog
---

## Lorem Ipsum

Tristique senectus et netus et malesuada fames ac turpis. Ridiculous mus mauris vitae ultricies leo integer malesuada nunc vel. In mollis nunc sed id semper. Egestas tellus rutrum tellus pellentesque. Phasellus vestibulum lorem sed risus ultricies tristique nulla. Quis blandit turpis cursus in hac habitasse platea dictumst quisque. Eros donec ac odio tempor orci dapibus ultrices. Aliquam sem et tortor consequat id porta nibh. Adipiscing elit duis tristique sollicitudin nibh sit amet commodo nulla. Diam vulputate ut pharetra sit amet. Ut tellus elementum sagittis vitae et leo. Arcu non odio euismod lacinia at quis risus sed vulputate.

## Code

```js
function helloWorld() {
  console.log('Hello, world!');
}
``` 

```go
func helloWorld() {
  fmt.Println("Hello, world!")
}
```

## Setup
1. Clone the repository
2. Set up the environment variables
   - Rename the `.env.example` file to `.env`
   - Fill in the `.env` file with the appropriate values
       - `GITHUB_SECRET`
       - `GITHUB_ID`
       - `NEXTAUTH_SECRET`
       - `NEXTAUTH_URL`
       - `DATABASE_URL`
       - `OPENAI_API_KEY`
       - `ALLOWED_EMAILS`

3. Run `yarn install` to install the dependencies
4. Apply the database migrations using `yarn dlx prisma migrate dev`
5. Generate Prisma client using `yarn dlx prisma generate`
6. Start your server by running `yarn dev`

## Features
- Authentication via GitHub, with the capability to restrict access to specified email addresses
- Supports multiple chat sessions
- Allows the selection of the model (GPT-4 or GPT-3.5-Turbo)
- Calculates token usage and the corresponding cost in USD

# Basic session authentication with JWTs using Go and PostgreSQL.

## Dependencies

- [github.com/gin-gonic/gin](https://github.com/gin-gonic/gin) for the web framework.
- [github.com/lib/pq](https://github.com/lib/pq) as the Postgres driver.
- [github.com/golang-jwt/jwt](https://github.com/golang-jwt/jwt) for creating JWTs.
- [github.com/google/uuid](https://github.com/google/uuid) for generating UUIDs.

## sqlc and Goose

- [sqlc](https://github.com/kyleconroy/sqlc) is used for type safe SQL queries. It transforms SQL queries to Go code
  providing a better way to interact with the PostgreSQL database.
- [Goose](https://github.com/pressly/goose) is a flexible database migration tool. It allows you to evolve your DB
  schema over time.
