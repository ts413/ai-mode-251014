// lib/db/server-connection.ts
// 서버 전용 데이터베이스 연결
// 클라이언트 사이드에서 import되지 않도록 서버 전용으로 분리
// 관련 파일: lib/notes/actions.ts, lib/notes/queries.ts

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema/notes'

// Database connection
const connectionString = process.env.DATABASE_URL!

if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
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

