"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
const vscode = __importStar(require("vscode"));
function activate(context) {
    console.log('Extensão QuestLang ativada.');
    // Cria uma coleção de diagnósticos para a QuestLang
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('questlang');
    // Atualiza os diagnósticos quando abrir um arquivo .quest ou quando ele for alterado
    if (vscode.window.activeTextEditor) {
        updateDiagnostics(vscode.window.activeTextEditor.document, diagnosticCollection);
    }
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => updateDiagnostics(e.document, diagnosticCollection)));
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(doc => updateDiagnostics(doc, diagnosticCollection)));
}
function updateDiagnostics(document, collection) {
    console.log(`Atualizando diagnósticos para ${document.uri} com languageId ${document.languageId}`);
    if (document.languageId !== 'quest') {
        console.log('LanguageId incompatível, ignorando.');
        return;
    }
    const diagnostics = [];
    const parser = new QuestLangParser(document.getText());
    const errors = parser.parse();
    errors.forEach(error => {
        const startPos = document.positionAt(error.position);
        const endPos = document.positionAt(error.position + error.length);
        const range = new vscode.Range(startPos, endPos);
        const diagnostic = new vscode.Diagnostic(range, error.message, vscode.DiagnosticSeverity.Error);
        diagnostics.push(diagnostic);
    });
    collection.set(document.uri, diagnostics);
}
class QuestLangParser {
    constructor(text) {
        this.text = text;
    }
    parse() {
        const errors = [];
        const lines = this.text.split('\n');
        let position = 0;
        for (const line of lines) {
            // Exemplo simples: cada linha de comando deve terminar com ";"
            if (line.trim() && !line.trim().endsWith(';')) {
                errors.push({
                    position: position,
                    length: line.length,
                    message: "Erro sintático: comando deve terminar com ';'"
                });
            }
            position += line.length + 1;
        }
        // Expanda aqui as regras para if, while, for, etc.
        return errors;
    }
}
//# sourceMappingURL=extension.js.map