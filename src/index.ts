import { Hono } from "hono";
import { cors } from "hono/cors";
import { PrismaClient, Prisma } from "@prisma/client";
import { HTTPException } from "hono/http-exception";
import { sign } from "hono/jwt";
import axios from "axios";
import { jwt } from "hono/jwt";
import type { JwtVariables } from "hono/jwt";

type Variables = JwtVariables;

const app = new Hono<{ Variables: Variables }>();
const prisma = new PrismaClient();

app.use("/*", cors());

app.use(
  "/poke/*",
  jwt({
    secret: "mySecretKey",
  })
);

// Endpoint for registration
app.post("/register", async (c) => {
  const body = await c.req.json();
  const email = body.email;
  const password = body.password;
  const name = body.name;

  const bcryptHash = await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 4,
  });

  try {
    const user = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: bcryptHash,
      },
    });

    return c.json({ message: `${user.email} created successfully` });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return c.json({ message: "Email already exists" });
      }
    }
    throw new HTTPException(500, { message: "Internal Server Error" });
  }
});

// Endpoint for login to authenticate the user
app.post("/login", async (c) => {
  try {
    const body = await c.req.json();
    const email = body.email;
    const password = body.password;

    const user = await prisma.user.findUnique({
      where: { email: email },
      select: { id: true, password: true },
    });

    if (!user) {
      return c.json({ message: "User not found" }, 404);
    }

    const match = await Bun.password.verify(
      password,
      user.password,
      "bcrypt"
    );

    if (match) {
      const payload = {
        sub: user.id,
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
      };
      const secret = "mySecretKey";
      const token = await sign(payload, secret);

      if (typeof token !== "string") {
        console.error("Token signing failed", token);
        throw new HTTPException(500, { message: "Token signing failed" });
      }

      return c.json({ message: "Login successful", token: token });
    } else {
      throw new HTTPException(401, { message: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Login error:", error);
    if (error instanceof HTTPException) {
      throw error;
    } else {
      throw new HTTPException(500, { message: "Internal Server Error" });
    }
  }
});

// CRUD for user information

// Endpoint to get all users
app.get("/users", async (c) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return c.json({ data: users });
  } catch (error) {
    console.error(error);
    throw new HTTPException(500, { message: "Internal Server Error" });
  }
});

// Endpoint to store Pokémon
app.post("/poke/catch", async (c) => {
  try {
    const payload = c.get("jwtPayload");
    if (!payload) {
      throw new HTTPException(401, { message: "You are not authorized! Check the authentication" });
    }

    const body = await c.req.json();
    const pokemonName = body.name;

    if (!pokemonName) {
      throw new HTTPException(400, { message: "Pokemon name is required" });
    }

    // Validate if the Pokémon exists by querying the Pokémon API
    try {
      const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
      if (response.status !== 200) {
        return c.json({ message: "Pokémon not found!" }, 404);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return c.json({ message: "Pokémon not found!" }, 404);
      } else {
        console.error("Error occurred while validating Pokémon:", error);
        throw new HTTPException(500, { message: "Error occurred while validating Pokémon" });
      }
    }

    let pokemon = await prisma.pokemon.findUnique({
      where: { name: pokemonName },
    });

    if (!pokemon) {
      pokemon = await prisma.pokemon.create({
        data: { name: pokemonName },
      });
    }

    const caughtPokemon = await prisma.pokemon_stored.create({
      data: {
        userid: payload.sub,
        pokemonid: pokemon.id,
      },
    });

    return c.json({ message: "The Pokémon is captured successfully", data: caughtPokemon });
  } catch (error) {
    console.error(error);
    if (error instanceof HTTPException) {
      throw error;
    } else {
      throw new HTTPException(500, { message: "Internal Server Error" });
    }
  }
});

// Endpoint to get the stored Pokémon 
app.get("/poke/captured", async (c) => {
  const payload = c.get('jwtPayload');
  if (!payload) {
    throw new HTTPException(401, { message: "Unauthorized access" });
  }

  const capturedPokemon = await prisma.pokemon_stored.findMany({
    where: { userid: payload.sub },
    include: { Pokemon: true },
  });

  return c.json({ data: capturedPokemon });
});

// Endpoint to delete the stored Pokémon
app.delete("/poke/release/:name", async (c) => {
  const payload = c.get('jwtPayload');
  if (!payload) {
    throw new HTTPException(401, { message: "Unauthorized access" });
  }

  const { name } = c.req.param();

  const pokemon = await prisma.pokemon.findUnique({ where: { name } });

  if (!pokemon) {
    return c.json({ message: "This Pokémon name is not in the captured list" }, 404);
  }

  await prisma.pokemon_stored.deleteMany({
    where: { pokemonid: pokemon.id, userid: payload.sub },
  });

  return c.json({ message: "Pokémon released from the captured list" });
});

export default app;
