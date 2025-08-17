import React from 'react'

const TextAreaField = ({form, name, label, placeholder = ''}) => (
  <div className="form-field">
    <label className="form-label" htmlFor={name}>{label}</label>
    <textarea
      id={name}
      className={`form-textarea ${form.errors[name] ? 'error' : ''}`}
      name={name}
      placeholder={placeholder}
      onChange={form.handleChange}
      onBlur={form.handleBlur}
      value={form.values[name]}
      rows={4}
    />
    {form.touched[name] && form.errors[name] && (
      <div className="form-error">
        <div className="form-error-header">{label} is not valid</div>
        <div>{form.errors[name]}</div>
      </div>
    )}
  </div>
)

export default TextAreaField
