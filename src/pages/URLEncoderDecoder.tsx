import { useState } from 'react';
import { Copy, RotateCcw, ArrowRightLeft, Code2, Moon, Sun } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

import { decodeURL, encodeURL } from '@/utils/urlEncoder';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';



export function URLEncoderDecoder() {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [copiedTooltip, setCopiedTooltip] = useState('Copy to clipboard');
    const { theme, toggleTheme } = useTheme();

    const handleEncode = () => {
        if (!input.trim()) {
            setError('Please enter some text to encode');
            setOutput('');
            return;
        }

        try {
            setError('');
            const encoded = encodeURL(input);
            setOutput(encoded);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to encode URL');
            setOutput('');
        }
    };

    const handleDecode = () => {
        if (!input.trim()) {
            setError('Please enter some text to decode');
            setOutput('');
            return;
        }

        try {
            setError('');
            const decoded = decodeURL(input);
            setOutput(decoded);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to decode URL');
            setOutput('');
        }
    };

    const handleReset = () => {
        setInput('');
        setOutput('');
        setError('');
    };

    const handleCopy = async () => {
        if (!output) return;

        try {
            await navigator.clipboard.writeText(output);
            setCopiedTooltip('Copied!');
            setTimeout(() => setCopiedTooltip('Copy to clipboard'), 2000);
        } catch (err) {
            setError('Failed to copy to clipboard');
        }
    };

    return (

        <Tooltip.Provider delayDuration={200}>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 transition-colors pt-10">
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex-1" />
                        <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                                <button
                                    onClick={toggleTheme}
                                    className="p-2.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors shadow-md"
                                    aria-label="Toggle theme"
                                >
                                    {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                                </button>
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                                <Tooltip.Content
                                    className="bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 px-3 py-2 rounded-lg text-sm shadow-lg"
                                    sideOffset={5}
                                >
                                    {theme === 'light' ? 'Dark mode' : 'Light mode'}
                                    <Tooltip.Arrow className="fill-slate-800 dark:fill-slate-200" />
                                </Tooltip.Content>
                            </Tooltip.Portal>
                        </Tooltip.Root>
                    </div>

                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center mb-4">
                            <Code2 className="w-10 h-10 text-blue-600 dark:text-blue-400 mr-3" />
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-white">
                                URL Encoder / Decoder
                            </h1>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
                            RFC 3986 compliant URL encoder and decoder for developers and QA teams.
                            Encode and decode URLs, query strings, and URI components instantly.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 md:p-8 transition-colors">
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-3">
                                <label htmlFor="input" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                                    Input
                                </label>
                                <Tooltip.Root>
                                    <Tooltip.Trigger asChild>
                                        <button
                                            onClick={handleReset}
                                            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={!input && !output}
                                            aria-label="Clear all input and output"
                                        >
                                            <RotateCcw className="w-5 h-5" />
                                        </button>
                                    </Tooltip.Trigger>
                                    <Tooltip.Portal>
                                        <Tooltip.Content
                                            className="bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 px-3 py-2 rounded-lg text-sm shadow-lg"
                                            sideOffset={5}
                                        >
                                            Clear all
                                            <Tooltip.Arrow className="fill-slate-800 dark:fill-slate-200" />
                                        </Tooltip.Content>
                                    </Tooltip.Portal>
                                </Tooltip.Root>
                            </div>
                            <textarea
                                id="input"
                                value={input}
                                onChange={(e) => {
                                    setInput(e.target.value);
                                    setError('');
                                }}
                                placeholder="Enter your text to encode or decode..."
                                className="w-full h-32 md:h-40 px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 outline-none resize-none text-slate-800 dark:text-white bg-white dark:bg-slate-700 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
                                aria-describedby={error ? 'error-message' : undefined}
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            <Tooltip.Root>
                                <Tooltip.Trigger asChild>
                                    <button
                                        onClick={handleEncode}
                                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!input.trim()}
                                    >
                                        <ArrowRightLeft className="w-5 h-5" />
                                        Encode
                                    </button>
                                </Tooltip.Trigger>
                                <Tooltip.Portal>
                                    <Tooltip.Content
                                        className="bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 px-3 py-2 rounded-lg text-sm shadow-lg"
                                        sideOffset={5}
                                    >
                                        Convert text to URL-safe format
                                        <Tooltip.Arrow className="fill-slate-800 dark:fill-slate-200" />
                                    </Tooltip.Content>
                                </Tooltip.Portal>
                            </Tooltip.Root>

                            <Tooltip.Root>
                                <Tooltip.Trigger asChild>
                                    <button
                                        onClick={handleDecode}
                                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white font-medium py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!input.trim()}
                                    >
                                        <ArrowRightLeft className="w-5 h-5 rotate-180" />
                                        Decode
                                    </button>
                                </Tooltip.Trigger>
                                <Tooltip.Portal>
                                    <Tooltip.Content
                                        className="bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 px-3 py-2 rounded-lg text-sm shadow-lg"
                                        sideOffset={5}
                                    >
                                        Convert URL-encoded text to readable format
                                        <Tooltip.Arrow className="fill-slate-800 dark:fill-slate-200" />
                                    </Tooltip.Content>
                                </Tooltip.Portal>
                            </Tooltip.Root>
                        </div>

                        {error && (
                            <div
                                id="error-message"
                                role="alert"
                                className="mb-6 p-4 bg-red-50 dark:bg-red-950 border-l-4 border-red-500 rounded-lg transition-colors"
                            >
                                <p className="text-red-700 dark:text-red-200 text-sm font-medium">{error}</p>
                            </div>
                        )}

                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label htmlFor="output" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                                    Output
                                </label>
                                <Tooltip.Root>
                                    <Tooltip.Trigger asChild>
                                        <button
                                            onClick={handleCopy}
                                            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={!output}
                                            aria-label="Copy output to clipboard"
                                        >
                                            <Copy className="w-5 h-5" />
                                        </button>
                                    </Tooltip.Trigger>
                                    <Tooltip.Portal>
                                        <Tooltip.Content
                                            className="bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-800 px-3 py-2 rounded-lg text-sm shadow-lg"
                                            sideOffset={5}
                                        >
                                            {copiedTooltip}
                                            <Tooltip.Arrow className="fill-slate-800 dark:fill-slate-200" />
                                        </Tooltip.Content>
                                    </Tooltip.Portal>
                                </Tooltip.Root>
                            </div>
                            <textarea
                                id="output"
                                value={output}
                                readOnly
                                placeholder="Your encoded or decoded result will appear here..."
                                className="w-full h-32 md:h-40 px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 resize-none outline-none transition-colors"
                                aria-live="polite"
                            />
                        </div>
                    </div>

                    <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 md:p-8 transition-colors">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">About URL Encoding</h2>
                        <div className="space-y-4 text-slate-600 dark:text-slate-400 text-sm md:text-base">
                            <p>
                                URL encoding (percent-encoding) is a mechanism for encoding information in a
                                Uniform Resource Identifier (URI) under certain circumstances. It's used to
                                encode special characters in URLs to ensure they are transmitted correctly
                                over the internet.
                            </p>
                            <div>
                                <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Common Use Cases:</h3>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li>Encoding query parameters in URLs</li>
                                    <li>Handling special characters in API requests</li>
                                    <li>Debugging URL-related issues in web applications</li>
                                    <li>Testing application behavior with encoded data</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Examples:</h3>
                                <div className="bg-slate-50 dark:bg-slate-700 p-3 rounded-lg font-mono text-sm transition-colors">
                                    <div className="mb-2">
                                        <span className="text-slate-500 dark:text-slate-400">Original:</span>
                                        <span className="text-slate-800 dark:text-white ml-2">Hello World!</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 dark:text-slate-400">Encoded:</span>
                                        <span className="text-slate-800 dark:text-white ml-2">Hello%20World%21</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <footer className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                        <p>
                            RFC 3986 compliant | Part of{' '}
                            <a
                                href="https://optraflow.com"
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                OptraFlow Tools
                            </a>
                        </p>
                    </footer>
                </div>
            </div>
        </Tooltip.Provider>

    );
}