import { gql } from '@apollo/client'

export const CREATE_CHAT = gql`
mutation createChat($customerName: String!, $headline: String!, $contractId: UUID!) {
  createChat(input: {
    chat: {
      customerName: $customerName, headline: $headline,  contractId: $contractId
    }
  }) {
    chat {
      id
      customerName
      headline
      status
    }
  }
}
`

export const MESSAGE_SUBSCRIPTION = gql`
  subscription ($chatId: UUID!) {
    messages(condition: {chatId: $chatId}, orderBy: INSERTED_AT_ASC ) {
      id
      text
      author
      isAgent
      insertedAt
      updatedAt
    }
  }
`

export const GET_CONTRACT = gql`
  query ($id: UUID!) {
    contract(id: $id) {
      id
      status
      session
    }
  }
`;

export const GET_MESSAGES = gql`
  query ($chatId: UUID!) {
    messages(condition: {chatId: $chatId}, orderBy: INSERTED_AT_ASC) {
      id
      author
      isAgent
      text
      insertedAt
      updatedAt
    }
  }
`;


export const GET_CHAT = gql`
  query ($chatId: UUID!) {
    chat(id: $chatId) {
      id
      status
      customerName
      headline
      contract {
        agent {
          id
        }
      }
    }
  }
`;

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
`;

export const CREATE_MESSAGE = gql`
  mutation createMessage($text: String!, $author: String!, $chatId: UUID!) {
    createMessage(input: {
      message: {
        text: $text, isAgent: false, author: $author, chatId: $chatId
      }
    }) {
      message {
        id
        text
        author
        isAgent
        insertedAt
        updatedAt
      }
    }
  }
`;

export const END_CHAT = gql`
  mutation endChat($chatId: UUID!) {
    updateChat(
      input: {
        id: $chatId
        patch: {
      		status: "finished"
        }
      }

    ) {
      chat {
        id
        status
      }
    }
  }
`;
