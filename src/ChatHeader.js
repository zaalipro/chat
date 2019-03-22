import React from 'react'
const  mainColor = 'rgba(39,175,96,1)'
const companyLogoURL = 'http://imgur.com/qPjLkW0.png'

const ChatHeader = () => (
  <div
    style={{backgroundColor: mainColor}}
    className='header flex header-padding-chat items-center header-shadow'
  >
    <div className='padding-10 flex'>
      <img
        src={companyLogoURL}
        alt=''
        className='avatar fadeInLeft'></img>
      <div className='fadeInLeft gutter-left conversation-title'>
        Company Name
        <p className='fadeInLeft text-opaque'>Started</p>
      </div>
    </div>
  </div>
)

export default ChatHeader
