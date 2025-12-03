import * as vscode from 'vscode';
import { GroqService } from './groqService';

export class CommentGenerator {
    constructor(private groqService: GroqService) {}

    async generateJSDoc(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const position = editor.selection.active;
        const functionCode = this.extractFunction(editor.document, position);
        
        if (!functionCode) {
            vscode.window.showWarningMessage('No function found at current position');
            return;
        }

        const prompt = `Generate a complete JSDoc comment for this JavaScript/TypeScript function. 
        Include @param, @returns, @throws if necessary, and @example.
        Respond ONLY with the JSDoc comment in English, no additional explanations:

        ${functionCode}`;

        const comment = await this.groqService.generateComment(prompt);
        if (comment) {
            await this.insertJSDoc(editor, functionCode, comment);
        }
    }

    async generateInlineComment(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const position = editor.selection.active;
        const line = editor.document.lineAt(position.line);
        const code = line.text.trim();

        if (!code) {
            vscode.window.showWarningMessage('Line is empty');
            return;
        }

        const prompt = `Generate a concise inline comment for this JavaScript/TypeScript code line.
        The comment should be brief and explain what the line does.
        Respond ONLY with the comment in English (without //, no additional explanations):

        ${code}`;

        const comment = await this.groqService.generateComment(prompt);
        if (comment) {
            await this.insertInlineComment(editor, position.line, comment.replace(/^\/\/\s*/, ''));
        }
    }

    async refactorNaming(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const position = editor.selection.active;
        const functionCode = this.extractFunction(editor.document, position);
        
        if (!functionCode) {
            vscode.window.showWarningMessage('No function found at current position');
            return;
        }

        const prompt = `Analyze this JavaScript/TypeScript function and improve the naming of variables, parameters, and the function name itself.
        Follow these naming conventions:
        - Use camelCase for variables and functions
        - Use descriptive, meaningful names
        - Avoid abbreviations unless they're widely understood
        - Use verbs for functions (e.g., getUserData, calculateTotal)
        - Use nouns for variables (e.g., userData, totalAmount)
        
        Respond ONLY with the refactored code without any markdown formatting, code blocks, or explanations. Just the plain code:

        ${functionCode}`;

        const refactoredCode = await this.groqService.generateComment(prompt);
        if (refactoredCode) {
            const cleanCode = this.cleanCodeResponse(refactoredCode);
            await this.replaceFunction(editor, functionCode, cleanCode);
        }
    }

    private extractFunction(document: vscode.TextDocument, position: vscode.Position): string | null {
        const text = document.getText();
        const lines = text.split('\n');
        
        // Encontrar la función que contiene la posición actual
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

        // Buscar todas las funciones y encontrar cuál contiene la línea actual
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

        // Encontrar la función más específica (más anidada) que contiene la línea actual
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

        // Excluir líneas que son claramente estructuras de control
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

                // Manejar strings y template literals
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

                // Manejar comentarios de línea
                if (char === '/' && j + 1 < line.length && line[j + 1] === '/') {
                    break; // Resto de la línea es comentario
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

    private async insertJSDoc(editor: vscode.TextEditor, functionCode: string, comment: string): Promise<void> {
        const position = editor.selection.active;
        const document = editor.document;
        const lines = document.getText().split('\n');
        
        // Encontrar la función que contiene la posición actual
        const functionInfo = this.findContainingFunction(lines, position.line);
        
        if (functionInfo) {
            const functionStartLine = functionInfo.start;
            
            // Buscar hacia arriba para evitar decoradores y comentarios existentes
            let insertLine = functionStartLine;
            while (insertLine > 0) {
                const prevLine = document.lineAt(insertLine - 1).text.trim();
                if (prevLine.startsWith('@') || prevLine.startsWith('//') || 
                    prevLine.startsWith('/*') || prevLine.startsWith('*') || 
                    prevLine === '') {
                    insertLine--;
                } else {
                    break;
                }
            }

            const indent = document.lineAt(functionStartLine).text.match(/^\s*/)?.[0] || '';
            // Limpiar el comentario y asegurar formato correcto
            const cleanComment = comment.trim();
            const formattedComment = cleanComment
                .split('\n')
                .map(line => indent + line)
                .join('\n') + '\n';

            // Verificar si ya hay una línea vacía después de donde insertaremos
            const nextLineEmpty = insertLine < document.lineCount - 1 && 
                                 document.lineAt(insertLine).text.trim() === '';
            
            await editor.edit(editBuilder => {
                editBuilder.insert(new vscode.Position(insertLine, 0), formattedComment);
                // Si hay línea vacía extra después del comentario, eliminarla
                if (nextLineEmpty && insertLine < document.lineCount - 1) {
                    const nextLine = document.lineAt(insertLine);
                    if (nextLine.text.trim() === '') {
                        editBuilder.delete(nextLine.rangeIncludingLineBreak);
                    }
                }
            });
        }
    }

    private async insertInlineComment(editor: vscode.TextEditor, lineNumber: number, comment: string): Promise<void> {
        const line = editor.document.lineAt(lineNumber);
        const indent = line.text.match(/^\s*/)?.[0] || '';
        const commentLine = `${indent}// ${comment}\n`;

        await editor.edit(editBuilder => {
            editBuilder.insert(new vscode.Position(lineNumber, 0), commentLine);
        });
    }

    private async replaceFunction(editor: vscode.TextEditor, originalCode: string, refactoredCode: string): Promise<void> {
        const position = editor.selection.active;
        const document = editor.document;
        const lines = document.getText().split('\n');
        
        const functionInfo = this.findContainingFunction(lines, position.line);
        
        if (functionInfo) {
            const startPos = new vscode.Position(functionInfo.start, 0);
            const endPos = new vscode.Position(functionInfo.end + 1, 0);
            const range = new vscode.Range(startPos, endPos);
            
            const indent = document.lineAt(functionInfo.start).text.match(/^\s*/)?.[0] || '';
            const formattedCode = refactoredCode.trim()
                .split('\n')
                .map(line => line.trim() ? indent + line : line)
                .join('\n') + '\n';

            await editor.edit(editBuilder => {
                editBuilder.replace(range, formattedCode);
            });

            vscode.window.showInformationMessage('Function naming refactored successfully!');
        }
    }

    private cleanCodeResponse(code: string): string {
        return code
            .replace(/^```[a-zA-Z]*\n?/, '') // Remove opening code block
            .replace(/\n?```$/, '') // Remove closing code block
            .trim();
    }
}