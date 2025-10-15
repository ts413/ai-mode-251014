import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema/notes'

// Database connection
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
    console.error('DATABASE_URL environment variable is not set')
    console.error('Available environment variables:', Object.keys(process.env).filter(key => key.includes('DATABASE') || key.includes('SUPABASE')))
    throw new Error('DATABASE_URL environment variable is not set. Please check your Vercel environment variables.')
}

// Disable prefetch as it is not supported for "Transaction" pool mode
const client = postgres(connectionString, { 
    prepare: false,
    max: 1, // 연결 풀 크기 제한
    idle_timeout: 60,
    connect_timeout: 30,
    max_lifetime: 60 * 30, // 30분
    transform: {
        undefined: null
    }
})
export const db = drizzle(client, { schema })

export type Database = typeof db
