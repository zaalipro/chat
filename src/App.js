import React, {useState} from 'react';
import './css/App.css'
import cx from 'classnames'
import CreateChat from './CreateChat'
import Offline from './Offline'
import moment from 'moment'
import store from 'store2'
import Query from './Components/Query'
import ChatContainer from './ChatContainer'
import { GET_CHAT, GET_CONTRACT } from './queries'
import ToggleOpeningStateButton from './ToggleOpeningStateButton'
import Rate from './Rate'
import { isWorkingHours, getCurrentTime } from './utils';

const App = () => {
  const activeChat = store('activeChat')
  const contractId = store('contractId')
  const [showCreate, setCreate] = useState(!activeChat)
  const [isOpen, setOpen] = useState(true)
  const [showOffline, setOffline] = useState(false)
  const panelStyles = cx(`panel drop-shadow radius overflow-hidden ${isOpen ? 'fadeInUp' : 'hide'}`)
  const checkWorkingHours = (contractSession) => {
    getCurrentTime()
    .then(function (response) {
      const now = moment(response.data, 'YYYY-MM-DDTHH:mm:ss.SSSSZ').utc()
      setOffline(!isWorkingHours(contractSession, now))
    })
    .catch(function (err) {
      // Fallback to local time if API fails
      const now = moment()
      setOffline(!isWorkingHours(contractSession, now))
    })
    // axios.get(process.env.REACT_APP_API_URL + '/api/time', {
    //   headers: {"Content-Type" : "application/json"}
    // })
    // .then(function ({current_time}) {
    //   const now = moment(current_time)
    //   console.log(isWorkingHours(contractSession, now))
    //   setOffline(!isWorkingHours(contractSession, now))
    // })
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
