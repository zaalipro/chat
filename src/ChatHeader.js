import React from 'react'
import store from 'store2'

const  mainColor = 'rgba(39,175,96,1)'
const companyLogoURL = 'http://imgur.com/qPjLkW0.png'

const ChatHeader = ({endChat}) => (
  <div
    style={{backgroundColor: mainColor}}
    className='header flex header-padding-chat items-center header-shadow'
  >
    <div className='radius fadeInLeft flex flex-center back-button pointer'>
      <i className='material-icons'>keyboard_arrow_left</i>
    </div>
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
    <div className='radius fadeInLeft flex flex-center back-button pointer' onClick={() => endChat().then(resp => store.remove('activeChat'))}>
      <i className='material-icons'>clear</i>
    </div>
  </div>
)

export default ChatHeader
