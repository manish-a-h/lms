import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../generated/prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaAdapter: PrismaPg | undefined
  prismaConnectionString: string | undefined
}

let prismaClient: PrismaClient | undefined

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error("Missing DATABASE_URL")
  }

  const adapter =
    globalForPrisma.prismaAdapter &&
      globalForPrisma.prismaConnectionString === connectionString
      ? globalForPrisma.prismaAdapter
      : new PrismaPg({ connectionString })

  const client = globalForPrisma.prisma ?? new PrismaClient({ adapter })

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client
    globalForPrisma.prismaAdapter = adapter
    globalForPrisma.prismaConnectionString = connectionString
  }

  return client
}

function getDbClient() {
  if (!prismaClient) {
    prismaClient = globalForPrisma.prisma ?? createPrismaClient()
  }

  return prismaClient
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const client = getDbClient()
    const value = Reflect.get(client as object, property, receiver)

    return typeof value === "function" ? value.bind(client) : value
  },
})
