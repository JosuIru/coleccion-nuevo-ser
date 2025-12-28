/**
 * Frankenstein Core Modules - Index
 *
 * Exporta todos los módulos del core de Frankenstein Lab
 * para facilitar la importación.
 *
 * @module frankenstein/core
 */

// Experiment Log System
export { FrankensteinExperimentLog } from './frankenstein-experiment-log.js';

// Re-export para backward compatibility
if (typeof window !== 'undefined') {
  import('./frankenstein-experiment-log.js').then(module => {
    window.FrankensteinExperimentLog = module.FrankensteinExperimentLog;
  });
}
