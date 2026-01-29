import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {type Components }from 'react-markdown';

interface ChatContentRendererProps {
    content: string;
}

const ChatContentRenderer: React.FC<ChatContentRendererProps> = ({ content }) => {
    const components: Components = {
        h1: ({ children, ...props }) => (
            <h1 className="text-lg font-bold mt-4 mb-2" {...props}>
                {children}
            </h1>
        ),
        h2: ({ children, ...props }) => (
            <h2 className="text-md font-semibold mt-3 mb-2" {...props}>
                {children}
            </h2>
        ),
        h3: ({ children, ...props }) => (
            <h3 className="text-sm font-semibold mt-2 mb-1" {...props}>
                {children}
            </h3>
        ),
        p: ({ children, ...props }) => (
            <p className="my-2" {...props}>
                {children}
            </p>
        ),
        ul: ({ children, ...props }) => (
            <ul className="list-disc pl-5 my-2" {...props}>
                {children}
            </ul>
        ),
        ol: ({ children, ...props }) => (
            <ol className="list-decimal pl-5 my-2" {...props}>
                {children}
            </ol>
        ),
        li: ({ children, ...props }) => (
            <li className="mb-1" {...props}>
                {children}
            </li>
        ),
        strong: ({ children, ...props }) => (
            <strong className="font-bold" {...props}>
                {children}
            </strong>
        ),
        em: ({ children, ...props }) => (
            <em className="italic" {...props}>
                {children}
            </em>
        ),
        code: ({ className, children, ...props }) => {
            const isInline = !className?.includes('language-');

            return isInline ? (
                <code className="bg-gray-200 px-1.5 py-0.5 rounded text-sm" {...props}>
                    {children}
                </code>
            ) : (
                <pre className="bg-gray-800 text-white p-3 rounded my-2 overflow-x-auto">
                    <code className={className} {...props}>
                        {children}
                    </code>
                </pre>
            );
        },
        blockquote: ({ children, ...props }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2" {...props}>
                {children}
            </blockquote>
        ),
    };

    return (
        <div className="prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
                {content || ''}
            </ReactMarkdown>
        </div>
    );
};

export default ChatContentRenderer;