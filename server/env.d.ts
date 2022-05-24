declare namespace NodeJS {
  export interface ProcessEnv {
    DATABASE_URL: string;
    PORT: int;
    SECRET_KEY: string;
    NODE_ENV: string;
    FRONT_END_URL: string;
    REDIS_URL: string;
  }
}
