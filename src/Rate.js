import React from 'react';
import { Mutation } from '@apollo/client/react/components'
import { RATE_AGENT } from './queries'
import Rating from './Components/Rating'
import { 
  Header, 
  HeaderPadding, 
  HeaderShadow, 
  ConversationHeader, 
  GutterLeft, 
  TextOpaque,
  FadeInLeft,
  OverflowYScroll,
  OverflowXHidden,
  Flex,
  FlexHCenter,
  FullWidth,
  ConversationButtonWrapper,
  PointerEventsNone,
  BackgroundDarkGray,
  DropShadowHover,
  Pointer,
  ConversationButton
} from './components/styled/App';
import { Segment, Button, Mb3 } from './components/styled/DesignSystem';

const Rate = ({chat, setCreate}) => {
  return(
    <span>
      <Header style={{backgroundColor: 'rgba(39,175,96,1)'}} className='header-shadow'>
        <HeaderPadding>
          <ConversationHeader className='gutter-left'>
            <h3 className='fadeInLeft'>Agent feedback</h3>
            <TextOpaque className='fadeInLeft'>Agent Name</TextOpaque>
          </ConversationHeader>
        </HeaderPadding>
      </Header>
      <div className='body'>
        <OverflowYScroll>
          <OverflowXHidden>
            <Mutation mutation={RATE_AGENT}>
            {(createRate) => (
              <Segment>
                <p className="mb-3">Chat finished, Please rate the agent:</p>
                <Rating 
                  icon='star' 
                  defaultRating={3} 
                  maxRating={5} 
                  onRate={(e, {rating}) => {
                    createRate({variables: {
                      chatId: chat.id,
                      rating: rating
                    }}).then(resp => setCreate(true))
                  }}
                />
              </Segment>
            )}
            </Mutation>
            <FlexHCenter>
              <FullWidth>
                <ConversationButtonWrapper className='pointer-events-none'>
                  <Button
                    primary
                    className='pointer-events-initial'
                    onClick={() => setCreate(true)}
                  >
                    New Conversation
                  </Button>
                </ConversationButtonWrapper>
              </FullWidth>
            </FlexHCenter>
          </OverflowXHidden>
        </OverflowYScroll>
      </div>
    </span>
  )
}

export default Rate
