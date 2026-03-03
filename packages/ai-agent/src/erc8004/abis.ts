/**
 * Minimal ERC-8004 ABIs for the buyer agent.
 * Subset of the full ABIs from packages/backend/src/erc8004/abis/
 */

export const IDENTITY_REGISTRY_ABI = [
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "agentId", type: "uint256" },
      { indexed: false, internalType: "string", name: "agentURI", type: "string" },
      { indexed: true, internalType: "address", name: "owner", type: "address" },
    ],
    name: "Registered",
    type: "event",
  },
  // register(string agentURI)
  {
    inputs: [{ internalType: "string", name: "agentURI", type: "string" }],
    name: "register",
    outputs: [{ internalType: "uint256", name: "agentId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  // tokenURI
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  // ownerOf
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  // getAgentWallet
  {
    inputs: [{ internalType: "uint256", name: "agentId", type: "uint256" }],
    name: "getAgentWallet",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const REPUTATION_REGISTRY_ABI = [
  // giveFeedback
  {
    inputs: [
      { internalType: "uint256", name: "agentId", type: "uint256" },
      { internalType: "int128", name: "value", type: "int128" },
      { internalType: "uint8", name: "valueDecimals", type: "uint8" },
      { internalType: "string", name: "tag1", type: "string" },
      { internalType: "string", name: "tag2", type: "string" },
      { internalType: "string", name: "endpoint", type: "string" },
      { internalType: "string", name: "feedbackURI", type: "string" },
      { internalType: "bytes32", name: "feedbackHash", type: "bytes32" },
    ],
    name: "giveFeedback",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // getSummary
  {
    inputs: [
      { internalType: "uint256", name: "agentId", type: "uint256" },
      { internalType: "address[]", name: "clientAddresses", type: "address[]" },
      { internalType: "string", name: "tag1", type: "string" },
      { internalType: "string", name: "tag2", type: "string" },
    ],
    name: "getSummary",
    outputs: [
      { internalType: "uint64", name: "count", type: "uint64" },
      { internalType: "int128", name: "summaryValue", type: "int128" },
      { internalType: "uint8", name: "summaryValueDecimals", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // getClients
  {
    inputs: [{ internalType: "uint256", name: "agentId", type: "uint256" }],
    name: "getClients",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  // readAllFeedback
  {
    inputs: [
      { internalType: "uint256", name: "agentId", type: "uint256" },
      { internalType: "address[]", name: "clientAddresses", type: "address[]" },
      { internalType: "string", name: "tag1", type: "string" },
      { internalType: "string", name: "tag2", type: "string" },
      { internalType: "bool", name: "includeRevoked", type: "bool" },
    ],
    name: "readAllFeedback",
    outputs: [
      { internalType: "address[]", name: "clients", type: "address[]" },
      { internalType: "uint64[]", name: "feedbackIndexes", type: "uint64[]" },
      { internalType: "int128[]", name: "values", type: "int128[]" },
      { internalType: "uint8[]", name: "valueDecimals", type: "uint8[]" },
      { internalType: "string[]", name: "tag1s", type: "string[]" },
      { internalType: "string[]", name: "tag2s", type: "string[]" },
      { internalType: "bool[]", name: "revokedStatuses", type: "bool[]" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const VALIDATION_REGISTRY_ABI = [
  // getSummary
  {
    inputs: [
      { internalType: "uint256", name: "agentId", type: "uint256" },
      { internalType: "address[]", name: "validatorAddresses", type: "address[]" },
      { internalType: "string", name: "tag", type: "string" },
    ],
    name: "getSummary",
    outputs: [
      { internalType: "uint64", name: "count", type: "uint64" },
      { internalType: "uint8", name: "avgResponse", type: "uint8" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // getAgentValidations
  {
    inputs: [{ internalType: "uint256", name: "agentId", type: "uint256" }],
    name: "getAgentValidations",
    outputs: [{ internalType: "bytes32[]", name: "", type: "bytes32[]" }],
    stateMutability: "view",
    type: "function",
  },
  // getValidationStatus
  {
    inputs: [{ internalType: "bytes32", name: "requestHash", type: "bytes32" }],
    name: "getValidationStatus",
    outputs: [
      { internalType: "address", name: "validatorAddress", type: "address" },
      { internalType: "uint256", name: "agentId", type: "uint256" },
      { internalType: "uint8", name: "response", type: "uint8" },
      { internalType: "bytes32", name: "responseHash", type: "bytes32" },
      { internalType: "string", name: "tag", type: "string" },
      { internalType: "uint256", name: "lastUpdate", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
