/**
 * ERC-8004 Identity Registry ABI (BITE V2 Sandbox)
 * Contract: 0xa059e27967e5a573a14a62c706ebd1be75333f9a
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
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "agentId", type: "uint256" },
      { indexed: true, internalType: "string", name: "indexedMetadataKey", type: "string" },
      { indexed: false, internalType: "string", name: "metadataKey", type: "string" },
      { indexed: false, internalType: "bytes", name: "metadataValue", type: "bytes" },
    ],
    name: "MetadataSet",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "agentId", type: "uint256" },
      { indexed: false, internalType: "string", name: "newURI", type: "string" },
      { indexed: true, internalType: "address", name: "updatedBy", type: "address" },
    ],
    name: "URIUpdated",
    type: "event",
  },
  // register() — no args
  {
    inputs: [],
    name: "register",
    outputs: [{ internalType: "uint256", name: "agentId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  // register(string agentURI)
  {
    inputs: [{ internalType: "string", name: "agentURI", type: "string" }],
    name: "register",
    outputs: [{ internalType: "uint256", name: "agentId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  // register(string agentURI, MetadataEntry[] metadata)
  {
    inputs: [
      { internalType: "string", name: "agentURI", type: "string" },
      {
        components: [
          { internalType: "string", name: "metadataKey", type: "string" },
          { internalType: "bytes", name: "metadataValue", type: "bytes" },
        ],
        internalType: "struct IdentityRegistryUpgradeable.MetadataEntry[]",
        name: "metadata",
        type: "tuple[]",
      },
    ],
    name: "register",
    outputs: [{ internalType: "uint256", name: "agentId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  // setAgentURI
  {
    inputs: [
      { internalType: "uint256", name: "agentId", type: "uint256" },
      { internalType: "string", name: "newURI", type: "string" },
    ],
    name: "setAgentURI",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // setAgentWallet
  {
    inputs: [
      { internalType: "uint256", name: "agentId", type: "uint256" },
      { internalType: "address", name: "newWallet", type: "address" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
      { internalType: "bytes", name: "signature", type: "bytes" },
    ],
    name: "setAgentWallet",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // unsetAgentWallet
  {
    inputs: [{ internalType: "uint256", name: "agentId", type: "uint256" }],
    name: "unsetAgentWallet",
    outputs: [],
    stateMutability: "nonpayable",
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
  // getMetadata
  {
    inputs: [
      { internalType: "uint256", name: "agentId", type: "uint256" },
      { internalType: "string", name: "metadataKey", type: "string" },
    ],
    name: "getMetadata",
    outputs: [{ internalType: "bytes", name: "", type: "bytes" }],
    stateMutability: "view",
    type: "function",
  },
  // setMetadata
  {
    inputs: [
      { internalType: "uint256", name: "agentId", type: "uint256" },
      { internalType: "string", name: "metadataKey", type: "string" },
      { internalType: "bytes", name: "metadataValue", type: "bytes" },
    ],
    name: "setMetadata",
    outputs: [],
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
  // balanceOf
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
