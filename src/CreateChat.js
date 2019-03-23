import React from 'react'
import { Mutation } from 'react-apollo'
import { Formik } from 'formik'
import TextField from './Components/TextField'
import TextAreaField from './Components/TextAreaField'
import { Segment, Form } from 'semantic-ui-react'
import { CREATE_CHAT, CREATE_MESSAGE } from './queries'
import store from 'store2'

const CreateChat = ({setCreate}) => {
  const contractId = store('contractId')
  return (
    <span>
      <div
        style={{backgroundColor: 'rgba(39,175,96,1)'}}
        className='header header-padding header-shadow'
      >
        <div className='conversation-header gutter-left'>
          <h3 className='fadeInLeft'>Start conversation</h3>
          <p className='text-opaque fadeInLeft'>TeamViewer</p>
        </div>
      </div>
      <div className='body overflow-y-scroll overflow-x-hidden'>
        <Mutation mutation={CREATE_CHAT}>
          {(createChat) => (
            <Segment padded>
              <Mutation mutation={CREATE_MESSAGE}>
                {(createMessage) => (
                  <div className="row">
                    <Formik
                      initialValues={{
                        customerName: '',
                        headLine: '',
                      }}
                      validate={validate}
                      onSubmit={(values, { setSubmitting }) => {
                        createChat({variables: {
                          customerName: values.customerName,
                          headLine: values.headLine,
                          contractId: contractId
                        }}).then(resp => {
                          console.log('createmessage start', resp)
                          store('activeChat', resp.data.createChat)
                          store('customerName', values.customerName)
                          createMessage({variables: {
                            text: resp.data.createChat.headLine,
                            author: resp.data.createChat.customerName,
                            isAgent: false,
                            chatId: resp.data.createChat.id
                          }}).then(resp => {
                            setSubmitting(false);
                            setCreate(false)
                          })
                        },
                        errors => {
                          console.log('errors', errors)
                          setSubmitting(false);
                        });
                      }}
                      render={(form) =>  {
                        console.log(form)
                        return(
                        <Form onSubmit={form.handleSubmit} error={form.errors !== {}}>
                          <TextField form={form} name="customerName" label="Customer name" placeholder="John" />
                          <TextAreaField form={form} name="headLine" label="Head line" />
                          <br />
                          <br />
                          <br />
                          <br />
                          <br />
                          <div className='flex flex-hcenter full-width conversation-button-wrapper pointer-events-none'>
                            <div
                              className='conversation-button background-darkgray drop-shadow-hover pointer flex-center flex pointer-events-initial'
                              onClick={() => form.submitForm()}
                            >
                              <p>Start Conversation</p>
                            </div>
                          </div>
                        </Form>
                      )}}
                    />
                  </div>
                )}
              </Mutation>
            </Segment>
          )}
        </Mutation>
      </div>
    </span>
  );
};

const validate = (values) => values => {
  let errors = {};
  if (!values.customerName) {
    errors.customerName = 'Required';
  } else if (values.headLine.length < 1) {
    errors.customerName = 'Customer name should be more than 1 character';
  }
  if (!values.headLine) {
    errors.headLine = 'Required';
  } else if (values.headLine.length < 10) {
    errors.headLine = 'headLine length should be more than 100 characters';
  }
  return errors;
}


export default CreateChat
