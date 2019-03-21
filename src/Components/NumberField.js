import React from 'react'
import { Message, Form } from 'semantic-ui-react'

const NumberField = ({form, name, label, placeholder = ''}) => {
  return (
    <React.Fragment>
    <Form.Field
      control='input'
      type="number"
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

}
export default NumberField
