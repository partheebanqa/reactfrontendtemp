import * as Tabs from '@radix-ui/react-tabs';
import { Code2 } from 'lucide-react';

import { base64Decode, base64Encode, formatJson, utf8Decode, utf8Encode } from '@/utils/encoders';
import EncoderDecoder from '@/components/EncoderDecoder/EncoderDecoder';
import LandingLayout from '@/components/LandingLayout/LandingLayout';


function UTFEncoderDecoder() {
    return (
        <LandingLayout>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="container mx-auto px-4 py-8 sm:py-12">
                    <header className="text-center mb-8 sm:mb-12">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="p-3 bg-blue-600 rounded-lg">
                                <Code2 className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                                UTF-8  Encoder & Decoder
                            </h1>
                        </div>
                        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                            Professional UTF-8 encoding/decoding utility for QA teams and developers.
                            Perfect for testing, debugging, and data validation.
                        </p>
                    </header>

                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">

                        <EncoderDecoder
                            title="UTF-8 Encoder & Decoder"
                            description="Convert text to UTF-8 byte sequences and decode UTF-8 byte sequences back to text. Essential for debugging character encoding issues and understanding text encoding."
                            onEncode={utf8Encode}
                            onDecode={utf8Decode}
                            inputPlaceholder="Enter text to convert to UTF-8 bytes, or paste UTF-8 bytes (space-separated) to decode..."
                            outputPlaceholder="UTF-8 bytes or decoded text will appear here..."
                        />

                    </div>

                    <section className="mt-12 max-w-6xl mx-auto">
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sm:p-8">

                            <div className="prose prose-gray max-w-none">
                                <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Use Cases</h3>
                                <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                                    <li><strong>API Testing:</strong> Encode and decode request/response payloads</li>
                                    <li><strong>Debugging:</strong> Investigate encoded data in logs and error messages</li>
                                    <li><strong>Data Validation:</strong> Verify that encoding/decoding produces expected results</li>
                                    <li><strong>Security Testing:</strong> Analyze Base64-encoded tokens and credentials</li>
                                    <li><strong>Character Encoding Issues:</strong> Debug UTF-8 encoding problems in internationalized applications</li>
                                    <li><strong>Production Support:</strong> Quickly decode production data during incident investigation</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">How to Use</h3>
                                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                                    <li>Select the encoding type (Base64 or UTF-8) using the tabs above</li>
                                    <li>Enter or paste your text in the input field</li>
                                    <li>Click "Encode" to convert to the encoded format, or "Decode" to convert back</li>
                                    <li>Use the copy icon to copy input or output to your clipboard</li>
                                    <li>Use the "Swap" button to move output back to input for further processing</li>
                                    <li>For JSON data in Base64, use the "Format JSON" button to pretty-print before encoding</li>
                                </ol>
                            </div>
                        </div>
                    </section>

                </div>
            </div>
        </LandingLayout>
    );
}

export default UTFEncoderDecoder;
