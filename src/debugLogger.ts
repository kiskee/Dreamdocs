import * as vscode from 'vscode';
import { GroqService } from './groqService';

export class DebugLogger {
    constructor(private groqService: GroqService) {}

    async addDebugLogs(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const position = editor.selection.active;
        const functionCode = this.extractFunction(editor.document, position);
        
        if (!functionCode) {
            vscode.window.showWarningMessage('No function found at current position');
            return;
        }

        const prompt = `Analyze this JavaScript/TypeScript function and add smart debug logs at critical points.

Add logs for:
- Function entry with parameters
- Variable assignments (important ones)
- Conditional branches (if/else outcomes)
- Loop iterations (start/end)
- API calls or async operations
- Error conditions
- Function exit with return values

Use console.log with emojis and descriptive messages. Format: console.log('🚀 [functionName] Description:', {data});

Return ONLY the modified code with debug logs added, no explanations:

${functionCode}`;

        const loggedCode = await this.groqService.generateComment(prompt);
        if (loggedCode) {
            const cleanCode = this.cleanCodeResponse(loggedCode);
            await this.replaceFunction(editor, functionCode, cleanCode);
            vscode.window.showInformationMessage('🐛 Debug logs added successfully!');
        }
    }

    async removeDebugLogs(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const position = editor.selection.active;
        const functionCode = this.extractFunction(editor.document, position);
        
        if (!functionCode) {
            vscode.window.showWarningMessage('No function found at current position');
            return;
        }

        const prompt = `Remove all debug console.log statements from this JavaScript/TypeScript function.
Keep only the original business logic code.

Return ONLY the cleaned code without any console.log statements, no explanations:

${functionCode}`;

        const cleanedCode = await this.groqService.generateComment(prompt);
        if (cleanedCode) {
            const cleanCode = this.cleanCodeResponse(cleanedCode);
            await this.replaceFunction(editor, functionCode, cleanCode);
            vscode.window.showInformationMessage('🧹 Debug logs removed successfully!');
        }
    }

    private extractFunction(document: vscode.TextDocument, position: vscode.Position): string | null {
        const text = document.getText();
        const lines = text.split('\n');
        
        const functionInfo = this.findContainingFunction(lines, position.line);
        if (!functionInfo) return null;

        return lines.slice(functionInfo.start, functionInfo.end + 1).join('\n');
    }

    private findContainingFunction(lines: string[], currentLine: number): {start: number, end: number} | null {
        const functionPatterns = [
            /^\s*(export\s+)?(default\s+)?(async\s+)?function\s+\w+/,
            /^\s*(export\s+)?(default\s+)?(const|let|var)\s+\w+\s*=\s*(async\s+)?\(/,
            /^\s*(export\s+)?(default\s+)?(const|let|var)\s+\w+\s*=\s*(async\s+)?\w+\s*=>/,
            /^\s*(public|private|protected|static|async)*\s*(async\s+)?\w+\s*\(/,
            /^\s*\w+\s*:\s*(async\s+)?\(/,
            /^\s*(async\s+)?\w+\s*\([^)]*\)\s*=>/
        ];

        const functions = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (this.isFunctionStart(line, functionPatterns)) {
                const endLine = this.findFunctionEnd(lines, i);
                if (endLine !== -1) {
                    functions.push({ start: i, end: endLine });
                }
            }
        }

        let containingFunction = null;
        for (const func of functions) {
            if (currentLine >= func.start && currentLine <= func.end) {
                if (!containingFunction || 
                    (func.start > containingFunction.start && func.end < containingFunction.end)) {
                    containingFunction = func;
                }
            }
        }

        return containingFunction;
    }

    private isFunctionStart(line: string, patterns: RegExp[]): boolean {
        if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
            return false;
        }

        if (/^\s*(if|for|while|switch|try|catch|else|return)\s*\(/.test(line)) {
            return false;
        }

        return patterns.some(pattern => pattern.test(line)) || 
               (line.includes('function') && !line.includes('return')) ||
               (line.includes('=>') && line.includes('(') && !line.includes('return'));
    }

    private findFunctionEnd(lines: string[], startLine: number): number {
        let braceCount = 0;
        let inString = false;
        let stringChar = '';
        let foundOpenBrace = false;

        for (let i = startLine; i < lines.length; i++) {
            const line = lines[i];
            
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                const prevChar = j > 0 ? line[j - 1] : '';

                if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
                    if (!inString) {
                        inString = true;
                        stringChar = char;
                    } else if (char === stringChar) {
                        inString = false;
                        stringChar = '';
                    }
                    continue;
                }

                if (inString) continue;

                if (char === '/' && j + 1 < line.length && line[j + 1] === '/') {
                    break;
                }

                if (char === '{') {
                    braceCount++;
                    foundOpenBrace = true;
                } else if (char === '}') {
                    braceCount--;
                    if (foundOpenBrace && braceCount === 0) {
                        return i;
                    }
                }
            }
        }

        return -1;
    }

    private async replaceFunction(editor: vscode.TextEditor, originalCode: string, newCode: string): Promise<void> {
        const position = editor.selection.active;
        const document = editor.document;
        const lines = document.getText().split('\n');
        
        const functionInfo = this.findContainingFunction(lines, position.line);
        
        if (functionInfo) {
            const startPos = new vscode.Position(functionInfo.start, 0);
            const endPos = new vscode.Position(functionInfo.end + 1, 0);
            const range = new vscode.Range(startPos, endPos);
            
            const indent = document.lineAt(functionInfo.start).text.match(/^\s*/)?.[0] || '';
            const formattedCode = newCode.trim()
                .split('\n')
                .map(line => line.trim() ? indent + line : line)
                .join('\n') + '\n';

            await editor.edit(editBuilder => {
                editBuilder.replace(range, formattedCode);
            });
        }
    }

    private cleanCodeResponse(code: string): string {
        return code
            .replace(/^```[a-zA-Z]*\n?/, '')
            .replace(/\n?```$/, '')
            .trim();
    }
}