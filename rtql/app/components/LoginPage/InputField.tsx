import React from 'react';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  isTop?: boolean;
  isBottom?: boolean;
}

/**
 * InputField: Renders a standardized input field with styling and accessibility props.
 */
const InputField: React.FC<InputFieldProps> = ({ label, id, isTop = false, isBottom = false, ...props }) => {
  const borderClasses = isTop ? 'rounded-t-md' : isBottom ? 'rounded-b-md' : 'rounded-none';

  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        name={id}
        required
        className={`appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm ${borderClasses}`}
        placeholder={label}
        {...props}
      />
    </div>
  );
};

export default InputField;