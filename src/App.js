import React, {useState} from 'react';
import { Segment } from 'semantic-ui-react'
import { useMutation } from 'react-apollo-hooks'
import CreateChat from './CreateChat'
import store from 'store2'
import Query from './Components/Query'
import ChatContainer from './ChatContainer'
import { GET_CHAT } from './queries'
import Rate from './Rate'

const App = () => {
  const activeChat = store('activeChat')
  const [showCreate, setCreate] = useState(!activeChat)

  if (showCreate) {
    return (
      <CreateChat show={showCreate} setCreate={setCreate}/>
    )
  }

  return (
    <Query query={GET_CHAT} variables={{ chatId: activeChat.id }}>
      {({ data}) => (
        <Segment>
          { data.Chat.status === "Finished" &&
            <Rate chat={data.Chat} setCreate={setCreate} />
          }
          { data.Chat.status !== "Finished" &&
            <ChatContainer chat={data.Chat} />
          }
        </Segment>
      )}
    </Query>
  )
}

export default App;
