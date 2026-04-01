import './LoadingSpinner.css';

/**
 * REUSABLE LOADING SPINNER
 * @param {boolean} fullScreen - Whether to show as a full-screen overlay
 * @param {string} text - Optional loading message to display
 * @param {string} size - 'small', 'medium', or 'large'
 */
export default function LoadingSpinner({ fullScreen = false, text = '', size = 'medium' }) {
  const containerClasses = `loading-container ${fullScreen ? 'full-screen' : ''}`;
  const spinnerClasses = `spinner ${size}`;

  return (
    <div className={containerClasses}>
      <div className={spinnerClasses}></div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
}
