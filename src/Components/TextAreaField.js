import React from 'react'
import { Message, Form, TextArea } from 'semantic-ui-react'

const TextAreaField = ({form, name, label, placeholder = ''}) => (
  <React.Fragment>
    <Form.Field
      control={TextArea}
      type="text"
      label={label}
      name={name}
      placeholder={placeholder}
      onChange={form.handleChange}
      onBlur={form.handleBlur}
      value={form.values[name]}
      error={form.errors[name] !== undefined}
    />
    {form.touched[name] && form.errors[name] &&
      <Message
        error
        header={label + ' is not valid'}
        content={form.errors[name]}
      />
    }
  </React.Fragment>
)

export default TextAreaField
