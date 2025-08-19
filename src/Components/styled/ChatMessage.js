import styled from 'styled-components';

export const MessagePadding = styled.div`
  padding: 10px 24px;
`;

export const MessageContainer = styled.div`
  max-width: 100%;
  word-wrap: break-word;
`;

export const MessageContainerPaddingLeft = styled.div`
  padding-right: 40px;
`;

export const MessageContainerPaddingRight = styled.div`
  padding-left: 40px;
`;

export const MessageAvatar = styled.div`
  margin-bottom: 16px;
`;

export const Flex = styled.div`
  display: flex;
`;

export const FlexBottom = styled.div`
  align-items: flex-end;
`;

export const FlexRight = styled.div`
  justify-content: flex-end;
`;

export const Right = styled.div`
  text-align: right;
`;

export const Opacity4 = styled.div`
  opacity: 0.4;
`;

export const PaddingTop2 = styled.div`
  padding-top: 2px;
`;

// Message bubble styles
export const MessageBubble = styled.div`
  padding: 20px 24px;
  min-height: 44px;
  display: flex;
  align-items: center;
  max-width: 280px;
  width: fit-content;
  border-radius: 18px;
  
  ${props => props.$isAgent ? `
    background: #f1f3f4;
    border: 1px solid #e9ecef;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    color: rgba(0, 0, 0, 0.87);
  ` : `
    background: ${props.$userSpeechBubbleColor || 'var(--primary-color, rgba(39, 175, 96, 1))'};
    box-shadow: 0 2px 8px rgba(39, 175, 96, 0.2);
    color: white;
  `}
  
  p {
    margin: 0;
    font-size: 14px;
    line-height: 1.4;
    font-weight: 400;
  }
  
  @media (max-width: 480px) {
    padding: 16px 20px;
    max-width: 240px;
    min-height: 40px;
  }
`;