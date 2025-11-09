import React from 'react'

const NumberField = ({form, name, label, placeholder = ''}) => {
  const handleChange = (event) => {
    try {
      form.handleChange(event);
    } catch (error) {
      console.error('Error in NumberField handleChange:', error);
      // Prevent the error from propagating and causing unhandled promise rejections
    }
  };

  const handleBlur = (event) => {
    try {
      form.handleBlur(event);
    } catch (error) {
      console.error('Error in NumberField handleBlur:', error);
      // Prevent the error from propagating and causing unhandled promise rejections
    }
  };

  return (
    <div className="form-field">
      <label className="form-label" htmlFor={name}>{label}</label>
      <input
        id={name}
        className={`form-input ${form.errors[name] ? 'error' : ''}`}
        type="number"
        name={name}
        placeholder={placeholder}
        onChange={handleChange}
        onBlur={handleBlur}
        value={form.values[name]}
      />
      {form.touched[name] && form.errors[name] && (
        <div className="form-error">
          <div className="form-error-header">{label} is not valid</div>
          <div>{form.errors[name]}</div>
        </div>
      )}
    </div>
  );
};

export default NumberField
