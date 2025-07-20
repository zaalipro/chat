import React from 'react';
import { Segment, Rating } from 'semantic-ui-react'
import { Mutation } from '@apollo/client/react/components'
import { RATE_AGENT } from './queries'
import store from 'store2'

const Rate = ({ chat, setCreate }) => {
  return (
    <span>
      <div
        style={{ backgroundColor: 'rgba(39,175,96,1)' }}
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
              <Rating icon='star' defaultRating={3} maxRating={5} onRate={(e, { rating }) => {
                createRate({
                  variables: {
                    chatId: chat.id,
                    rating: rating
                  }
                }).then(resp => {
                  // Remove the finished chat from localStorage
                  store.remove('activeChat')
                  setCreate(true)
                })
              }} />
            </Segment>
          )}
        </Mutation>
        <div className='flex flex-hcenter full-width conversation-button-wrapper pointer-events-none'>
          <div
            className='conversation-button background-darkgray drop-shadow-hover pointer flex-center flex pointer-events-initial'
            onClick={() => {
              // Remove the finished chat from localStorage
              store.remove('activeChat')
              setCreate(true)
            }}
          >
            <p>New Conversation</p>
          </div>
        </div>
      </div>
    </span>
  )
}

export default Rate
