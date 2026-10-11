import { Component } from "react";

/**
 * Catches render errors from a single chapter and shows a recoverable message
 * instead of letting one malformed page blank the entire application.
 *
 * Keyed by route in DocPage, so navigating away resets the error state.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(prevProps) {
    // A new route is a new chance to render cleanly.
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error, info) {
    console.error("Chapter failed to render:", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6">
        <p className="m-0 font-semibold text-destructive">
          This chapter failed to render
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {this.state.error.message || "An unexpected error occurred."}
        </p>
        <button
          type="button"
          onClick={() => this.setState({ error: null })}
          className="mt-4 rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
        >
          Try again
        </button>
      </div>
    );
  }
}
