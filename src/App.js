import React, {useState} from 'react';
import './App.css'
import cx from 'classnames'
import CreateChat from './CreateChat'
import Offline from './Offline'
import axios from 'axios'
import moment from 'moment'
import store from 'store2'
import Query from './Components/Query'
import ChatContainer from './ChatContainer'
import { GET_CHAT, GET_CONTRACT } from './queries'
import ToggleOpeningStateButton from './ToggleOpeningStateButton'
import Rate from './Rate'

export const isWorkingHours = (session, currentTime) => {
  switch (session) {
    case 1:
      return currentTime.hours() >= 0 && currentTime.hours() < 8
    case 2:
      return currentTime.hours() >= 8 && currentTime.hours() < 16
    case 3:
      return currentTime.hours() >= 16 && currentTime.hours() < 24
    default:
      return "non existing"
  }
}

const App = () => {
  const activeChat = store('activeChat')
  const contractId = store('contractId')
  console.log('contractId', contractId)
  const [showCreate, setCreate] = useState(!activeChat)
  const [isOpen, setOpen] = useState(true)
  const [showOffline, setOffline] = useState(false)
  const panelStyles = cx(`panel drop-shadow radius overflow-hidden ${isOpen ? 'fadeInUp' : 'hide'}`)
  const checkWorkingHours = (contractSession) => {
    axios.get('http://localhost:4000/api/time', {
      headers: {"Content-Type" : "application/json"}
    })
    .then(function ({current_time}) {
      const now = moment(current_time)
      console.log(isWorkingHours(contractSession, now))
      setOffline(!isWorkingHours(contractSession, now))
    })
  };

  if (showCreate) {
    return (
      <div className='App'>
        <div>
          <div className='container'>
            <div className={panelStyles}>
              <Query query={GET_CONTRACT} variables={{ id: contractId }}>
                {({data}) => {
                  checkWorkingHours(data.contract.session)
                  if (data.contract.status !== "active" || showOffline) {
                    return(<Offline />)
                  }

                  return(<CreateChat show={showCreate} setCreate={setCreate}/>)
                }}
              </Query>

            </div>
            <ToggleOpeningStateButton
              isOpen={isOpen}
              togglePanel={() => setOpen(!isOpen)}
              mainColor={'rgba(39,175,96,1)'}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
      <div className='App'>
        <div>
          <div className='container'>
            <div className={panelStyles}>
              <Query query={GET_CHAT} variables={{ chatId: activeChat.id }}>
                {({ data}) => {
                  if (data.chat.status === "finished") {
                    return(<Rate chat={data.chat} setCreate={setCreate} />)
                  }
                  return (
                    <ChatContainer chat={data.chat} />
                  )
                }}
              </Query>
            </div>
            <ToggleOpeningStateButton
              isOpen={isOpen}
              togglePanel={() => setOpen(!isOpen)}
              mainColor={'rgba(39,175,96,1)'}
            />
          </div>
        </div>
      </div>
  )
}

export default App;
