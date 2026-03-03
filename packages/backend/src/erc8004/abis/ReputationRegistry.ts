/**
 * ERC-8004 Reputation Registry ABI (BITE V2 Sandbox)
 * Contract: 0x11c2dfed5b71a60a4a9a22b2aedca64d5132ea7c
 */
export const REPUTATION_REGISTRY_ABI = [
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "agentId", type: "uint256" },
      { indexed: true, internalType: "address", name: "clientAddress", type: "address" },
      { indexed: false, internalType: "uint64", name: "feedbackIndex", type: "uint64" },
      { indexed: false, internalType: "int128", name: "value", type: "int128" },
      { indexed: false, internalType: "uint8", name: "valueDecimals", type: "uint8" },
      { indexed: true, internalType: "string", name: "indexedTag1", type: "string" },
      { indexed: false, internalType: "string", name: "tag1", type: "string" },
      { indexed: false, internalType: "string", name: "tag2", type: "string" },
      { indexed: false, internalType: "string", name: "endpoint", type: "string" },
      { indexed: false, internalType: "string", name: "feedbackURI", type: "string" },
      { indexed: false, internalType: "bytes32", name: "feedbackHash", type: "bytes32" },
    ],
    name: "NewFeedback",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "agentId", type: "uint256" },
      { indexed: true, internalType: "address", name: "clientAddress", type: "address" },
      { indexed: true, internalType: "uint64", name: "feedbackIndex", type: "uint64" },
    ],
    name: "FeedbackRevoked",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "agentId", type: "uint256" },
      { indexed: true, internalType: "address", name: "clientAddress", type: "address" },
      { indexed: false, internalType: "uint64", name: "feedbackIndex", type: "uint64" },
      { indexed: true, internalType: "address", name: "responder", type: "address" },
      { indexed: false, internalType: "string", name: "responseURI", type: "string" },
      { indexed: false, internalType: "bytes32", name: "responseHash", type: "bytes32" },
    ],
    name: "ResponseAppended",
    type: "event",
  },
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
  // revokeFeedback
  {
    inputs: [
      { internalType: "uint256", name: "agentId", type: "uint256" },
      { internalType: "uint64", name: "feedbackIndex", type: "uint64" },
    ],
    name: "revokeFeedback",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // appendResponse
  {
    inputs: [
      { internalType: "uint256", name: "agentId", type: "uint256" },
      { internalType: "address", name: "clientAddress", type: "address" },
      { internalType: "uint64", name: "feedbackIndex", type: "uint64" },
      { internalType: "string", name: "responseURI", type: "string" },
      { internalType: "bytes32", name: "responseHash", type: "bytes32" },
    ],
    name: "appendResponse",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // readFeedback
  {
    inputs: [
      { internalType: "uint256", name: "agentId", type: "uint256" },
      { internalType: "address", name: "clientAddress", type: "address" },
      { internalType: "uint64", name: "feedbackIndex", type: "uint64" },
    ],
    name: "readFeedback",
    outputs: [
      { internalType: "int128", name: "value", type: "int128" },
      { internalType: "uint8", name: "valueDecimals", type: "uint8" },
      { internalType: "string", name: "tag1", type: "string" },
      { internalType: "string", name: "tag2", type: "string" },
      { internalType: "bool", name: "isRevoked", type: "bool" },
    ],
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
  // getLastIndex
  {
    inputs: [
      { internalType: "uint256", name: "agentId", type: "uint256" },
      { internalType: "address", name: "clientAddress", type: "address" },
    ],
    name: "getLastIndex",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function",
  },
  // getResponseCount
  {
    inputs: [
      { internalType: "uint256", name: "agentId", type: "uint256" },
      { internalType: "address", name: "clientAddress", type: "address" },
      { internalType: "uint64", name: "feedbackIndex", type: "uint64" },
      { internalType: "address[]", name: "responders", type: "address[]" },
    ],
    name: "getResponseCount",
    outputs: [{ internalType: "uint64", name: "count", type: "uint64" }],
    stateMutability: "view",
    type: "function",
  },
  // getIdentityRegistry
  {
    inputs: [],
    name: "getIdentityRegistry",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
