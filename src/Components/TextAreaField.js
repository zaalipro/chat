import React from 'react'
import { FormField, FormLabel, FormTextarea, FormError, FormErrorHeader } from '../components/styled/DesignSystem';

const TextAreaField = ({form, name, label, placeholder = ''}) => (
  <FormField>
    <FormLabel htmlFor={name}>{label}</FormLabel>
    <FormTextarea
      id={name}
      $error={form.errors[name]}
      name={name}
      placeholder={placeholder}
      onChange={form.handleChange}
      onBlur={form.handleBlur}
      value={form.values[name]}
      rows={4}
    />
    {form.touched[name] && form.errors[name] && (
      <FormError>
        <FormErrorHeader>{label} is not valid</FormErrorHeader>
        <div>{form.errors[name]}</div>
      </FormError>
    )}
  </FormField>
)

export default TextAreaField
