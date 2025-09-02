import styled from 'styled-components';

export const ChatContainer = styled.div`
  overflow-y: scroll;
  overflow-x: hidden;
`;

export const Dropzone = styled.div`
  height: calc(100% - 80px);
`;

export const MessageBody = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

export const MessagesArea = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
`;