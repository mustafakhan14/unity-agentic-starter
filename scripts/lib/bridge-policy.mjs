export function validateRegistry(registry) {
  if (registry?.schemaVersion !== 1) {
    throw new Error("Unsupported bridge registry schemaVersion");
  }

  const providers = registry.providers ?? {};
  const routes = registry.routes ?? {};

  if (!providers[registry.defaultProvider]) {
    throw new Error(`Unknown default provider: ${registry.defaultProvider}`);
  }

  if (registry.safety?.singleMutationOwner !== true) {
    throw new Error("Bridge policy must require one mutation owner");
  }
  if (!Array.isArray(registry.safety?.forbiddenToolPrefixes)) {
    throw new Error("Bridge policy must declare forbidden tool prefixes");
  }

  const promotion = registry.promotionPolicy ?? {};
  if (promotion.minimumReadSamples < 50 || promotion.minimumUndoMutationSamples < 10) {
    throw new Error("Bridge promotion sample thresholds are too low");
  }
  if (promotion.requireHumanApprovalForDefaultChange !== true) {
    throw new Error("Default bridge changes must require human approval");
  }

  for (const [capability, route] of Object.entries(routes)) {
    if (!Array.isArray(route.providers) || route.providers.length === 0) {
      throw new Error(`Route ${capability} has no providers`);
    }
    if (route.mode !== "read" && route.mode !== "mutation") {
      throw new Error(`Route ${capability} has invalid mode: ${route.mode}`);
    }

    for (const providerName of route.providers) {
      const provider = providers[providerName];
      if (!provider) {
        throw new Error(`Route ${capability} references unknown provider ${providerName}`);
      }
      if (!provider.capabilities?.includes(capability)) {
        throw new Error(`${providerName} does not declare capability ${capability}`);
      }
    }

    for (const verifierName of route.verifyWith ?? []) {
      if (route.mode !== "read") {
        throw new Error(`Mutation route ${capability} cannot have a cross-check provider`);
      }
      const verifier = providers[verifierName];
      if (!verifier) {
        throw new Error(`Route ${capability} references unknown verifier ${verifierName}`);
      }
      if (!verifier.capabilities?.includes(capability)) {
        throw new Error(`${verifierName} cannot verify capability ${capability}`);
      }
    }
  }

  return registry;
}

export function chooseProvider(registry, capability, providerStatus) {
  validateRegistry(registry);
  const route = registry.routes[capability];
  if (!route) {
    throw new Error(`Unknown bridge capability: ${capability}`);
  }

  const selected = route.providers.find(
    (providerName) => providerStatus[providerName]?.available === true,
  );

  const verifier = (route.verifyWith ?? []).find(
    (providerName) =>
      providerName !== selected && providerStatus[providerName]?.available === true,
  );

  return {
    capability,
    mode: route.mode,
    selected: selected ?? null,
    verifier: verifier ?? null,
    candidates: route.providers.map((providerName) => ({
      provider: providerName,
      available: providerStatus[providerName]?.available === true,
      reason: providerStatus[providerName]?.reason ?? "status unavailable",
    })),
  };
}

export function isToolForbidden(registry, toolName) {
  return (registry.safety?.forbiddenToolPrefixes ?? []).some((prefix) =>
    toolName.startsWith(prefix),
  );
}
