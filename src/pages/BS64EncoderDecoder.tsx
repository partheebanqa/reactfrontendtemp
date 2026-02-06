import { useState } from 'react';
import { Copy, CheckCheck, AlertCircle, RotateCcw } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';

interface EncoderDecoderProps {
    title: string;
    description: string;
    onEncode: (text: string) => string;
    onDecode: (text: string) => string;
    inputPlaceholder?: string;
    outputPlaceholder?: string;
    showFormatButton?: boolean;
    onFormat?: (text: string) => string;
}

export default function BS64EncoderDecoder({
    title,
    description,
    onEncode,
    onDecode,
    inputPlaceholder = 'Enter text to encode...',
    outputPlaceholder = 'Encoded result will appear here...',
    showFormatButton = false,
    onFormat,
}: EncoderDecoderProps) {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState('');
    const [copiedInput, setCopiedInput] = useState(false);
    const [copiedOutput, setCopiedOutput] = useState(false);

    const handleEncode = () => {
        try {
            setError('');
            const result = onEncode(input);
            setOutput(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Encoding failed');
        }
    };

    const handleDecode = () => {
        try {
            setError('');
            const result = onDecode(input);
            setOutput(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Decoding failed');
        }
    };

    const handleFormat = () => {
        if (!onFormat) return;
        try {
            setError('');
            const result = onFormat(input);
            setInput(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Formatting failed');
        }
    };

    const handleCopy = async (text: string, type: 'input' | 'output') => {
        try {
            await navigator.clipboard.writeText(text);
            if (type === 'input') {
                setCopiedInput(true);
                setTimeout(() => setCopiedInput(false), 2000);
            } else {
                setCopiedOutput(true);
                setTimeout(() => setCopiedOutput(false), 2000);
            }
        } catch (err) {
            setError('Failed to copy to clipboard');
        }
    };

    const handleSwap = () => {
        setInput(output);
        setOutput(input);
        setError('');
    };

    const handleReset = () => {
        setInput('');
        setError('');
    };

    return (
        <div className="w-full max-w-6xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
                <p className="text-gray-600">{description}</p>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-red-800 text-sm">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label htmlFor="input" className="block text-sm font-medium text-gray-700">
                            Input
                        </label>
                        <div className="flex gap-1">
                            <Tooltip.Provider delayDuration={200}>
                                <Tooltip.Root>
                                    <Tooltip.Trigger asChild>
                                        <button
                                            onClick={handleReset}
                                            disabled={!input}
                                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            aria-label="Clear input text"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                        </button>
                                    </Tooltip.Trigger>
                                    <Tooltip.Portal>
                                        <Tooltip.Content
                                            className="bg-gray-900 text-white px-3 py-2 rounded-md text-sm shadow-lg"
                                            sideOffset={5}
                                        >
                                            Clear input
                                            <Tooltip.Arrow className="fill-gray-900" />
                                        </Tooltip.Content>
                                    </Tooltip.Portal>
                                </Tooltip.Root>
                            </Tooltip.Provider>
                            <Tooltip.Provider delayDuration={200}>
                                <Tooltip.Root>
                                    <Tooltip.Trigger asChild>
                                        <button
                                            onClick={() => handleCopy(input, 'input')}
                                            disabled={!input}
                                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            aria-label="Copy input text"
                                        >
                                            {copiedInput ? (
                                                <CheckCheck className="w-4 h-4 text-green-600" />
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                        </button>
                                    </Tooltip.Trigger>
                                    <Tooltip.Portal>
                                        <Tooltip.Content
                                            className="bg-gray-900 text-white px-3 py-2 rounded-md text-sm shadow-lg"
                                            sideOffset={5}
                                        >
                                            {copiedInput ? 'Copied!' : 'Copy to clipboard'}
                                            <Tooltip.Arrow className="fill-gray-900" />
                                        </Tooltip.Content>
                                    </Tooltip.Portal>
                                </Tooltip.Root>
                            </Tooltip.Provider>
                        </div>
                    </div>
                    <textarea
                        id="input"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={inputPlaceholder}
                        className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                        aria-describedby="input-description"
                    />
                    <div className="flex gap-2 flex-wrap">
                        <Tooltip.Provider delayDuration={200}>
                            <Tooltip.Root>
                                <Tooltip.Trigger asChild>
                                    <button
                                        onClick={handleEncode}
                                        disabled={!input}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                    >
                                        Encode
                                    </button>
                                </Tooltip.Trigger>
                                <Tooltip.Portal>
                                    <Tooltip.Content
                                        className="bg-gray-900 text-white px-3 py-2 rounded-md text-sm shadow-lg"
                                        sideOffset={5}
                                    >
                                        Convert input to encoded format
                                        <Tooltip.Arrow className="fill-gray-900" />
                                    </Tooltip.Content>
                                </Tooltip.Portal>
                            </Tooltip.Root>
                        </Tooltip.Provider>

                        <Tooltip.Provider delayDuration={200}>
                            <Tooltip.Root>
                                <Tooltip.Trigger asChild>
                                    <button
                                        onClick={handleDecode}
                                        disabled={!input}
                                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                    >
                                        Decode
                                    </button>
                                </Tooltip.Trigger>
                                <Tooltip.Portal>
                                    <Tooltip.Content
                                        className="bg-gray-900 text-white px-3 py-2 rounded-md text-sm shadow-lg"
                                        sideOffset={5}
                                    >
                                        Convert encoded input back to original format
                                        <Tooltip.Arrow className="fill-gray-900" />
                                    </Tooltip.Content>
                                </Tooltip.Portal>
                            </Tooltip.Root>
                        </Tooltip.Provider>

                        {showFormatButton && onFormat && (
                            <Tooltip.Provider delayDuration={200}>
                                <Tooltip.Root>
                                    <Tooltip.Trigger asChild>
                                        <button
                                            onClick={handleFormat}
                                            disabled={!input}
                                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                        >
                                            Format JSON
                                        </button>
                                    </Tooltip.Trigger>
                                    <Tooltip.Portal>
                                        <Tooltip.Content
                                            className="bg-gray-900 text-white px-3 py-2 rounded-md text-sm shadow-lg"
                                            sideOffset={5}
                                        >
                                            Pretty print JSON with proper indentation
                                            <Tooltip.Arrow className="fill-gray-900" />
                                        </Tooltip.Content>
                                    </Tooltip.Portal>
                                </Tooltip.Root>
                            </Tooltip.Provider>
                        )}

                        <Tooltip.Provider delayDuration={200}>
                            <Tooltip.Root>
                                <Tooltip.Trigger asChild>
                                    <button
                                        onClick={handleSwap}
                                        disabled={!input && !output}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                    >
                                        Swap
                                    </button>
                                </Tooltip.Trigger>
                                <Tooltip.Portal>
                                    <Tooltip.Content
                                        className="bg-gray-900 text-white px-3 py-2 rounded-md text-sm shadow-lg"
                                        sideOffset={5}
                                    >
                                        Swap input and output values
                                        <Tooltip.Arrow className="fill-gray-900" />
                                    </Tooltip.Content>
                                </Tooltip.Portal>
                            </Tooltip.Root>
                        </Tooltip.Provider>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label htmlFor="output" className="block text-sm font-medium text-gray-700">
                            Output
                        </label>
                        <Tooltip.Provider delayDuration={200}>
                            <Tooltip.Root>
                                <Tooltip.Trigger asChild>
                                    <button
                                        onClick={() => handleCopy(output, 'output')}
                                        disabled={!output}
                                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        aria-label="Copy output text"
                                    >
                                        {copiedOutput ? (
                                            <CheckCheck className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </button>
                                </Tooltip.Trigger>
                                <Tooltip.Portal>
                                    <Tooltip.Content
                                        className="bg-gray-900 text-white px-3 py-2 rounded-md text-sm shadow-lg"
                                        sideOffset={5}
                                    >
                                        {copiedOutput ? 'Copied!' : 'Copy to clipboard'}
                                        <Tooltip.Arrow className="fill-gray-900" />
                                    </Tooltip.Content>
                                </Tooltip.Portal>
                            </Tooltip.Root>
                        </Tooltip.Provider>
                    </div>
                    <textarea
                        id="output"
                        value={output}
                        readOnly
                        placeholder={outputPlaceholder}
                        className="w-full h-64 p-4 border border-gray-300 rounded-lg bg-gray-50 resize-none font-mono text-sm"
                        aria-describedby="output-description"
                    />
                </div>
            </div>
        </div>
    );
}