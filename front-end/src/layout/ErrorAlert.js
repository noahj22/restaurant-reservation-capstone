import React from "react";
import "./ErrorAlert.css";

/**
 * Defines the alert message to render if the specified error is truthy.
 * @param error
 *  an instance of an object with `.message` property as a string, typically an Error instance.
 * @returns {JSX.Element}
 *  a bootstrap danger alert that contains the message string.
 */

function ErrorAlert({ error }) {
  return (
    error && (
      <div className="error">
        <p>Error: {error.message}</p>
      </div>
    )
  );
}

export default ErrorAlert;