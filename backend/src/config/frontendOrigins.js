const loopbackHosts = new Set(['localhost', '127.0.0.1', '[::1]']);

const isLoopbackOrigin = (origin) => loopbackHosts.has(new URL(origin).hostname);

export const resolveFrontendOrigins = ({ configuredOrigins, productionOrigins, nodeEnv }) => {
  const configured =
    nodeEnv === 'production'
      ? configuredOrigins.filter((origin) => !isLoopbackOrigin(origin))
      : configuredOrigins;
  const corsOrigins = [...new Set([...configured, ...productionOrigins])];

  return {
    corsOrigins,
    frontendUrl: corsOrigins[0],
  };
};
