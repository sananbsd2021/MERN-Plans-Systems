import NextAuth, { type DefaultSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { authConfig } from "./auth.config"
import { connectDB } from "@/lib/db/connect"
import User from "@/models/User"
import bcrypt from "bcryptjs"
import { z } from "zod"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      tenantId: string
    } & DefaultSession["user"]
  }

  interface User {
    role: string
    tenantId: string
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const { email, password } = loginSchema.parse(credentials)
          
          await connectDB()
          const user = await User.findOne({ email }).select('+passwordHash')
          
          if (!user || !user.isActive) {
            return null
          }

          const passwordsMatch = await bcrypt.compare(password, user.passwordHash)
          
          if (passwordsMatch) {
            return {
              id: user._id.toString(),
              email: user.email,
              name: user.name,
              role: user.role,
              tenantId: user.tenantId ? user.tenantId.toString() : null,
            }
          }
          
          return null
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    })
  ],
})
