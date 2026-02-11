/// <reference types="vite/client" />

// CSS modules type declarations
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}
