## Pokémon Management API

This application provides users to manage the endpoints for user registration, authentication, and Pokémon-related operations. It utilizes advanced technologies including Prisma for database interactions, Axios for external API requests, and JWT for authentication.

## Features

* User Registration: Users can register with their email and password.
* User Authentication: Users can log in and receive a JWT token for authenticated requests.
* Pokémon Information Retrieval: Fetch detailed information about a specific Pokémon from PokeAPI.
* Pokémon stored: Authenticated users can capture Pokémon and add them to their collection.
* View stored Pokémon: Authenticated users can view a list of Pokémon they have stored.
* Release Pokémon: Authenticated users can release a stored Pokémon from their collection.

## To install dependencies:

    bun install

To run:

    bun run dev

open http://localhost:3000

## Endpoints

## 1. User Registration

### Description: 

This endpoint registers a new user with name, email and Password, hashes the password using bcrypt, and saves the user information in the database. We first need to register to login and capture the pokemon that are in the user likes.

* URL: `/register`
* Method: POST  

### Request Body:

Since this is the post request we should use this as an example in the body.

#### Example

    {
    "name": "username",
    "email": "user@example.com",
    "password": "password"
    }



## 2. User Login

### Description

After the registration is completed the user needs to login using the registered email. After logging in it authenticates a user and returns a JWT token for subsequent requests.

* URL: /login
* Method: POST
 
### Request Body

    {
    "email": "user@example.com",
    "password": "password"
    }

## 3. Get all user Information

### Description 

This endpoint retrieves all the information about a users that are registered.

* URL: /users
* Method: GET

## 4. Get Pokémon Information

### Description 

This endpoint retrieves the information about a Pokémon from PokeAPI based on pokemon name.

* URL: /pokeinfo/:name
* Method: GET

### URL Parameters:

* name: Should use pokemon name to get the information about the pokemon.

## 5. Capture Pokémon

### Description: 

This allows an authenticated user to capture a Pokémon. It first verifies the JWT token. If the Pokémon does not exist in the database, it creates a new entry. Then, it associates the Pokémon with the user as a captured Pokémon. It allows a logged-in user to store a Pokémon that he likes.

* URL: /poke/catch
* Method: POST

### Request Body:

Should enter the name of the pokemon the user likes to capture in the request body.

    {
    "name": "Pikachu"
    }


## 6. Get Captured Pokémon

### Description: 

This endpoint retrieves all Pokémon captured by the authenticated user. It verifies the JWT token before fetching the data.

* URL: /poke/captured
* Method: GET


## 7. Release Pokémon

### Description: 

Allows the authenticated user to release a captured Pokémon.

* URL: /poke/release/:name
* Method: DELETE

### URL Parameters

* name: Enter the name of the Pokémon to release or delete.

## Technologies Used

* Node.js: Runtime environment.
* Prisma: ORM for database operations.
* Bun: Task runner for running the application.
* Axios: HTTP client for making external API requests.
* JWT: JSON Web Tokens for user authentication.
* Database used: SQLite.