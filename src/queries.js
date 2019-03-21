import { gql } from 'apollo-boost'

export const CREATE_CHAT = gql`
mutation createChat($customerName: String!, $headLine: String!, $contractId: ID!) {
  createChat(customerName: $customerName, headLine: $headLine, contractId: $contractId) {
    id
    customerName
    headLine
    status
  }
}
`

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
