/**
 * ERC-8004 Trustless Agents Module
 *
 * On-chain identity, reputation, and validation for AI agents
 * via the ERC-8004 registries on Base Sepolia.
 */

// Config
export {
  ERC8004_CONTRACTS,
  ERC8004_CHAIN_ID,
  ERC8004_NETWORK,
  ERC8004_EXPLORER_URL,
  ERC8004_EXTENSION_URI,
  getERC8004Config,
} from "./config.js";
export type { ERC8004Config } from "./config.js";

// Client
export { getERC8004PublicClient, getERC8004WalletClient, getERC8004Account } from "./client.js";

// Identity
export {
  registerAgent,
  getAgentURI,
  setAgentURI,
  getAgentWallet,
  getAgentOwner,
  getAgentMetadata,
  setAgentMetadata,
  isAgentRegistered,
  getAgentInfo,
} from "./identity.js";

// Reputation
export {
  giveFeedback,
  revokeFeedback,
  appendResponse,
  readFeedback,
  readAllFeedback,
  getReputationSummary,
  getClients,
  getLastIndex,
} from "./reputation.js";

// Validation
export {
  requestValidation,
  respondToValidation,
  getValidationStatus,
  getValidationSummary,
  getAgentValidations,
  getValidatorRequests,
} from "./validation.js";

// Registration File
export { buildRegistrationFile, handleRegistrationFile } from "./registration-file.js";

// Types
export type {
  RegistrationFile,
  RegistrationFileService,
  RegistrationFileEntry,
  AgentRegistrationResult,
  AgentInfo,
  GiveFeedbackParams,
  FeedbackResult,
  FeedbackEntry,
  ReputationSummary,
  ValidationStatus,
  ValidationSummary,
} from "./types.js";
