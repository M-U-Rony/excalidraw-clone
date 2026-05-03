import { prismaClient } from "@repo/db/client";
import { JWT_SECRET } from "@repo/backend-common/config";
import express from "express";
import jwt from "jsonwebtoken";
import {
  createUserSchema,
  creatRoomSchema,
  roomIdSchema,
  signInSchema,
} from "@repo/common/types";
import { middleware } from "./middleware.js";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:3000",
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  }),
);

app.post("/signup", async (req, res) => {

  const data = createUserSchema.safeParse(req.body);

  if (!data.success) {
    return res.json({
      message: "Incorrect input",
    });
  }

  const { email, name, password } = data.data;

  try {
    const isUser = await prismaClient.user.findFirst({
      where: { email },
    });

    if (isUser) {
      return res.json({
        message: "User Exist",
      });
    }

    const user = await prismaClient.user.create({
      data: {
        email,
        name,
        password,
      },
    });

    return res.json({
      userId: user.id,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      message: "something wrong while signup",
    });
  }
});

app.post("/signin", async (req, res) => {

  const data = signInSchema.safeParse(req.body);

  if (!data.success) {
    return res.json({
      message: "Incorrect input",
    });
  }


  const { email, password } = data.data;

  try {
    const isUser = await prismaClient.user.findFirst({
      where: { email },
    });

    if (!isUser) {
      return res.json({
        message: "Invalid username or password",
      });
    }

    if (isUser.password !== password) {
      return res.json({
        message: "Invalid username or password",
      });
    }

    const token = jwt.sign({ userId: isUser.id }, JWT_SECRET!, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }).json({ message: "Signed in successfully"});
  } catch (error) {
    console.log(error);
    return res.json({
      message: "something wrong while login",
    });
  }
});

app.post("/createroom",async (req, res) => {
  const data = creatRoomSchema.safeParse(req.body);

  if (!data.success) {
    return res.json({
      message: "Incorrect input",
    });
  }

  //@ts-ignore
  const userId = req.userId;

  try {
    const room = await prismaClient.room.create({
      data: {
        name: data.data.name,
        adminId: parseInt(userId, 10),
      },
    });

    return res.json({
      roomId: room.id,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      message: "something wrong while creating room",
    });
  }
});

app.get("/chats/:roomId", async (req, res) => {

  const roomId = req.params.roomId;

  try {
    
    const messages = await prismaClient.chat.findMany({
      where: {
        roomId: Number(roomId),
      },
      orderBy: {
        id: "desc",
      },
      take: 50,
    });
    console.log(messages);
  
    res.json(messages);
  } catch (error) {
    console.log(error)
  }

});

app.get("/room/:roomName", async (req, res) => {
  const roomName = req.params.roomName;

  try {
    const room = await prismaClient.room.findFirst({
      where: {
        name: roomName as string,
      },
    });

    if (!room) {
      return null;
    }

    return res.json({
      roomId: room.id,
    });
  } catch (error) {
    console.log(error);
    return res.json({
      message: "something wrong while creating room",
    });
  }
});

app.listen(3001);
