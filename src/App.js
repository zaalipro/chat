import React, {useState} from 'react';
import './App.css'
import cx from 'classnames'
import CreateChat from './CreateChat'
import store from 'store2'
import Query from './Components/Query'
import ChatContainer from './ChatContainer'
import { GET_CHAT } from './queries'
import ToggleOpeningStateButton from './ToggleOpeningStateButton'
import Rate from './Rate'

const App = () => {
  const activeChat = store('activeChat')
  const [showCreate, setCreate] = useState(!activeChat)
  const [isOpen, setOpen] = useState(true)
  const panelStyles = cx(`panel drop-shadow radius overflow-hidden ${isOpen ? 'fadeInUp' : 'hide'}`)

  if (showCreate) {
    return (
      <div className='App'>
        <div>
          <div className='container'>
            <div className={panelStyles}>
              <CreateChat show={showCreate} setCreate={setCreate}/>
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
                  if (data.Chat.status === "Finished") {
                    return(<Rate chat={data.Chat} setCreate={setCreate} />)
                  }
                  return (
                    <ChatContainer chat={data.Chat} />
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
