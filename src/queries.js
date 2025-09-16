import { gql } from '@apollo/client'

// Fragments
export const chatFragment = gql`
  fragment chatFragment on Chat {
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
  fragment messageFragment on Message {
    id
    text
    author
    isAgent
    insertedAt
    updatedAt
  }
`

export const contractFragment = gql`
  fragment contractFragment on Contract {
    id
    status
    session
    color
    chatMissTime
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
        ...chatFragment
      }
    }
  }
`

export const MESSAGE_SUBSCRIPTION = gql`
  subscription ($chatId: UUID!) {
    messages(condition: {chatId: $chatId}, orderBy: INSERTED_AT_ASC) {
      ...messageFragment
    }
  }
  ${messageFragment}
`

export const GET_CONTRACT = gql`
  query ($id: UUID!) {
    contract(id: $id) {
      ...contractFragment
    }
  }
  ${contractFragment}
`

export const GET_MESSAGES = gql`
  query ($chatId: UUID!) {
    messages(condition: {chatId: $chatId}, orderBy: INSERTED_AT_ASC) {
      ...messageFragment
    }
  }
  ${messageFragment}
`

export const GET_CHAT = gql`
  query ($chatId: UUID!) {
    chat(id: $chatId) {
      ...chatFragment
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
        ...messageFragment
      }
    }
  }
  ${messageFragment}
`

export const CHAT_STATUS_SUBSCRIPTION = gql`
  subscription ($chatId: UUID!) {
    chat(id: $chatId) {
      ...chatFragment
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
        ...chatFragment
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
        ...contractFragment
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
        ...chatFragment
      }
    }
  }
  ${chatFragment}
`
