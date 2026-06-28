import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return <>{this.props.fallback}</>;

      return (
        <div
          role="alert"
          className="min-h-screen flex items-center justify-center bg-background p-4"
        >
          <div className="max-w-md w-full rounded-lg border border-border bg-card p-6 shadow-lg text-center space-y-4">
            <div className="flex justify-center">
              <AlertTriangle
                className="h-12 w-12 text-destructive"
                aria-hidden="true"
              />
            </div>
            <h1 className="text-xl font-semibold text-foreground">
              Algo deu errado
            </h1>
            <p className="text-sm text-muted-foreground break-words">
              {this.state.error?.message ??
                "Ocorreu um erro inesperado na aplicação."}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
              <Button variant="outline" onClick={this.handleReset}>
                Tentar novamente
              </Button>
              <Button onClick={this.handleReload}>Recarregar página</Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
