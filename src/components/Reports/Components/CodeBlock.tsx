
import React from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";


type Props = {
    code: string;
    language?: "json" | "bash" | "http" | "javascript" | "typescript";
    className?: string;
};

export const CodeBlock: React.FC<Props> = ({ code, language = "json", className }) => {
    return (
        <div className={className}>
            <SyntaxHighlighter
                language={language}
                style={oneDark}
                customStyle={{
                    borderRadius: 8,
                    margin: 0,
                    fontSize: 12.5,
                    lineHeight: 1.6,
                    padding: "12px 14px",
                }}
                wrapLongLines
                showLineNumbers={false}
            >
                {code}
            </SyntaxHighlighter>
        </div>
    );
};
