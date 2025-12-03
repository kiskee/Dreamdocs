import * as vscode from 'vscode';
import { GroqService } from './groqService';
import { CommentGenerator } from './commentGenerator';
import { DebugLogger } from './debugLogger';

export function activate(context: vscode.ExtensionContext) {
    const groqService = new GroqService(context);
    const commentGenerator = new CommentGenerator(groqService);
    const debugLogger = new DebugLogger(groqService);

    // Generate JSDoc command (Ctrl+Shift+D)
    const generateJSDoc = vscode.commands.registerCommand('dreamdocs.generateJSDoc', async () => {
        await commentGenerator.generateJSDoc();
    });

    // Generate inline comment command (Ctrl+Shift+C)
    const generateInline = vscode.commands.registerCommand('dreamdocs.generateInline', async () => {
        await commentGenerator.generateInlineComment();
    });

    // Refactor naming command (Ctrl+Shift+R)
    const refactorNaming = vscode.commands.registerCommand('dreamdocs.refactorNaming', async () => {
        await commentGenerator.refactorNaming();
    });

    // Set API Key command
    const setApiKey = vscode.commands.registerCommand('dreamdocs.setApiKey', async () => {
        await groqService.setApiKey();
    });

    // Test connection command
    const testConnection = vscode.commands.registerCommand('dreamdocs.testConnection', async () => {
        await groqService.testConnection();
    });

    // Add debug logs command (Ctrl+Shift+L)
    const addDebugLogs = vscode.commands.registerCommand('dreamdocs.addDebugLogs', async () => {
        await debugLogger.addDebugLogs();
    });

    // Remove debug logs command
    const removeDebugLogs = vscode.commands.registerCommand('dreamdocs.removeDebugLogs', async () => {
        await debugLogger.removeDebugLogs();
    });

    context.subscriptions.push(generateJSDoc, generateInline, refactorNaming, setApiKey, testConnection, addDebugLogs, removeDebugLogs);
}

export function deactivate() {}