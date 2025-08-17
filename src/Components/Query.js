import React from 'react'
import { Query as ApolloQuery } from '@apollo/client/react/components'

const Query = ({ children, ...props }) => (
  <ApolloQuery {...props}>
    {(props) => {
      if (props.loading) {
        return (
          <div className="segment dimmer active">
            <div className="loader-container">
              <div className="loader"></div>
              <div className="loader-text">Loading...</div>
            </div>
          </div>
        )
      }
      
      if (props.error) {
        return (
          <div className="message error">
            <div className="message-header">Error</div>
            <div>{props.error.message}</div>
          </div>
        )
      }
      
      if (props.data === undefined || Object.keys(props.data).length < 1) {
        return (
          <div className="message info">
            <div className="message-header">No Data</div>
            <div>No data available</div>
          </div>
        )
      }

      return children(props)
    }}
  </ApolloQuery>
)

export default Query;