import {z} from 'zod'

export const createUserSchema = z.object({
    email: z.email(),
    name: z.string(),
    password: z.string(),
    photo: z.string().optional(),
})

export const signInSchema = z.object({
    email: z.email(),
    password: z.string(),
})

export const creatRoomSchema = z.object({
    name: z.string(),
})

export const roomIdSchema = z.object({
    name: z.string(),
})