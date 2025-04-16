/// <reference types="vite/client" />
interface ImportMetaEnv {
    readonly BASE_API_URL: string;
    readonly WS_URL: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }