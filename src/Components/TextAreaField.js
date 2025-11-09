import React from 'react'
import { FormField, FormLabel, FormTextarea, FormError, FormErrorHeader } from '../components/styled/DesignSystem';

const TextAreaField = ({form, name, label, placeholder = ''}) => {
  const handleChange = (event) => {
    try {
      form.handleChange(event);
    } catch (error) {
      console.error('Error in TextAreaField handleChange:', error);
      // Prevent the error from propagating and causing unhandled promise rejections
    }
  };

  const handleBlur = (event) => {
    try {
      form.handleBlur(event);
    } catch (error) {
      console.error('Error in TextAreaField handleBlur:', error);
      // Prevent the error from propagating and causing unhandled promise rejections
    }
  };

  return (
    <FormField>
      <FormLabel htmlFor={name}>{label}</FormLabel>
      <FormTextarea
        id={name}
        $error={form.errors[name]}
        name={name}
        placeholder={placeholder}
        onChange={handleChange}
        onBlur={handleBlur}
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
  );
};

export default TextAreaField
