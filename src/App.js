import React, {useState} from 'react';
import './css/App.css'
import cx from 'classnames'
import CreateChat from './CreateChat'
import Offline from './Offline'

import store from 'store2'
import Query from './Components/Query'
import ChatContainer from './ChatContainer'
import { GET_CHAT, GET_WEBSITE_CONTRACTS } from './queries'
import ToggleOpeningStateButton from './ToggleOpeningStateButton'
import Rate from './Rate'
import { processContractsForCurrentSession, selectContract } from './utils';

const App = () => {
  const activeChat = store('activeChat')
  const websiteId = store('websiteId')
  const [showCreate, setCreate] = useState(!activeChat)
  const [isOpen, setOpen] = useState(true)
  const [showOffline, setOffline] = useState(false)
  const [selectedContract, setSelectedContract] = useState(null)
  const panelStyles = cx(`panel drop-shadow radius overflow-hidden ${isOpen ? 'fadeInUp' : 'hide'}`)
  
  const processContracts = async (allContracts) => {
    const sessionContracts = await processContractsForCurrentSession(allContracts)
    setSelectedContract(selectContract(sessionContracts))
    return sessionContracts.length > 0
  }
  const checkWorkingHours = async (allContracts) => {
    const hasAvailableContracts = await processContracts(allContracts)
    setOffline(!hasAvailableContracts)
  };

  if (showCreate) {
    // Handle missing websiteId
    if (!websiteId) {
      console.error('No websiteId found in local storage')
      return (
        <div className='App'>
          <div>
            <div className='container'>
              <div className={panelStyles}>
                <Offline />
              </div>
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
              <Query query={GET_WEBSITE_CONTRACTS} variables={{ websiteId: websiteId }}>
                {({data, error}) => {
                  if (error) {
                    console.error('Error fetching website contracts:', error)
                    return(<Offline />)
                  }

                  if (!data?.website?.contracts || data.website.contracts.length === 0) {
                    console.warn('No active contracts found for website')
                    return(<Offline />)
                  }

                  checkWorkingHours(data.website.contracts)
                  if (!selectedContract || showOffline) {
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
