import React from 'react';
import { Segment, Rating } from 'semantic-ui-react'
import { Mutation } from 'react-apollo'
import { RATE_AGENT } from './queries'

const Rate = ({chat, setCreate}) => {
  return(
    <span>
      <div
        style={{backgroundColor: 'rgba(39,175,96,1)'}}
        className='header header-padding header-shadow'
      >
        <div className='conversation-header gutter-left'>
          <h3 className='fadeInLeft'>Agent feedback</h3>
          <p className='text-opaque fadeInLeft'>Agent Name</p>
        </div>
      </div>
      <div className='body overflow-y-scroll overflow-x-hidden'>
        <Mutation mutation={RATE_AGENT}>
        {(createRate) => (
          <Segment>
            chat finished, Please rate an agent:
            <Rating icon='star' defaultRating={5} maxRating={10} onRate={(e, {rating}) => {
              createRate({variables: {
                chatId: chat.id,
                rating: rating
              }}).then(resp => setCreate(true))
            }}/>
          </Segment>
        )}
        </Mutation>
        <div className='flex flex-hcenter full-width conversation-button-wrapper pointer-events-none'>
          <div
            className='conversation-button background-darkgray drop-shadow-hover pointer flex-center flex pointer-events-initial'
            onClick={() => setCreate(true)}
          >
            <p>New Conversation</p>
          </div>
        </div>
      </div>
    </span>
  )
}

export default Rate
