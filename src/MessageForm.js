import React from 'react'
import { Formik, Form } from 'formik'
import { Mutation } from 'react-apollo'
import { Button, Input } from 'semantic-ui-react'
import store from 'store2'
import { CREATE_MESSAGE } from './queries'

const MessageForm = ({chatId}) => {
  return (
    <Mutation mutation={CREATE_MESSAGE}>
      {(createMessage, { data }) => (
        <Formik
          initialValues={{message: '' }}
          onSubmit={(values, {setValues, setSubmitting}) => {
            createMessage({ variables: {
              text: values.message,
              author: store('customerName'),
              chatId
            } });
            setValues({message: ''})
            setSubmitting(false)
          }}
          render={({ values, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
            <Form onSubmit={handleSubmit}>
              <Input
                type="text"
                name="message"
                onChange={handleChange}
                onBlur={handleBlur}
                value={values.message}
              />
              <Button type="submit" disabled={isSubmitting} style={{marginLeft: '10px'}}>
                Search
              </Button>
            </Form>
          )}
        />
      )}
    </Mutation>
  );
}

export default MessageForm
