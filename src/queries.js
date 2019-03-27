import { gql } from 'apollo-boost'

export const CREATE_CHAT = gql`
mutation createChat($customerName: String!, $headLine: String!, $contractId: ID!) {
  createChat(customerName: $customerName, headLine: $headLine, contractId: $contractId) {
    id
    customerName
    headLine
    status
  }
}`

export const MESSAGE_SUBSCRIPTION = gql`
  subscription ($chatId: ID!) {
    Message(filter: {node: {chat: {id: $chatId}}, mutation_in: [CREATED, UPDATED]}) {
      node {
        id
        author
        isAgent
        text
      }
    }
  }
`

export const GET_CONTRACT = gql`
  query ($id: ID!) {
    Contract(id: $id) {
      id
      status
      session
    }
  }
`;

export const GET_MESSAGES = gql`
  query ($chatId: ID!) {
    allMessages(filter: {chat: {id: $chatId}}) {
      id
      author
      isAgent
      text
    }
  }
`;


export const GET_CHAT = gql`
  query ($chatId: ID!) {
    Chat(id: $chatId) {
      id
      status
      customerName
      headLine
      contract {
        agent {
          id
        }
      }
    }
  }
`;

export const RATE_AGENT = gql`
  mutation createRate($chatId: ID!, $rating: Int!) {
    createRate(rating: $rating, chatId: $chatId) {
      id
    }
  }
`;

export const CREATE_MESSAGE = gql`
  mutation createMessage($text: String!, $author: String!, $chatId: ID!) {
    createMessage(text: $text, isAgent: false, author: $author, chatId: $chatId) {
      id
      text
      author
      isAgent
    }
  }
`;

export const END_CHAT = gql`
  mutation takeChat($chatId: ID!) {
    updateChat(
      id: $chatId
      status: Finished
    ) {
      id
      status
    }
  }
`;
