declare namespace NodeJS {
  interface ProcessEnv {
    PORT: string;
    REFRESH_TOKEN_SECRET: string;
    ACCESS_TOKEN_SECRET: string;
    REFRESH_TOKEN_EXPIRY: string;
    ACCESS_TOKEN_EXPIRY: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
    CLOUDINARY_CLOUD_NAME: string;
    CORS_ORIGIN: string;
    NODE_ENV: string;
    MONGODB_URI: string;
    DB_NAME: string;
    API_ROUTE: string;
  }
}

export {};
