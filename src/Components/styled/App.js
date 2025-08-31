import styled, { css } from 'styled-components';
import { fadeInUp } from './keyframes';

// Utility classes from App.css
export const Flex = styled.div`
  display: flex;
`;

export const FlexCenter = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

export const FlexHCenter = styled.div`
  display: flex;
  justify-content: center;
`;

export const FullWidth = styled.div`
  width: 100%;
`;

export const Relative = styled.div`
  position: relative;
`;

export const Row = styled.div`
  width: 100%;
`;

export const Pointer = styled.div`
  cursor: pointer;
`;

export const PointerEventsNone = styled.div`
  pointer-events: none;
`;

export const PointerEventsInitial = styled.div`
  pointer-events: initial;
`;

export const OverflowYScroll = styled.div`
  overflow-y: scroll;
`;

export const OverflowXHidden = styled.div`
  overflow-x: hidden;
`;

export const TextOpaque = styled.div`
  color: rgba(255, 255, 255, 0.8);
`;

export const BackgroundDarkGray = styled.div`
  background-color: #8196b2;
`;

export const DropShadowHover = styled.div`
  box-shadow: 0px 6px 30px -4px rgba(0,0,0,0.0);
  transition: box-shadow 0.3s ease;
  
  &:hover {
    box-shadow: 0px 8px 30px -4px rgba(0, 0, 0, 0.55);
  }
  
  ${props => props.active && `
    box-shadow: 0px 6px 30px -4px rgba(0,0,0,0.45);
  `}
`;

export const HeaderShadow = styled.div`
  box-shadow: 0px -3px 42px 6px rgba(0,0,0,0.17);
`;



export const Hide = styled.div`
  visibility: hidden;
`;

export const GutterLeft = styled.div`
  margin-left: 10px;
`;

export const Padding10 = styled.div`
  padding: 10px;
`;

export const ItemsCenter = styled.div`
  align-items: center;
`;

export const FadeInUp = styled.div`
  ${css`
    animation: ${fadeInUp} 0.4s ease 0s 1 normal;
    -webkit-transform: translateZ(0);
  `}
`;

export const FadeInLeft = styled.div`
  ${css`
    animation: ${fadeInUp} 0.4s ease 0s 1 normal;
    -webkit-transform: translateZ(0);
  `}
`;

// Widget container
export const Container = styled.div`
  position: absolute;
  font-family: 'Open Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
  font-size: 16px;
  line-height: 1.1em;
  font-weight: 400;
  bottom: 0;
  right: 0;
  width: 400px;
  height: 700px;
  padding: 20px 0 20px 20px;
  box-sizing: border-box;
  padding-bottom: 20px;
  
  & div {
    box-sizing: border-box;
  }
  
  & *:focus {
    outline: none;
  }
  
  p {
    font-size: 12px;
    margin-top: 0;
    margin-bottom: 0;
  }
  
  h3 {
    font-size: 16px;
    font-weight: 400;
    margin: 0;
  }
  
  @media screen and (max-height: 700px) {
    height: 100%;
  }
  
  @media screen and (max-height: 450px) {
    height: 450px;
  }
  
  @media screen and (max-width: 450px) {
    height: 100%;
    width: 100%;
    padding: 0;
    
    *:hover {
      box-shadow: none !important;
    }
  }
`;

export const Panel = styled.div`
  position: relative;
  height: calc(100% - 80px);
  background-color: white;
  border-radius: 9px;
  overflow: hidden;
  
  .message-body {
    height: calc(100% - 53px);
  }
  
  .body {
    height: calc(100% - 80px);
  }
  
  ${props => props.$isOpen ? css`
    animation: ${fadeInUp} 0.4s ease 0s 1 normal;
    -webkit-transform: translateZ(0);
  ` : css`
    visibility: hidden;
  `}
`;

export const Header = styled.div`
  color: white;
  height: 80px;
  background-color: #00BCD4;
  border-radius: 9px 9px 0 0;
`;

export const HeaderPadding = styled.div`
  padding-top: 16px;
  padding-left: 12px;
`;

export const HeaderPaddingChat = styled.div`
  padding-top: 16px;
  padding-left: 12px;
  padding-bottom: 8px;
`;

export const Avatar = styled.div`
  position: relative;
  width: 40px;
  min-width: 40px;
  height: 40px;
  min-height: 40px;
  margin-right: 10px;
  border-radius: 50%;
  flex: 0 0 auto;
  background-size: contain;
  background-position: center;
  background-color: white;
`;

export const MessagePadding = styled.div`
  padding: 10px 24px;
`;

export const PaddingTop2 = styled.div`
  padding-top: 2px;
`;

export const ConversationList = styled.div`
  padding-bottom: 80px;
`;

export const ConversationTitle = styled.div`
  height: 40px;
`;

export const LightBackground = styled.div`
  background-color: rgba(240,243,245,1);
`;

export const AvatarSpacer = styled.div`
  padding-left: 50px;
`;

export const Conversation = styled.div`
  border-bottom: solid rgba(211, 211 ,211, 0.31) 1px;
`;

export const ConversationTextPadding = styled.div`
  padding: 0 12px;
`;

export const ConversationAgo = styled.div`
  width: 120px;
  text-align: right;
`;

export const ConversationButtonWrapper = styled.div`
  position: absolute;
  margin-bottom: 20px;
  bottom: 0;
`;

export const ConversationButton = styled.div`
  width: 160px;
  height: 40px;
  border-radius: 20px;
  text-align: center;
  color: white;
`;

export const ConversationHeader = styled.div`
  padding-left: 70px;
  padding-top: 10px;
`;

export const BackButton = styled.div`
  padding: 0 10px;
  margin: 0 4px;
  height: 50px;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.09);
    transition: 0.3s ease background-color;
  }
`;

export const Button = styled.div`
  border-radius: 9px;
  float: right;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background-color: #00BCD4;
  cursor: pointer;
`;

export const MobileButtonClose = styled.div`
  position: absolute;
  right: 20px;
  top: 30px;
  float: right;
  width: 30px;
  height: 30px;
  text-align: center;
  color: white;
  font-size: 30px;
  display: none;
  
  @media screen and (max-width: 450px) {
    display: block;
  }
`;

export const RotateToggleButton = styled.div`
  ${css`
    animation: rotate 0.4s ease 0s 1 normal;
  `}
`;