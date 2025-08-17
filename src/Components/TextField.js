import React from 'react'

const TextField = ({form, name, label, placeholder = ''}) => (
  <div className="form-field">
    <label className="form-label" htmlFor={name}>{label}</label>
    <input
      id={name}
      className={`form-input ${form.errors[name] ? 'error' : ''}`}
      type="text"
      name={name}
      placeholder={placeholder}
      onChange={form.handleChange}
      onBlur={form.handleBlur}
      value={form.values[name]}
    />
    {form.touched[name] && form.errors[name] && (
      <div className="form-error">
        <div className="form-error-header">{label} is not valid</div>
        <div>{form.errors[name]}</div>
      </div>
    )}
  </div>
)

export default TextField
