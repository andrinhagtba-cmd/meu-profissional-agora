declare module "virtual:app-service-worker" {
  /** Código do service worker compilado, embutido no bundle do servidor no build. */
  const serviceWorkerSource: string;
  export default serviceWorkerSource;
}
