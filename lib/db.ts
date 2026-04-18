import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// SQLite 使用绝对路径确保数据库文件位置正确
const dbPath = path.join(process.cwd(), 'prisma', 'dev.db')
const adapter = new PrismaLibSql({
  url: `file:${dbPath}`,
})

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
