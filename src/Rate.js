import React from 'react';
import { Mutation } from '@apollo/client/react/components'
import { RATE_AGENT } from './queries'
import Rating from './Components/Rating'

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
          <div className="segment">
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
          </div>
        )}
        </Mutation>
        <div className='flex flex-hcenter full-width conversation-button-wrapper pointer-events-none'>
          <button
            className='conversation-button background-darkgray drop-shadow-hover pointer flex-center flex pointer-events-initial btn btn-primary'
            onClick={() => setCreate(true)}
          >
            New Conversation
          </button>
        </div>
      </div>
    </span>
  )
}

export default Rate
