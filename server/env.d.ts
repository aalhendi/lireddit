declare namespace NodeJS {
  export interface ProcessEnv {
    DATABASE_URL: string;
    REDIS_URL: string;
    PORT: int;
    SECRET_KEY: string;
    FRONT_END_URL: string;
  }
}
