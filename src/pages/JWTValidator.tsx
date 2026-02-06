import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import LandingLayout from '@/components/LandingLayout/LandingLayout';

interface DecodedToken {
    exp?: number;
    iat?: number;
    nbf?: number;
    [key: string]: unknown;
}

interface ValidationResult {
    isValid: boolean;
    isValidForNext2Mins: boolean;
    expiryDate: Date | null;
    error?: string;
    decodedPayload?: DecodedToken;
}

export function JWTValidator() {
    const [token, setToken] = useState('');
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

    const decodeJWT = (token: string): DecodedToken | null => {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new Error('Invalid JWT format');
            }

            const payload = parts[1];
            const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );

            return JSON.parse(jsonPayload);
        } catch (error) {
            return null;
        }
    };

    const validateToken = () => {
        if (!token.trim()) {
            setValidationResult({
                isValid: false,
                isValidForNext2Mins: false,
                expiryDate: null,
                error: 'Please enter a JWT token',
            });
            return;
        }

        const decoded = decodeJWT(token);

        if (!decoded) {
            setValidationResult({
                isValid: false,
                isValidForNext2Mins: false,
                expiryDate: null,
                error: 'Invalid JWT token format',
            });
            return;
        }

        if (!decoded.exp) {
            setValidationResult({
                isValid: false,
                isValidForNext2Mins: false,
                expiryDate: null,
                error: 'Token does not contain expiry (exp) field',
            });
            return;
        }

        const expiryDate = new Date(decoded.exp * 1000);
        const currentTime = Date.now();
        const twoMinutesFromNow = currentTime + 2 * 60 * 1000;

        const isValid = expiryDate.getTime() > currentTime;
        const isValidForNext2Mins = expiryDate.getTime() > twoMinutesFromNow;

        setValidationResult({
            isValid,
            isValidForNext2Mins,
            expiryDate,
            decodedPayload: decoded,
        });
    };

    const formatDate = (date: Date): string => {
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short',
        });
    };

    const getTimeRemaining = (expiryDate: Date): string => {
        const now = Date.now();
        const diff = expiryDate.getTime() - now;

        if (diff <= 0) {
            return 'Expired';
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const parts = [];
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (seconds > 0) parts.push(`${seconds}s`);

        return parts.join(' ') || 'Just expired';
    };

    return (
        <LandingLayout>
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
                <Card className="w-full max-w-2xl shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">JWT Token Validator</CardTitle>
                        <CardDescription>
                            Validate JWT token expiry and check if it's valid for the next 2 minutes
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="jwt-token" className="text-sm font-medium">
                                JWT Token
                            </label>
                            <div className="flex gap-2">
                                <Input
                                    id="jwt-token"
                                    type="text"
                                    placeholder="Enter JWT token (e.g., eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    className="font-mono text-xs"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            validateToken();
                                        }
                                    }}
                                />
                                <Button onClick={validateToken} className="shrink-0">
                                    Validate
                                </Button>
                            </div>
                        </div>

                        {validationResult && (
                            <div className="space-y-4">
                                {validationResult.error ? (
                                    <Alert variant="destructive">
                                        <XCircle className="h-4 w-4" />
                                        <AlertDescription>{validationResult.error}</AlertDescription>
                                    </Alert>
                                ) : (
                                    <>
                                        <Alert
                                            variant={validationResult.isValidForNext2Mins ? 'default' : 'destructive'}
                                            className={
                                                validationResult.isValidForNext2Mins
                                                    ? 'border-green-500 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100'
                                                    : ''
                                            }
                                        >
                                            {validationResult.isValidForNext2Mins ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            ) : (
                                                <XCircle className="h-4 w-4" />
                                            )}
                                            <AlertDescription className="font-semibold">
                                                {validationResult.isValidForNext2Mins
                                                    ? 'Token is valid and will remain valid for at least 2 more minutes'
                                                    : validationResult.isValid
                                                        ? 'Token is currently valid but will expire within 2 minutes'
                                                        : 'Token has expired'}
                                            </AlertDescription>
                                        </Alert>

                                        {validationResult.expiryDate && (
                                            <div className="space-y-3 rounded-lg border bg-slate-50 dark:bg-slate-900 p-4">
                                                <div className="flex items-start gap-3">
                                                    <Clock className="h-5 w-5 text-slate-600 dark:text-slate-400 mt-0.5" />
                                                    <div className="space-y-1 flex-1">
                                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                            Valid Until
                                                        </p>
                                                        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                                            {formatDate(validationResult.expiryDate)}
                                                        </p>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                                            {validationResult.isValid
                                                                ? `Expires in: ${getTimeRemaining(validationResult.expiryDate)}`
                                                                : 'This token has expired'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {validationResult.decodedPayload && (
                                            <details className="group">
                                                <summary className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100">
                                                    View Token Payload
                                                </summary>
                                                <pre className="mt-2 rounded-lg bg-slate-100 dark:bg-slate-800 p-4 text-xs overflow-x-auto">
                                                    {JSON.stringify(validationResult.decodedPayload, null, 2)}
                                                </pre>
                                            </details>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </LandingLayout>
    );
}