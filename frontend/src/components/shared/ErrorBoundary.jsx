import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 m-8 bg-red-900 border border-red-500 rounded text-red-100">
          <h1 className="text-xl font-bold mb-4">Something went wrong.</h1>
          <pre className="whitespace-pre-wrap text-sm">{this.state.error?.toString()}</pre>
          <pre className="whitespace-pre-wrap text-sm mt-4 text-red-300">{this.state.errorInfo?.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
