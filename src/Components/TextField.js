import React from 'react'
import { FormField, FormLabel, FormInput, FormError, FormErrorHeader } from '../components/styled/DesignSystem';

const TextField = ({form, name, label, placeholder = ''}) => (
  <FormField>
    <FormLabel htmlFor={name}>{label}</FormLabel>
    <FormInput
      id={name}
      $error={form.errors[name]}
      type="text"
      name={name}
      placeholder={placeholder}
      onChange={form.handleChange}
      onBlur={form.handleBlur}
      value={form.values[name]}
    />
    {form.touched[name] && form.errors[name] && (
      <FormError>
        <FormErrorHeader>{label} is not valid</FormErrorHeader>
        <div>{form.errors[name]}</div>
      </FormError>
    )}
  </FormField>
)

export default TextField
