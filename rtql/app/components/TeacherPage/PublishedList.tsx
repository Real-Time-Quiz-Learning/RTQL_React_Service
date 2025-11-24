import React from 'react';

interface Question {
    id: string;
    text: string;
    options: string[];
    correct: number;
    explanation: string;
    topic: string;
    timestamp: string;
    isEdited?: boolean;
    isPersisted?: boolean;
    publishedAt?: number;
    active?: boolean;
    processed?: boolean;
}

interface PublishedListProps {
    published: Question[];
    roomId?: string;
    onMarkInactive?: (qid: string) => void;
}

const PublishedList: React.FC<PublishedListProps> = ({ published, roomId, onMarkInactive }) => {
    return (
        <div className="w-full mt-6">
            <h3 className="text-xl font-extrabold text-gray-800 mb-3 text-left">Published Questions ({published.length})</h3>
            <div className="w-full max-h-48 overflow-y-auto bg-white p-4 border border-gray-300 rounded-xl text-left text-sm shadow-inner space-y-2">
                {published.length > 0 ? (
                    [...published].reverse().map((q, i) => (
                        <div key={q.id + '-' + (q.publishedAt ?? i)} className="flex justify-between items-center p-2 border-b border-gray-100 last:border-b-0 hover:bg-green-50 rounded-lg transition">
                            <div className="flex items-center gap-3 flex-grow">
                                <span className={`font-bold mr-2 text-sm flex-shrink-0 ${q.active ? 'text-green-600' : 'text-gray-500'}`}>P{published.length - i}</span>
                                <p className="text-gray-800 font-medium">
                                    {q.text || <span className="italic text-gray-400">(No question text)</span>}
                                </p>
                                {q.active ? (
                                    <span className="ml-3 px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">Active</span>
                                ) : q.processed ? (
                                    <span className="ml-3 px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-700">Inactive</span>
                                ) : (
                                    <span className="ml-3 px-2 py-1 text-xs font-semibold rounded bg-yellow-50 text-yellow-700">Queued</span>
                                )}
                            </div>
                            <div className="ml-4 text-right text-xs text-gray-500 flex items-center gap-3">
                                <div>{q.publishedAt ? new Date(q.publishedAt).toLocaleTimeString() : ''}</div>
                                {q.active && !q.processed && onMarkInactive && (
                                    <button
                                        onClick={() => onMarkInactive(q.id)}
                                        className="px-3 py-1 bg-red-600 text-white rounded-md text-xs font-semibold hover:bg-red-700"
                                    >
                                        Mark Inactive
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-400 italic p-4 text-center">No questions have been published yet.</p>
                )}
            </div>
        </div>
    );
};

export default PublishedList;
