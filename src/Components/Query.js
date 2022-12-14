import React from 'react'
import { Message, Dimmer, Loader, Segment } from 'semantic-ui-react'
import { Query as ApolloQuery } from '@apollo/client/react/components'

const Query = ({ children, ...props }) => (
  <ApolloQuery {...props}>
    {(props) => {
      if (props.loading) return <Segment><Dimmer active><Loader /></Dimmer></Segment>
      if (props.error) return <Message error><Message.Content>{props.error}</Message.Content></Message>
      if (props.data === undefined || Object.keys(props.data).length < 1) return 'No Data'

      return children(props)
    }}
  </ApolloQuery>
)

export default Query;