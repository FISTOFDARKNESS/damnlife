import badwordsList from './badwords.json';

// Create a unified regular expression for strict word boundary matching
// Sort by length descending to ensure longer phrases match before shorter sub-words
const sortedWords = [...(badwordsList as string[])].sort((a, b) => b.length - a.length);

// Escape special regex characters in the words
function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const pattern = sortedWords.map(escapeRegExp).join('|');
// The regex \b ensures we match complete words, ignoring case
const profanityRegex = new RegExp(`\\b(${pattern})\\b`, 'i');

export function containsBadWord(text: string): string | null {
    if (!text || typeof text !== 'string') return null;
    const match = text.match(profanityRegex);
    return match ? match[1] : null;
}
