import type { NetworkMode, NodeRuntime, PythonRuntime } from '../../../../schema';

/**
 * Default configuration values for create command
 */

/** Default Python runtime version for new agents */
export const DEFAULT_PYTHON_VERSION: PythonRuntime = 'PYTHON_3_13';

/** Default Node runtime version for new agents */
export const DEFAULT_NODE_VERSION: NodeRuntime = 'NODE_22';

/** Default network mode for agent runtimes */
export const DEFAULT_NETWORK_MODE: NetworkMode = 'PUBLIC';

/** Default entrypoint for Python agents */
export const DEFAULT_PYTHON_ENTRYPOINT = 'main.py';

/** Default entrypoint for TypeScript agents */
export const DEFAULT_NODE_ENTRYPOINT = 'main.ts';

/** Default memory event expiry duration in days */
export const DEFAULT_MEMORY_EXPIRY_DAYS = 30;
