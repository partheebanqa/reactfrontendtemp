import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { useForgotPasswordMutation } from "@/store/query/authQuery";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { mutate, isPending, isError } = useForgotPasswordMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    mutate(email, {
      onSuccess: () => {
        // Always show success to avoid user enumeration
        setIsSubmitted(true);
      },
    });
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="mt-4">Check your email</CardTitle>
              <CardDescription>
                We&apos;ve sent password reset instructions to {email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                <p>Didn&apos;t receive the email? Check the spam folder or</p>
                <button
                  className="text-blue-600 hover:text-blue-500 font-medium"
                  onClick={() => setIsSubmitted(false)}
                >
                  try again
                </button>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setLocation("/signin")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to sign in
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Forgot your password?
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enter the email address to receive a reset link
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reset password</CardTitle>
            <CardDescription>
              We&apos;ll send an email with instructions to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  Failed to send reset email. Please try again later.
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    required
                    className="pl-10"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isPending || !email}
              >
                {isPending ? "Sending..." : "Send reset link"}
              </Button>
            </form>

            <div className="text-center">
              <button
                className="text-sm text-blue-600 hover:text-blue-500 font-medium inline-flex items-center"
                onClick={() => setLocation("/signin")}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to sign in
              </button>
            </div>

            <div className="border-t pt-4">
              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                <p className="mb-2">Demo accounts for testing:</p>
                <div className="space-y-1 text-xs">
                  <p><strong>Admin:</strong> admin@apiflow.dev / admin123</p>
                  <p><strong>Developer:</strong> dev@apiflow.dev / dev123</p>
                  <p><strong>QA:</strong> qa@apiflow.dev / qa123</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
