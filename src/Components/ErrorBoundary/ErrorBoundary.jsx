import { Component } from 'react';
import PropTypes from 'prop-types';
import ErrorFallback from '../ErrorFallback/ErrorFallback.jsx';

/**
 * Lightweight error boundary for the app tree.
 *
 * Deliberately has NO dependency on @sentry/react: Sentry is loaded
 * asynchronously by main.jsx only when a DSN is configured, so the initial
 * bundle stays free of the ~100KB SDK. When Sentry is available it is wired
 * through the optional onError callback; otherwise the boundary still
 * catches errors and shows the ErrorFallback UI.
 */
class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (typeof this.props.onError === 'function') {
      this.props.onError(error, info);
    }
  }

  render() {
    const { error } = this.state;
    if (error) {
      return <ErrorFallback error={error} resetError={() => this.setState({ error: null })} />;
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
  onError: PropTypes.func,
};

export default ErrorBoundary;
