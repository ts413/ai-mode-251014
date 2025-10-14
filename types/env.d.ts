// 환경변수 타입 정의
declare namespace NodeJS {
  interface ProcessEnv {
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    DATABASE_URL: string;
    
    // Google Gemini API
    GOOGLE_API_KEY: string;
  }
}
