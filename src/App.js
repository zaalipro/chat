import React, {useState} from 'react';
import { Container } from 'semantic-ui-react'
import CreateChat from './CreateChat'
import store from 'store2'
import ChatContainer from './ChatContainer'

const App = () => {
  const [showCreate, setCreate] = useState(true)
  const activeChat = store('activeChat')

  return(
    <Container>
      {!activeChat &&
        <CreateChat show={showCreate} setCreate={setCreate}/>
      }
      { activeChat &&
        <ChatContainer />
      }
    </Container>
  )
}

export default App;
