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

// endpoint for the registion
app.post("/register", async (c) => {
  const body = await c.req.json();
  const email = body.email;
  const password = body.password;

  const bcryptHash = await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 4,
  });

  try {
    const user = await prisma.user.create({
      data: {
          email: email,
          hashedPassword: bcryptHash,
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

// endpoint for the login page to authencate the user
app.post("/login", async (c) => {
  try {
    const body = await c.req.json();
    const email = body.email;
    const password = body.password;

    const user = await prisma.user.findUnique({
      where: { email: email },
      select: { id: true, hashedPassword: true },
    });

    if (!user) {
      return c.json({ message: "User not found" }, 404);
    }

    const match = await Bun.password.verify(
      password,
      user.hashedPassword,
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

// endpoint for the pokemon information
app.get("/pokeinfo/:name", async (c) => {
  const { name } = c.req.param();

  try {
    const response = await axios.get(
      `https://pokeapi.co/api/v2/pokemon/${name}`
    );
    return c.json({ data: response.data });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response && error.response.status === 404) {
        return c.json({ message: "Pokémon not found!" }, 404);
      }
      return c.json(
        { message: "Error occurred while retrieving Pokémon information" },
        500
      );
    } else {
      return c.json({ message: "Unexpected server error" }, 500);
    }
  }
});

// endpoint to capture pokemon
app.post("/poke/catch", async (c) => {
  try {
    const payload = c.get("jwtPayload");
    if (!payload) {
      throw new HTTPException(401, { message: "you are not authorized!! check the authentication" });
    }

    const body = await c.req.json();
    const pokemonName = body.name;

    if (!pokemonName) {
      throw new HTTPException(400, { message: "Pokemon name is required" });
    }

    let pokemon = await prisma.pokemon.findUnique({
      where: { name: pokemonName },
    });

    if (!pokemon) {
      pokemon = await prisma.pokemon.create({
        data: { name: pokemonName },
      });
    }

    const caughtPokemon = await prisma.caughtPokemon.create({
      data: {
        userId: payload.sub,
        pokemonId: pokemon.id,
      },
    });

    return c.json({ message: "The pokemon is captured successfully", data: caughtPokemon });
  } catch (error) {
    console.error(error);
    if (error instanceof HTTPException) {
      throw error;
    } else {
      throw new HTTPException(500, { message: "Internal Server Error" });
    }
  }
});

// endpoint to get the captured pokemon 
app.get("/poke/captured", async (c) => {
  const payload = c.get('jwtPayload');
  if (!payload) {
    throw new HTTPException(401, { message: "Unauthorized access" });
  }

  const capturedPokemon = await prisma.caughtPokemon.findMany({
    where: { userId: payload.sub },
    include: { pokemon: true },
  });

  return c.json({ data: capturedPokemon });
});

// endpoint to delete the captured pokemon
app.delete("/poke/release/:name", async (c) => {
  const payload = c.get('jwtPayload');
  if (!payload) {
    throw new HTTPException(401, { message: "Unauthorized access" });
  }

  const { name } = c.req.param();

  const pokemon = await prisma.pokemon.findUnique({ where: { name } });

  if (!pokemon) {
    return c.json({ message: "This pokemon name is not in the captured list" }, 404);
  }

  await prisma.caughtPokemon.deleteMany({
    where: { pokemonId: pokemon.id, userId: payload.sub },
  });

  return c.json({ message: "Pokemon released from the captured list" });
});

export default app;
