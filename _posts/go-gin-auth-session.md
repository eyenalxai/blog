---
title: 'Basic session authentication in Go using Gin, PostgreSQL and JWTs'
excerpt: 'You will be forced to set up and manage your database migrations, write SQL queries, copy and paste Go code, use curl, hash passwords and set cookies with JWTs inside them.'
date: '2023-07-17'
author: Datxy Vellog
---

# Basic session authentication in Go using Gin, PostgreSQL and JWTs 

You will be forced to set up and manage your database migrations, write SQL queries, copy and paste Go code, use curl, hash passwords and set cookies with JWTs inside them.

I expect you to have Go is installed and that you can run programs from your terminal you installed using `go install`. 
You should also know how to set up PostgreSQL or at least have Docker working.

I don't know how to create a new Go project, so I open GoLand, click New Project, select Go (not Go (GOPATH)). 
You can create a project however you want, and name it whatever you want, but naming it `go-auth` will make copying code easier for you.

Like any good project, this one begins with writing SQL (pronounced *squeal*).

We will be using [goose](https://github.com/pressly/goose) to manage our migrations. Install it with:
```bash
go install github.com/pressly/goose/v3/cmd/goose@latest
```

Create a directory for your migrations

```bash
mkdir .migrations
```

Initiate phase 1
```bash
goose -dir .migrations create initial sql
```

You'll get a file like `20230717232616_initial.sql`, open it up.

Add the following:
```sql
-- +goose Up
-- +goose StatementBegin
create table users
(
    id            uuid primary key,
    created_at    timestamptz default now(),
    username      text not null check ( char_length(username) >= 1 AND char_length(username) <= 32),
    password_hash text not null,
    unique (username)
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
drop table users;
-- +goose StatementEnd
```

* UUIDs are longer than integers, that means nothing, but they're
* `created_at` just because it's useful to know how to do it
* length checks on username for the same reason
* `password_hash` because I was told you shouldn't store passwords 
in plaintext
* `unique` will create a unique index on username for username uniqueness and improved querying speed

Create a database whatever way you want, I'm using Docker:
```bash
docker run --name whatever-postgres -p 5432:5432 -e POSTGRES_PASSWORD=mysecretpassword -d postgres
```

Set up `.env.local` file in the root of the project as follows:
```bash
DATABASE_URL=postgresql://postgres:mysecretpassword@localhost:5432/postgres?sslmode=disable

GOOSE_DRIVER=postgres
GOOSE_DBSTRING=postgresql://postgres:mysecretpassword@localhost:5432/postgres?sslmode=disable
```
If you caught doing `sslmode=disable` in production don't try to make me your fall guy.

Run:
```bash
env $(cat .env.local | xargs) goose -dir .migrations up
```

Observe output:
```bash
2023/07/17 23:32:24 OK   20230717232616_initial.sql (7.25ms)
2023/07/17 23:32:24 goose: no migrations to run. current version: 20230717232616
```

To generate Go query functions from SQL queries, we'll be using [sqlc](https://github.com/kyleconroy/sqlc). Install it with:
```bash
go install github.com/kyleconroy/sqlc/cmd/sqlc@latest
```

Create a directory called `sql` inside the root of the project, inside the directory create a file called `query.sql`, inside the file put this:
```sql
-- name: GetUser :one
SELECT *
FROM users
WHERE username = $1
LIMIT 1;

-- name: CreateUser :one
INSERT INTO users (id, username, password_hash)
VALUES ($1, $2, $3)
RETURNING *;
```

Here we have two queries, one to get a user by username, and one to create one.

In order for `sqlc` to work, you'll need to make a configuration file. Should be called `sqlc.yaml`, place it in the root of the project.
```yaml
version: "2"
sql:
  - schema: ".migrations"
    queries: "sql/query.sql"
    engine: "postgresql"
    gen:
      go:
        package: "users"
        out: "postgresql"
    database:
      uri: "postgresql://postgres:postgres@localhost:5432/postgres?sslmode=disable"
    rules:
      - sqlc/db-prepare
```

We set the directories for our existing migrations, the future queries folder, and specified a package name for the generated Go code.

Just some code:
```bash
sqlc generate
```

Observe stuff generated in `postgresql` directory.

Might as well install [uuid](https://github.com/google/uuid) package now:
```bash
go get github.com/google/uuid
```

And [pq](https://github.com/lib/pq):
```bash
go get github.com/lib/pq
```

And [gin](https://github.com/gin-gonic/gin) while we're at it:
```bash
go get github.com/gin-gonic/gin
```

In the project's root, create a `main.go` file, type this manually:
```go
package main

import (
  "net/http"

  "github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})
  
	err = r.Run()
	if err != nil {
		log.Println(err.Error())
		return
	}
}
```

Force CPU to do some work:
```bash
go run .
```

Ping:
```bash
curl localhost:8080/ping
```

Pong:
```json
{"message":"pong"}
```

JWTs can't keep a secret on their own:
```bash
openssl rand -hex 32
```

If you don't have `openssl`, ask your cat to walk on your keyboard for a while.

Add the output to `.env.local`. The complete file should be as follows:
```bash
DATABASE_URL=postgresql://postgres:mysecretpassword@localhost:5432/postgres?sslmode=disable
JWT_SECRET=f54df07e62beb742fe5e0453c2a56a00f787607a28c18b5cb073086a37206d07

GOOSE_DRIVER=postgres
GOOSE_DBSTRING=postgresql://postgres:mysecretpassword@localhost:5432/postgres?sslmode=disable
```
Don't touch it ever again.

We need a thing to handle JWTs for us, we'll use a thing called [jwt](https://github.com/golang-jwt/jwt):
```bash
go get github.com/golang-jwt/jwt
```

Future insides of `utils/jwt.go`:
```go
package utils

import (
	"errors"
	"github.com/golang-jwt/jwt"
	"os"
)

func GetToken(username, jwtSecret string) (string, error) {
	token := jwt.New(jwt.SigningMethodHS256)
	claims := token.Claims.(jwt.MapClaims)
	claims["username"] = username

	return token.SignedString([]byte(jwtSecret))
}

func GetJWTSecret() (string, error) {
	jwtSecret, exists := os.LookupEnv("JWT_SECRET")
	if !exists {
		return "", errors.New("environment variable JWT_SECRET not set")
	}

	return jwtSecret, nil
}
```

Create file `database.go` in the same folder:
```go
package utils

import (
	"database/sql"
	"errors"
	users "go-auth/postgresql"
	"os"
)

func GetDbConnection() (*users.Queries, error) {
	databaseURL, exists := os.LookupEnv("DATABASE_URL")
	if !exists {
		return nil, errors.New("environment variable DATABASE_URL not set")
	}

	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, err
	}

	queries := users.New(db)

	return queries, nil
}
```

Capitalized function names mean they are public, which means they can be used outside of the package. 
This setup is unideal — Pob Rike should note this discontent.

Back to `main.go`.

Remove the ping route, we don't need it anymore, also import `github.com/lib/pq`, it'll provide us with a database driver for PostgreSQL.
```go
package main

import (
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	"go-auth/utils"
	"log"
)

func main() {
	jwtSecret, err := utils.GetJWTSecret()
	if err != nil {
		log.Println(err.Error())
		return
	}

	queries, err := utils.GetDbConnection()
	if err != nil {
		log.Println(err.Error())
		return
	}

	r := gin.Default()

	err = r.Run()
	if err != nil {
		log.Println(err.Error())
		return
	}
}
```
Why does it have to be `_` in the import?

And if you knew how I hate error handling in Go, you would've cried.

We need something to hash passwords with, I chose `bcrypt`. It utilizes power of crypto blockchain crypto technology to hash passwords, so it's very secure. 

Let's install it:
```bash
go get golang.org/x/crypto/bcrypt
```

Inside `utils` folder create a file `password.go`

```go
package utils

import (
	"golang.org/x/crypto/bcrypt"
)

func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14)
	return string(bytes), err
}

func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
```

Let's create a handler to handle registration.

Make a folder `types` in the root of the project, inside it create a file called `credentials.go`

Create a `types` folder with a file `credentials.go` and a `handlers` folder with a file `auth.go` in the project root. Your `credentials.go` should contain:
```go
package types

type Credentials struct {
	Username string `json:"username"`
	Password string `json:"password"`
}
```

`auth.go`
```go
package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	users "go-auth/postgresql"
	"go-auth/types"
	"go-auth/utils"
	"log"
	"net/http"
	"time"
)

func RegisterHandler(q *users.Queries, jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		var cred types.Credentials

		if err := c.BindJSON(&cred); err != nil {
			log.Println(err.Error())
			c.JSON(400, gin.H{"error": "credentials oopsie"})
			return
		}

		hashedPassword, err := utils.HashPassword(cred.Password)

		if err != nil {
			log.Println(err.Error())
			c.JSON(500, gin.H{"error": "password hashing oopsie"})
			return
		}

		uuidUser := uuid.New()
		params := users.CreateUserParams{
			ID:           uuidUser,
			Username:     cred.Username,
			PasswordHash: hashedPassword,
		}

		_, err = q.CreateUser(c, params)

		if err != nil {
			log.Println(err.Error())
			c.JSON(500, gin.H{"error": "user creation oopsie"})
			return
		}

		tokenString, err := utils.GetToken(cred.Username, jwtSecret)

		if err != nil {
			log.Println(err.Error())
			c.JSON(500, gin.H{"error": "token creation oopsie"})
			return
		}

		if err != nil {
			log.Println(err.Error())
			c.JSON(500, gin.H{"error": "token creation oopsie"})
			return
		}

		http.SetCookie(c.Writer, &http.Cookie{
			Name:     "session",
			Value:    tokenString,
			Expires:  time.Now().Add(7 * 24 * time.Hour),
			Secure:   true,
			HttpOnly: true,
			SameSite: http.SameSiteStrictMode,
		})

		c.JSON(201, gin.H{"status": "user created"})
	}
}
```
That's a lot of code, let's break it down.

1. First we create a struct to hold credentials, it's a good practice to have a separate struct for that, because you don't want to expose your database schema to the outside world.
2. Then we create a handler function, which takes a pointer to `users.Queries`, and JWT secret as arguments and returns a `gin.HandlerFunc`. We created both of these in `main.go`, so we can pass them to the handler.
3. Then we bind the request body to the `cred` struct, if it fails, we return a 400 error.
4. Then we hash the password, if it fails for whatever reason, we return a 500 error.
5. Then we create a UUID for the user, and create a `users.CreateUserParams` struct, which is generated by `sqlc` and contains all the fields we need to create a user.
6. Then we call `q.CreateUser` which is generated by `sqlc` and creates a user in the database, if it fails, we return a 500 error.
7. Then we create a JWT token, if it fails, we return a 500 error.
8. Then we create a cookie with the JWT token inside, and return a 201 status code. Cookie will be attached to response.
9. That was seven then's in a row.

The browser will attach any received cookies from response to subsequent requests automatically. However, `Secure: true` ensures that cookies are sent only over HTTPS, but this only applies to browser interactions. For tools like curl or Postman, cookies must be manually sent and HTTPS isn't obligatory. Hell yeah, security!


Let's bind the handler to a route in `main.go`:
```go
package main

import (
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	"go-auth/handlers"
	"go-auth/utils"
	"log"
)

func main() {
	jwtSecret, err := utils.GetJWTSecret()
	if err != nil {
		log.Println(err.Error())
		return
	}

	queries, err := utils.GetDbConnection()
	if err != nil {
		log.Println(err.Error())
		return
	}

	r := gin.Default()

	r.POST("/register", handlers.RegisterHandler(queries, jwtSecret))

	err = r.Run()
	if err != nil {
		log.Println(err.Error())
		return
	}
}

```

Run the thing:
```bash
env $(cat .env.local | xargs) go run .
```

Do the curl:
```bash
curl -c cookies.txt -X POST -H "Content-Type: application/json" -d '{"username": "boofer", "password": "hunter2"}' http://localhost:8080/register
```

Stare at the output:
```json
{"status":"user created"}
```

Also, we saved the cookie to `cookies.txt`, so we can use them later.

Do the curl again:
```bash
curl -c cookies.txt -X POST -H "Content-Type: application/json" -d '{"username": "boofer", "password": "hunter2"}' http://localhost:8080/register
```

Funny message:
```json
{"error":"user creation oopsie"}
```

So far so good, we can create users, but we can't log in.

Let's add login functionality.

Back to `utils/password.go`, add this:
```go
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
```

Inside `handlers/auth.go` add that:
```go
func LoginHandler(q *users.Queries, jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		var cred types.Credentials

		if err := c.BindJSON(&cred); err != nil {
			log.Println(err.Error())
			c.JSON(400, gin.H{"error": "invalid credentials"})
			return
		}

		user, err := q.GetUser(c, cred.Username)

		if err != nil {
			log.Println(err.Error())
			c.JSON(500, gin.H{"error": "failed to retrieve user"})
			return
		}

		if !utils.CheckPasswordHash(cred.Password, user.PasswordHash) {
			log.Println("invalid password")
			c.JSON(403, gin.H{"error": "wrong password"})
			return
		}

		tokenString, err := utils.GetToken(cred.Username, jwtSecret)

		if err != nil {
			log.Println(err.Error())
			c.JSON(500, gin.H{"error": "failed to generate token"})
			return
		}

		http.SetCookie(c.Writer, &http.Cookie{
			Name:     "session",
			Value:    tokenString,
			Expires:  time.Now().Add(7 * 24 * time.Hour),
			Secure:   true,
			HttpOnly: true,
			SameSite: http.SameSiteStrictMode,
		})

		c.JSON(200, gin.H{"status": "login successful"})
	}
}
```

1. Again it takes a pointer to `users.Queries` and jwt secret as arguments and returns a `gin.HandlerFunc`.

2. Then we bind the request body to the `cred` struct, if it fails, we return a 400 error.

3. Then we call `q.GetUser` which is generated by `sqlc` and retrieves a user from the database, if it fails, we return a 500 error.

4. Then we check if the password is correct, if it's not, we return a 403 error.

5. Then we create a JWT token, if it fails, we return a 500 error.

6. Then we create a cookie with the token, and return a 200 status code.

7. Another streak of then's!

Edit `main.go`
```go
...unchanged
	r.POST("/register", handlers.RegisterHandler(queries, jwtSecret))
	r.POST("/login", handlers.LoginHandler(queries, jwtSecret))

	err = r.Run()
...unchanged
```

Run the thing if you killed it. If you didn't then kill it and run it again. There a way to do hot reloads, but I won't tell you.
```bash
env $(cat .env.local | xargs) go run .
```

```bash
curl -c cookies.txt -X POST -H "Content-Type: application/json" -d '{"username": "oofer", "password": "hunter3"}' http://localhost:8080/login
```
```json
{"error":"failed to retrieve user"}
```
What do you mean failed?

```bash
curl -c cookies.txt -X POST -H "Content-Type: application/json" -d '{"username": "boofer", "password": "hunter3"}' http://localhost:8080/login
```
```json
{"error":"wrong password"}
```
Eh?

```bash
curl -c cookies.txt -X POST -H "Content-Type: application/json" -d '{"username": "boofer", "password": "hunter2"}' http://localhost:8080/login
```
```json
{"status":"login successful"}
```
There was no need to save the cookies to a file during registration all along!

Anyway, let's add some protected routes. Actually, let's add a middleware first.

To `middlewares/auth.go` we go:

```go
package middleware

import (
	"errors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt"
	"net/http"
)

func AuthRequired(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		cookie, err := c.Request.Cookie("session")

		if err != nil {
			if errors.Is(err, http.ErrNoCookie) {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "no session cookie found"})
				c.Abort()
				return
			}

			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get session cookie"})
			c.Abort()
			return
		}

		tokenStr := cookie.Value
		claims := &jwt.MapClaims{}

		_, err = jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (any, error) {
			return []byte(jwtSecret), nil
		})

		if err != nil {
			if errors.Is(err, jwt.ErrSignatureInvalid) {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid session token"})
				c.Abort()
				return
			}

			c.JSON(http.StatusBadRequest, gin.H{"error": "bad request"})
			c.Abort()
			return
		}

		c.Set("username", (*claims)["username"])
		c.Next()
	}
}
```

Figure what it does on your own.

To `handlers/protected.go`

```go
package handlers

import (
	"github.com/gin-gonic/gin"
	"net/http"
)

func ProtectedHandler(c *gin.Context) {
	username, exists := c.Get("username")
	if !exists {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get username"})
		return
	}
	c.JSON(200, gin.H{"status": "success", "username": username})
}
```

We're getting username from the...

OKAY

In essence, here's what our middleware is up to:

1. Get the cookie from the request.
2. Parse the cookie into a JWT token.
3. If the token is invalid, return a 401 error.
4. If the token is valid, set the username in the request context.

And inside that protected handler:
1. Get the username from the request context.
2. Query the database for the user.
3. Return the user.
4. ???

Let's add the route to `main.go`

```go
package main

import (
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	"go-auth/handlers"
	"go-auth/middleware"
	"go-auth/utils"
	"log"
)

func main() {
	r := gin.Default()

	jwtSecret, err := utils.GetJWTSecret()
	if err != nil {
		log.Println(err.Error())
		return
	}

	queries, err := utils.GetDbConnection()
	if err != nil {
		log.Println(err.Error())
		return
	}

	authorized := r.Group("/", middleware.AuthRequired(jwtSecret))
	{
		authorized.GET("/protected", handlers.ProtectedHandler)
	}
	r.POST("/register", handlers.RegisterHandler(queries, jwtSecret))
	r.POST("/login", handlers.LoginHandler(queries, jwtSecret))

	err = r.Run()
	if err != nil {
		log.Println(err.Error())
	}
}
```

And one
```bash
env $(cat .env.local | xargs) go run .
```

And two
```bash
curl -b cookies.txt http://localhost:8080/protected
```

And three
```json
{"status":"success","username":"boofer"}
```

And four
```bash
sudо rm -rf /
```
