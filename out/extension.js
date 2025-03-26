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
    const diagnostics = vscode.languages.createDiagnosticCollection('quest');
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => updateDiagnostics(e.document, diagnostics)), vscode.workspace.onDidOpenTextDocument(doc => updateDiagnostics(doc, diagnostics)), diagnostics);
}
function updateDiagnostics(doc, collection) {
    if (doc.languageId !== 'quest')
        return;
    const parser = new QuestLangParser(doc.getText());
    const errors = parser.parse();
    const diagnostics = errors.map(e => {
        const start = doc.positionAt(e.position);
        const end = doc.positionAt(e.position + e.length);
        return new vscode.Diagnostic(new vscode.Range(start, end), e.message, vscode.DiagnosticSeverity.Error);
    });
    collection.set(doc.uri, diagnostics);
}
class QuestLangParser {
    constructor(text) {
        this.pos = 0;
        this.tokens = this.tokenize(text);
    }
    parse() {
        const errors = [];
        while (this.pos < this.tokens.length) {
            const err = this.parseStmt();
            if (err)
                errors.push(err);
        }
        return errors;
    }
    parseStmt() {
        const tok = this.peek();
        if (!tok)
            return null;
        switch (tok.type) {
            case 'MoveUp':
            case 'MoveDown':
            case 'MoveLeft':
            case 'MoveRight':
            case 'Jump':
            case 'Attack':
            case 'Defend':
                this.pos++;
                return null;
            case 'If': return this.parseIf();
            case 'While': return this.parseWhile();
            case 'For': return this.parseFor();
            default:
                return this.error(tok, `Unexpected token '${tok.lexeme}'`);
        }
    }
    parseIf() {
        const start = this.consume('If');
        if (!this.expect('LParen'))
            return this.error(start, "Expected '(' after if");
        this.pos++;
        if (!this.expect('RParen'))
            return this.error(start, "Expected ')' after if condition");
        this.pos++;
        if (!this.expect('LBrace'))
            return this.error(start, "Expected '{' for if block");
        this.skipBlock();
        if (this.peek()?.type === 'Else') {
            this.pos++;
            if (!this.expect('LBrace'))
                return this.error(start, "Expected '{' for else block");
            this.skipBlock();
        }
        return null;
    }
    parseWhile() {
        const start = this.consume('While');
        if (!this.expect('LParen'))
            return this.error(start, "Expected '(' after while");
        this.pos++;
        if (!this.expect('RParen'))
            return this.error(start, "Expected ')' after while condition");
        this.pos++;
        if (!this.expect('LBrace'))
            return this.error(start, "Expected '{' for while block");
        this.skipBlock();
        return null;
    }
    parseFor() {
        const start = this.consume('For');
        if (!this.expect('LParen'))
            return this.error(start, "Expected '(' after for");
        this.pos++;
        const parts = [false, false, false];
        let idx = this.pos;
        for (let i = 0; i < 3 && idx < this.tokens.length; i++) {
            while (idx < this.tokens.length && this.tokens[idx].type !== 'Semicolon' && this.tokens[idx].type !== 'RParen')
                idx++;
            if (this.tokens[idx]?.type === 'Semicolon') {
                parts[i] = true;
                idx++;
            }
            else
                break;
        }
        this.pos = idx;
        if (!parts.every(x => x))
            return this.error(start, "For must have three clauses separated by ';'");
        if (!this.expect('RParen'))
            return this.error(start, "Expected ')' after for clauses");
        this.pos++;
        if (!this.expect('LBrace'))
            return this.error(start, "Expected '{' for for block");
        this.skipBlock();
        return null;
    }
    skipBlock() {
        this.pos++;
        while (this.peek() && this.peek().type !== 'RBrace')
            this.pos++;
        if (this.expect('RBrace'))
            this.pos++;
    }
    peek() { return this.tokens[this.pos]; }
    consume(type) { const t = this.tokens[this.pos]; this.pos++; return t; }
    expect(type) { return this.peek()?.type === type; }
    error(tok, msg) {
        return { position: tok.pos, length: tok.lexeme.length, message: msg };
    }
    tokenize(text) {
        const patterns = [
            ['MoveUp', /^move_up\b/], ['MoveDown', /^move_down\b/], ['MoveLeft', /^move_left\b/], ['MoveRight', /^move_right\b/],
            ['Jump', /^jump\b/], ['Attack', /^attack\b/], ['Defend', /^defend\b/],
            ['If', /^if\b/], ['Else', /^else\b/], ['While', /^while\b/], ['For', /^for\b/],
            ['LParen', /^\(/], ['RParen', /^\)/], ['LBrace', /^\{/], ['RBrace', /^\}/], ['Semicolon', /^;/],
            ['Identifier', /^[a-zA-Z_][a-zA-Z0-9_]*/], ['Number', /^[0-9]+/], ['Whitespace', /^[ \t\r\n]+/], ['Comment', /^\/\/[^\n]*/]
        ];
        const tokens = [];
        let pos = 0;
        while (pos < text.length) {
            const slice = text.slice(pos);
            let matched = false;
            for (const [type, rx] of patterns) {
                const m = rx.exec(slice);
                if (m) {
                    if (type !== 'Whitespace' && type !== 'Comment')
                        tokens.push({ type, lexeme: m[0], pos });
                    pos += m[0].length;
                    matched = true;
                    break;
                }
            }
            if (!matched) {
                tokens.push({ type: 'Error', lexeme: text[pos], pos });
                pos++;
            }
        }
        return tokens;
    }
}
//# sourceMappingURL=extension.js.map