import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-900 text-white min-h-screen">
          <h1 className="text-xl font-bold mb-4">Application Error</h1>
          <pre className="text-xs whitespace-pre-wrap font-mono bg-black/30 p-2 rounded">{this.state.error?.message}</pre>
          <pre className="text-xs whitespace-pre-wrap font-mono bg-black/30 p-2 rounded mt-4">{this.state.error?.stack}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}
