import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  console.log('Extensão QuestLang ativada.');
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('questlang');

  // Atualiza diagnósticos para o editor ativo (se existir)
  if (vscode.window.activeTextEditor) {
    updateDiagnostics(vscode.window.activeTextEditor.document, diagnosticCollection);
  }

  // Atualiza diagnósticos ao editar o documento
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(e => {
      updateDiagnostics(e.document, diagnosticCollection);
    })
  );

  // Atualiza diagnósticos ao abrir um documento
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(doc => {
      updateDiagnostics(doc, diagnosticCollection);
    })
  );
}

function updateDiagnostics(document: vscode.TextDocument, collection: vscode.DiagnosticCollection): void {
  console.log(`Atualizando diagnósticos para ${document.uri} com languageId ${document.languageId}`);

  // Certifica que o arquivo é da linguagem "quest"
  if (document.languageId !== 'quest') {
    console.log('LanguageId incompatível, ignorando.');
    return;
  }

  const diagnostics: vscode.Diagnostic[] = [];
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

interface ParseError {
  position: number;
  length: number;
  message: string;
}

class QuestLangParser {
  private text: string;

  constructor(text: string) {
    this.text = text;
  }

  public parse(): ParseError[] {
    const errors: ParseError[] = [];
    // Divide o código em linhas (o delimitador primário)
    const lines = this.text.split('\n');
    let currentIndex = 0; // posição acumulada no texto

    for (const line of lines) {
      const trimmed = line.trim();
      const lineStart = currentIndex; // posição inicial desta linha
      currentIndex += line.length + 1; // +1 para o caractere de nova linha

      // Ignora linhas vazias
      if (trimmed === "") continue;

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
      } else if (keyword === "while") {
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
      } else if (keyword === "for") {
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
