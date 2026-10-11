import { Utensils, Mail, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IconInput, PasswordField } from "./PasswordField";

export interface LoginFormProps {
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading?: boolean;
  error?: string;
}

/** Centred login card with aligned, evenly spaced credential fields. */
export function LoginForm({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  onSubmit,
  isLoading = false,
  error,
}: LoginFormProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Utensils className="h-7 w-7 text-primary-foreground" />
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-2xl">Welcome to NutriDeliver</CardTitle>
            <CardDescription>
              Admin Panel — sign in to your account
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <IconInput
              id="login-email"
              label="Email"
              type="email"
              icon={<Mail className="h-4 w-4" />}
              placeholder="admin@nutrideliver.com"
              autoComplete="email"
              value={email}
              onValueChange={onEmailChange}
              required
              disabled={isLoading}
            />

            <PasswordField
              id="login-password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onValueChange={onPasswordChange}
              required
              disabled={isLoading}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center">
          <p className="text-center text-sm text-muted-foreground">
            Demo credentials: admin@nutrideliver.com / admin123
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
