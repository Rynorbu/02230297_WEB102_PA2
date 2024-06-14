## Pokémon Management API

This application provides users to manage the endpoints for user registration, authentication, and Pokémon-related operations. It utilizes advanced technologies including Prisma for database interactions, Axios for external API requests, and JWT for authentication.

## Features

* User Registration: Users can register with their email and password.
* User Authentication: Users can log in and receive a JWT token for authenticated requests.
* Pokémon Information Retrieval: Fetch detailed information about a specific Pokémon from PokeAPI.
* Capture Pokémon: Authenticated users can capture Pokémon and add them to their collection.
* View Captured Pokémon: Authenticated users can view a list of Pokémon they have captured.
* Release Pokémon: Authenticated users can release a captured Pokémon from their collection.

## To install dependencies:

    bun install

To run:

    bun run dev

open http://localhost:3000

## Endpoints

1. User Registration

### Description: 

This endpoint registers a new user with email and hashedPassword. We first need to register to login and capture the pokemon that are in the user likes.

* URL: `/register`
* Method: POST  

### Request Body:

Since this is the post request we should use this as an example in the body.

#### Example

    {
    "email": "user@example.com",
    "hashedPassword": "password"
    }

### Responses:

* 200 OK: User successfully registered.
* 400 Bad Request: Missing email or password.
* 500 Internal Server Error: Server error occurred.

2. User Login

### Description

After the registration is completed the user needs to login using the registered email. After logging in it authenticates a user and returns a JWT token for subsequent requests.

* URL: /login
* Method: POST
 
### Request Body

    {
    "email": "user@example.com",
    "hashedPassword": "password"
    }

### Responses:
* 200 OK: Login successful, returns a JWT token.
* 401 Unauthorized: Invalid credentials.
* 500 Internal Server Error: Server error occurred.

3. Get Pokémon Information

### Description 

This endpoint retrieves the information about a Pokémon from PokeAPI.

* URL: /pokeinfo/:name
* Method: GET

### URL Parameters:

* name: Should use pokemon name to get the information about the pokemon.

### Responses:

* 200 OK: Pokémon information retrieved successfully.
* 404 Not Found: Pokémon with the specified name not found.
* 500 Internal Server Error: Server error occurred.

4. Capture Pokémon

### Description: 

This allows a logged-in user to capture a Pokémon that he likes.

* URL: /poke/catch
* Method: POST

### Request Body:

Should enter the name of the pokemon the user likes to capture in the request body.

    {
    "name": "Pikachu"
    }

### Responses:
* 200 OK: Pokémon captured successfully.
* 400 Bad Request: Pokémon name missing in request body.
* 401 Unauthorized: User not authenticated.
* 500 Internal Server Error: Server error occurred.

5. Get Captured Pokémon

### Description: 

Retrieves Pokémon captured by the logged-in user.

* URL: /poke/captured
* Method: GET

### Responses:
* 200 OK: Returns captured Pokémon data.
* 401 Unauthorized: User not authenticated.
* 500 Internal Server Error: Server error occurred.

6. Release Pokémon

### Description: 

Allows the logged-in user to release a captured Pokémon.

* URL: /poke/release/:name
* Method: DELETE

### URL Parameters

* name: Enter the name of the Pokémon to release.

### Responses

* 200 OK: Pokémon released successfully.
* 401 Unauthorized: User not authenticated.
* 404 Not Found: Pokémon with the specified name not found in captured list.
* 500 Internal Server Error: Server error occurred.

## Technologies Used

* Node.js: Runtime environment.
* Prisma: ORM for database operations.
* Axios: HTTP client for making external API requests.
* JWT: JSON Web Tokens for user authentication.