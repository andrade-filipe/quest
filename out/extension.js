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
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('questlang');
    // Atualiza diagnósticos para o editor ativo (se existir)
    if (vscode.window.activeTextEditor) {
        updateDiagnostics(vscode.window.activeTextEditor.document, diagnosticCollection);
    }
    // Atualiza diagnósticos ao editar o documento
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => {
        updateDiagnostics(e.document, diagnosticCollection);
    }));
    // Atualiza diagnósticos ao abrir um documento
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(doc => {
        updateDiagnostics(doc, diagnosticCollection);
    }));
}
function updateDiagnostics(document, collection) {
    console.log(`Atualizando diagnósticos para ${document.uri} com languageId ${document.languageId}`);
    // Certifica que o arquivo é da linguagem "quest"
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
        // Divide o código em linhas (o delimitador primário)
        const lines = this.text.split('\n');
        let currentIndex = 0; // posição acumulada no texto
        for (const line of lines) {
            const trimmed = line.trim();
            const lineStart = currentIndex; // posição inicial desta linha
            currentIndex += line.length + 1; // +1 para o caractere de nova linha
            // Ignora linhas vazias
            if (trimmed === "")
                continue;
            // Tokeniza a linha pelos espaços
            const tokens = trimmed.split(/\s+/);
            const keyword = tokens[0];
            // Lista simples de tokens válidos (comandos e estruturas)
            const validTokens = [
                "move_up", "move_down", "move_left", "move_right",
                "jump", "attack", "defend",
                "if", "else", "while", "for",
                "(", ")", "{", "}"
            ];
            // Se o primeiro token não for reconhecido, emite erro
            if (!validTokens.includes(keyword)) {
                const pos = line.indexOf(keyword);
                errors.push({
                    position: lineStart + pos,
                    length: keyword.length,
                    message: `Erro sintático: comando desconhecido '${keyword}'`
                });
            }
            // Valida estruturas de controle com mensagens simples:
            if (keyword === "if") {
                if (!trimmed.includes("(") || !trimmed.includes(")")) {
                    const pos = line.indexOf("if");
                    errors.push({
                        position: lineStart + pos,
                        length: 2,
                        message: `Erro sintático: 'if' deve conter condição entre parênteses`
                    });
                }
                if (!trimmed.includes("{") || !trimmed.includes("}")) {
                    const pos = line.indexOf("if");
                    errors.push({
                        position: lineStart + pos,
                        length: 2,
                        message: `Erro sintático: 'if' deve conter blocos delimitados por '{' e '}'`
                    });
                }
            }
            else if (keyword === "while") {
                if (!trimmed.includes("(") || !trimmed.includes(")")) {
                    const pos = line.indexOf("while");
                    errors.push({
                        position: lineStart + pos,
                        length: 5,
                        message: `Erro sintático: 'while' deve conter condição entre parênteses`
                    });
                }
                if (!trimmed.includes("{") || !trimmed.includes("}")) {
                    const pos = line.indexOf("while");
                    errors.push({
                        position: lineStart + pos,
                        length: 5,
                        message: `Erro sintático: 'while' deve conter bloco delimitado por '{' e '}'`
                    });
                }
            }
            else if (keyword === "for") {
                if (!trimmed.includes("(") || !trimmed.includes(")")) {
                    const pos = line.indexOf("for");
                    errors.push({
                        position: lineStart + pos,
                        length: 3,
                        message: `Erro sintático: 'for' deve conter cláusulas entre parênteses`
                    });
                }
                if (!trimmed.includes("{") || !trimmed.includes("}")) {
                    const pos = line.indexOf("for");
                    errors.push({
                        position: lineStart + pos,
                        length: 3,
                        message: `Erro sintático: 'for' deve conter bloco delimitado por '{' e '}'`
                    });
                }
            }
        }
        return errors;
    }
}
//# sourceMappingURL=extension.js.map