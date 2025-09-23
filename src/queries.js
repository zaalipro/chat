import { gql } from '@apollo/client'

// Fragments
 const chatFragment = gql`
  fragment ChatFragment on Chat {
    id
    key
    status
    missed
    headline
    ipAddress
    customerName
  }
`

export const messageFragment = gql`
  fragment MessageFragment on Message {
    id
    text
    author
    isAgent
    insertedAt
    updatedAt
  }
`

export const contractFragment = gql`
  fragment ContractFragment on Contract {
    id
    name
    color
    rate
    status
    session
    chatMissTime
    chatMissFee
    websiteId
    agentId
    jobId
    companyId
    proposalId
    insertedAt
    updatedAt
    agentDeleted
    __typename
  }
`

export const CREATE_CHAT = gql`
  mutation createChat(
    $customerName: String!
    $headline: String!
    $contractId: UUID!
    $ipAddress: InternetAddress,
    $key: UUID!
  ) {
    createChat(
      input: {
        chat: {
          customerName: $customerName
          headline: $headline
          contractId: $contractId
          ipAddress: $ipAddress
          key: $key
        }
      }
    ) {
      chat {
        ...ChatFragment
      }
    }
  }
  ${chatFragment}
`

export const MESSAGE_SUBSCRIPTION = gql`
  subscription OnMessageAdded($chatId: UUID!) {
    onMessageAdded(chatId: $chatId) {
      record {
        ...MessageFragment
      }
    }
  }
  ${messageFragment}
`

export const GET_CONTRACT = gql`
  query ($id: UUID!) {
    contract(id: $id) {
      ...ContractFragment
    }
  }
  ${contractFragment}
`

export const GET_MESSAGES = gql`
  query ($chatId: UUID!) {
    messages(condition: {chatId: $chatId}, orderBy: INSERTED_AT_ASC) {
      ...MessageFragment
    }
  }
  ${messageFragment}
`

export const GET_CHAT = gql`
  query ($chatId: UUID!) {
    chat(id: $chatId) {
      ...ChatFragment
      contract {
        agent {
          id
        }
      }
    }
  }
  ${chatFragment}
`

export const RATE_AGENT = gql`
  mutation createRate($chatId: UUID!, $rating: Int!) {
    createRate(input: {
      rate: { rating: $rating, chatId: $chatId }
    }) {
      rate {
        id
      }
    }
  }
`

export const CREATE_MESSAGE = gql`
  mutation createMessage($text: String!, $author: String!, $chatId: UUID!) {
    createMessage(input: {
      message: {
        text: $text, isAgent: false, author: $author, chatId: $chatId
      }
    }) {
      message {
        ...MessageFragment
      }
    }
  }
  ${messageFragment}
`

export const CHAT_STATUS_SUBSCRIPTION = gql`
  subscription onChatChanged($contractId: UUID, $status: String) {
    chatChanged(contractId: $contractId, status: $status) {
      operation
      record {
        ...ChatFragment
      }
    }
  }
  ${chatFragment}
`

export const END_CHAT = gql`
  mutation endChat($chatId: UUID!) {
    updateChat(
      input: {
        id: $chatId
        patch: {
          status: FINISHED
        }
      }
    ) {
      chat {
        ...ChatFragment
      }
    }
  }
  ${chatFragment}
`

export const GET_WEBSITE_CONTRACTS = gql`
  query GetWebsiteContracts($websiteId: UUID!) {
    website(id: $websiteId) {
      logoUrl
      color
      contracts(condition: {status: "active"}) {
        ...ContractFragment
      }
    }
  }
  ${contractFragment}
`

export const UPDATE_CHAT_MISSED = gql`
  mutation UpdateChatMissed($chatId: UUID!) {
    updateChat(input: {
      id: $chatId
      patch: {
        missed: true
      }
    }) {
      chat {
        ...ChatFragment
      }
    }
  }
  ${chatFragment}
`

export const CONTRACT_CHANGED_SUBSCRIPTION = gql`
  subscription onContractChanged($companyId: UUID) {
    contractChanged(companyId: $companyId) {
      operation
      record {
        ...ContractFragment
      }
    }
  }
  ${contractFragment}
`
